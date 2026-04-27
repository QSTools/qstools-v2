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

function is_interest_line(line) {
  return String(line?.line_name || "")
    .toLowerCase()
    .includes("interest");
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

function get_interest_treatment_help_text(interest_treatment) {
  switch (interest_treatment) {
    case "asset_finance_exclude":
      return "This whole interest line will be excluded from QS benchmark costs because it contains asset finance already handled in the Assets module.";
    case "general_overhead_keep":
      return "This interest line will stay in QS benchmark costs because it is confirmed as pure general finance with no asset finance included.";
    case "unknown":
    default:
      return "Review this line. If it contains any vehicle, plant, or equipment finance interest, exclude the whole line to prevent double counting.";
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
          const show_interest_treatment = is_interest_line(line);

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

              {show_interest_treatment ? (
                <div className="ui-stack-sm">
                  <div className="ui-panel ui-stack-sm">
                    <span className="ui-label">Why this matters</span>

                    <p className="ui-help">
                      Your P&amp;L usually groups all interest together. This can
                      include both asset finance and general finance in the same
                      line.
                    </p>

                    <p className="ui-help">
                      Asset finance means vehicle, plant, or equipment finance.
                      General finance means overdrafts, bank loans, tax
                      interest, or other non-asset borrowing.
                    </p>

                    <p className="ui-help">
                      In QS Tools, asset finance is already captured in the
                      Assets module as part of total ownership cost. If it is
                      also left in this P&amp;L line, it will be counted twice.
                    </p>

                    <p className="ui-help">
                      Do not split the number. Treat the whole line one way.
                    </p>

                    <p className="ui-help">
                      <strong>If this line contains any asset finance:</strong>
                      <br />
                      exclude the whole line and let the Assets module handle it.
                    </p>

                    <p className="ui-help">
                      <strong>Only keep it</strong> if you are confident it is
                      purely general finance with no asset-related interest
                      included.
                    </p>
                  </div>

                  <span className="ui-label inline-flex items-center gap-2">
                    Classify Interest (Prevents Double Counting)
                    <Tooltip text="If this line contains any asset finance interest, exclude the whole line from QS benchmark costs. Only keep it if it is purely general finance." />
                  </span>

                  <select
                    className="ui-select"
                    value={line.interest_treatment || "unknown"}
                    onChange={(event) =>
                      actions.update_pnl_line(
                        line.pnl_line_id,
                        "interest_treatment",
                        event.target.value,
                      )
                    }
                  >
                    <option value="unknown">Review needed</option>
                    <option value="asset_finance_exclude">
                      Contains asset finance — exclude from QS cost
                    </option>
                    <option value="general_overhead_keep">
                      Pure general finance — keep in QS cost
                    </option>
                  </select>

                  <p className="ui-help">
                    {get_interest_treatment_help_text(
                      line.interest_treatment || "unknown",
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
        })}

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{title} Subtotal</span>
          <div>{format_number_with_commas(subtotal)}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}