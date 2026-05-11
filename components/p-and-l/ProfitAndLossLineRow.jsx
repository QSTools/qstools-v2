"use client";

import Tooltip from "@/components/common/Tooltip";
import {
  build_line_category_options,
  get_category_help_text,
  get_suggested_category_text,
  is_wip_line,
} from "@/lib/p-and-l/profitAndLossClassificationRules";
import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

function MoneyInput({ value, onChange, disabled = false }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className="ui-input"
      value={format_number_with_commas(value)}
      onChange={(event) => onChange(parse_number_string(event.target.value))}
      disabled={disabled}
    />
  );
}

export default function ProfitAndLossLineRow({
  line,
  category_options,
  actions,
  handle_line_name_change,
}) {
  const suggested_category_text = get_suggested_category_text(line.line_name);
  const local_category_options = build_line_category_options(
    line,
    category_options,
  );

  const effective_category =
    is_wip_line(line.line_name) &&
    (line.category === "unassigned" || !line.category)
      ? "review_required"
      : line.category;

  return (
    <div key={line.pnl_line_id} className="ui-panel ui-stack-sm">
      <div className="ui-stack-sm">
        <span className="ui-label">Line Name</span>
        <input
          className="ui-input"
          value={line.line_name}
          placeholder="Enter line name"
          onChange={(event) => handle_line_name_change(line, event.target.value)}
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
          value={effective_category}
          onChange={(event) => {
            const selectedValue = event.target.value;
            const selectedOption = local_category_options.find(
              (option) => option.value === selectedValue,
            );

            actions.update_pnl_line(
              line.pnl_line_id,
              "category",
              selectedValue,
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

            if (selectedOption?.review_subcategory) {
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                selectedOption.review_subcategory,
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

        <p className="ui-help">{get_category_help_text(effective_category)}</p>

        {is_wip_line(line.line_name) ? (
          <div className="ui-panel ui-stack-sm theme-warn-soft">
            <span className="ui-label">WIP Decision Guide</span>
            <p className="ui-help">
              Mirra cannot classify this WIP line from the P&amp;L alone. Check
              the WIP schedule, accountant journal, or source detail, then choose
              the treatment below.
            </p>
          </div>
        ) : null}
      </div>

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
