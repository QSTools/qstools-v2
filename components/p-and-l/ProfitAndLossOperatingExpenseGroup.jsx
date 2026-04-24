"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import Tooltip from "@/components/common/Tooltip";
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

function get_line_amount_total(lines = []) {
  return (lines ?? []).reduce((total, line) => {
    return total + Number(line.amount || 0);
  }, 0);
}

function get_category_help_text(category) {
  switch (category) {
    case "labour":
      return "Feeds the Labour module benchmark. Use for wages and direct staff cost.";
    case "employee_overheads":
      return "Feeds the Employee Overheads benchmark. Use for staff-linked burden such as KiwiSaver, ACC, PPE, uniforms, training, tools, and small equipment.";
    case "assets":
      return "Feeds the Assets benchmark. Use for vehicle, plant, finance, running costs, repairs, maintenance, licences, registrations, and ownership costs.";
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide costs such as insurance, phones, internet, office, accounting, and subscriptions.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

export default function ProfitAndLossOperatingExpenseGroup({
  title,
  help,
  lines = [],
  category_options = [],
  actions,
  handle_line_name_change,
  get_suggested_category_text,
  defaultOpen = false,
}) {
  const subtotal = get_line_amount_total(lines);

  if (lines.length === 0) return null;

  return (
    <CollapsibleSection
      title={title}
      summary={format_number_with_commas(subtotal)}
      defaultOpen={defaultOpen}
    >
      <div className="ui-stack-sm">
        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">Group Guidance</span>
          <p className="ui-help">{help}</p>
        </div>

        {lines.map((line) => {
          const suggested_category_text = get_suggested_category_text(
            line.line_name,
          );

          return (
            <div key={line.pnl_line_id} className="ui-panel ui-stack-sm">
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
                  QS Category
                  <Tooltip text="This decides where the cost flows next inside QS Tools. Choosing the wrong category will affect later setup and reconciliation." />
                </span>

                <select
                  className="ui-select"
                  value={line.category}
                  onChange={(event) =>
                    actions.update_pnl_line(
                      line.pnl_line_id,
                      "category",
                      event.target.value,
                    )
                  }
                >
                  {category_options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <p className="ui-help">{get_category_help_text(line.category)}</p>
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
        })}

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{title} Subtotal</span>
          <div>{format_number_with_commas(subtotal)}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}