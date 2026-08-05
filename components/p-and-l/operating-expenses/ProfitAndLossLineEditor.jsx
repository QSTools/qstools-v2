import Tooltip from "@/components/common/Tooltip";
import { MoneyInput } from "@/components/p-and-l/operating-expenses/operatingExpenseFormatting";
import {
  build_line_category_options,
  get_category_help_text,
  get_interest_treatment_help_text,
  get_operating_expense_classification_option_value,
  get_option_help_text,
  is_interest_line,
  is_wip_line,
  normalise_interest_treatment,
} from "@/components/p-and-l/operating-expenses/operatingExpenseClassification";

export default function ProfitAndLossLineEditor({
  line,
  actions,
  handle_line_name_change,
  get_suggested_category_text,
}) {
  const suggested_category_text = get_suggested_category_text(line.line_name);
  const show_interest_treatment = is_interest_line(line);

  const local_category_options = build_line_category_options(line);
  const current_option_value =
    get_operating_expense_classification_option_value(line);

  const effective_category =
    is_wip_line(line.line_name) &&
    (line.category === "unassigned" || !line.category)
      ? "review_required"
      : line.category || "unassigned";

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-stack-sm">
        <span className="ui-label">Line Name</span>
        <input
          className="ui-input"
          value={line.line_name}
          placeholder="Enter line name"
          onChange={(event) =>
            handle_line_name_change(line, event.target.value)
          }
        />

        {suggested_category_text ? (
          <p className="ui-help">{suggested_category_text}</p>
        ) : null}
      </div>

      <div className="ui-stack-sm">
        <span className="ui-label">Amount</span>
        <MoneyInput
          value={line.amount}
          onChange={(value) =>
            actions.update_pnl_line(line.pnl_line_id, "amount", value)
          }
        />
      </div>

      <div className="ui-stack-sm">
        <span className="ui-label inline-flex items-center gap-2">
          Mirra Category
          <Tooltip text="This decides where the cost flows next inside Mirra. Choosing the wrong category will affect later setup and reconciliation." />
        </span>

        <select
          className="ui-select"
          value={current_option_value}
          onChange={(event) => {
            const selectedValue = event.target.value;
            const selectedOption = local_category_options.find(
              (option) => option.value === selectedValue,
            );

            if (!selectedOption) return;

            actions.update_pnl_line(
              line.pnl_line_id,
              "category",
              selectedOption.category || selectedValue,
            );

            actions.update_pnl_line(
              line.pnl_line_id,
              "review_subcategory",
              selectedOption.review_subcategory || "",
            );

            if (selectedOption?.wip_treatment) {
              actions.update_pnl_line(
                line.pnl_line_id,
                "wip_treatment",
                selectedOption.wip_treatment,
              );
            } else if (selectedValue === "review_required") {
              actions.update_pnl_line(
                line.pnl_line_id,
                "wip_treatment",
                "unresolved",
              );
            }
          }}
        >
          {local_category_options.map((option) => (
            <option key={`${option.value}-${option.label}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <p className="ui-help">
          {get_option_help_text(current_option_value) ||
            get_category_help_text(effective_category)}
        </p>

        {is_wip_line(line.line_name) ? (
          <div className="ui-panel ui-stack-sm theme-warn-soft">
            <span className="ui-label">WIP Decision Guide</span>

            <p className="ui-help">
              Mirra cannot classify this WIP line from the P&amp;L alone. Check
              the WIP schedule, accountant journal, or source detail, then
              choose the correct treatment.
            </p>

            <ul className="ui-list">
              <li>
                <strong>Review Required:</strong> blocks readiness until this WIP
                is resolved.
              </li>
              <li>
                <strong>Exclude from Mirra Cost Model:</strong> removes the line
                from benchmark and recovery.
              </li>
              <li>
                <strong>Include as COGS / Direct Job Cost:</strong> includes the
                line in benchmark/reconciliation.
              </li>
              <li>
                <strong>Income / Revenue Timing Adjustment:</strong> treats the
                line as timing-related revenue, not an operating cost.
              </li>
            </ul>

            {Math.abs(Number(line.amount || 0)) > 10000 ? (
              <p className="ui-help theme-warn">
                This WIP amount is material and should be reviewed carefully.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {show_interest_treatment ? (
        <div className="ui-stack-sm">
          <div className="ui-panel ui-stack-sm">
            <span className="ui-label">Why this matters</span>

            <p className="ui-help">
              Interest lines can include bank interest, overdraft interest, or
              asset finance interest.
            </p>

            <p className="ui-help">
              The Assets module records asset finance cost separately, so this
              flag can later be compared with Assets finance cost.
            </p>

            <p className="ui-help">
              Select whether this P&amp;L interest line contains asset finance
              interest.
            </p>
          </div>

          <span className="ui-label inline-flex items-center gap-2">
            Interest Classification
            <Tooltip text="Select the factual condition for this interest line. Mirra decides the treatment." />
          </span>

          <select
            className="ui-select"
            value={normalise_interest_treatment(line.interest_treatment)}
            onChange={(event) =>
              actions.update_pnl_line(
                line.pnl_line_id,
                "interest_treatment",
                event.target.value,
              )
            }
          >
            <option value="not_reviewed">Not reviewed</option>
            <option value="contains_asset_finance_interest">
              Contains asset finance interest
            </option>
            <option value="no_asset_finance_interest">
              Does not contain asset finance interest
            </option>
          </select>

          <p className="ui-help">
            {get_interest_treatment_help_text(
              line.interest_treatment || "not_reviewed",
            )}
          </p>
        </div>
      ) : null}

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-danger"
          onClick={() => actions.remove_pnl_line(line.pnl_line_id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

