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

function normalize_line_name(value = "") {
  return String(value).trim().toLowerCase();
}

function infer_category_from_line_name(line_name = "") {
  const normalized = normalize_line_name(line_name);

  if (!normalized) return null;

  if (
    normalized.includes("salary") ||
    normalized.includes("salaries") ||
    normalized.includes("wages") ||
    normalized.includes("payroll")
  ) {
    return "labour";
  }

  if (
    normalized.includes("kiwisaver") ||
    normalized.includes("kiwi saver") ||
    normalized.includes("acc levy") ||
    normalized.includes("acc ") ||
    normalized === "acc" ||
    normalized.includes("uniform") ||
    normalized.includes("training") ||
    normalized.includes("ppe")
  ) {
    return "employee_overheads";
  }

  if (
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("plant") ||
    normalized.includes("equipment") ||
    normalized.includes("tool") ||
    normalized.includes("trailer") ||
    normalized.includes("fuel") ||
    normalized.includes("registration") ||
    normalized.includes("repairs") ||
    normalized.includes("maintenance")
  ) {
    return "assets";
  }

  if (
    normalized.includes("insurance") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("internet") ||
    normalized.includes("office") ||
    normalized.includes("accounting") ||
    normalized.includes("legal") ||
    normalized.includes("subscription") ||
    normalized.includes("bank fees") ||
    normalized.includes("admin") ||
    normalized.includes("advertising") ||
    normalized.includes("software")
  ) {
    return "general_overheads";
  }

  return null;
}

function get_category_help_text(category) {
  switch (category) {
    case "revenue":
      return "P&L benchmark only. This stays on the P&L page as income context.";
    case "cogs_materials":
      return "P&L benchmark only. Use for direct materials cost shown in Cost of Sales.";
    case "cogs_subcontract":
      return "P&L benchmark only. Use for direct subcontract cost shown in Cost of Sales.";
    case "cogs_hire":
      return "P&L benchmark only. Use for direct hire cost shown in Cost of Sales.";
    case "labour":
      return "Feeds the Labour module benchmark. Use for wages and direct staff cost.";
    case "employee_overheads":
      return "Feeds the Employee Overheads benchmark. Use for staff-linked burden such as KiwiSaver, ACC, PPE, uniforms, and training.";
    case "assets":
      return "Feeds the Assets benchmark. Use for vehicle, plant, equipment, tools, and ownership/running costs.";
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide costs such as insurance, phones, internet, office, accounting, and subscriptions.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

function get_suggested_category_text(line_name) {
  const suggested_category = infer_category_from_line_name(line_name);

  if (!suggested_category) return null;

  switch (suggested_category) {
    case "labour":
      return "Suggested: Labour";
    case "employee_overheads":
      return "Suggested: Employee Overheads";
    case "assets":
      return "Suggested: Assets";
    case "general_overheads":
      return "Suggested: General Overheads";
    default:
      return null;
  }
}

function get_section_lines(pnl_lines = [], section) {
  return (pnl_lines ?? []).filter((line) => line.section === section);
}

function get_section_title(section) {
  switch (section) {
    case "trading_income":
      return "Trading Income";
    case "cost_of_sales":
      return "Cost of Sales";
    case "other_income":
      return "Other Income";
    case "operating_expenses":
      return "Operating Expenses";
    default:
      return "Section";
  }
}

function get_section_help(section) {
  switch (section) {
    case "trading_income":
      return "Enter income lines as they appear on your P&L.";
    case "cost_of_sales":
      return "Enter direct delivery costs as they appear on your P&L.";
    case "other_income":
      return "Enter any non-trading income shown on the P&L.";
    case "operating_expenses":
      return "This is the critical classification section. These lines drive the downstream setup for Labour, Employee Overheads, Assets, and General Overheads.";
    default:
      return "";
  }
}

function get_section_default_open(section) {
  switch (section) {
    case "trading_income":
      return true;
    case "cost_of_sales":
      return true;
    case "other_income":
      return false;
    case "operating_expenses":
      return true;
    default:
      return true;
  }
}

export default function ProfitAndLossSectionBlock({
  section,
  state,
  category_options,
  actions,
  summary = {},
}) {
  const lines = get_section_lines(state.pnl_lines, section);
  const title = get_section_title(section);
  const help = get_section_help(section);

  let subtotal_label = "";
  let subtotal_value = "";

  if (section === "trading_income") {
    subtotal_label = "Total Trading Income";
    subtotal_value = summary.total_trading_income;
  } else if (section === "cost_of_sales") {
    subtotal_label = "Total Cost of Sales";
    subtotal_value = summary.total_cost_of_sales;
  } else if (section === "other_income") {
    subtotal_label = "Total Other Income";
    subtotal_value = summary.total_other_income;
  } else if (section === "operating_expenses") {
    subtotal_label = "Total Operating Expenses";
    subtotal_value = summary.total_operating_expenses;
  }

  function handle_line_name_change(line, next_line_name) {
    actions.update_pnl_line(line.pnl_line_id, "line_name", next_line_name);

    const suggested_category = infer_category_from_line_name(next_line_name);
    if (!suggested_category) return;

    const current_category = line.category ?? "unassigned";
    const is_current_manual =
      current_category !== "unassigned" && current_category !== "";

    if (!is_current_manual) {
      actions.update_pnl_line(
        line.pnl_line_id,
        "category",
        suggested_category,
      );
    }
  }

  return (
    <CollapsibleSection
      title={title}
      summary={help}
      defaultOpen={get_section_default_open(section)}
    >
      <div className="ui-stack">
        <div className="ui-actions">
          <div className="ui-stack-sm">
            <span className="ui-kicker">{title}</span>
          </div>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => actions.add_pnl_line(section)}
          >
            Add Custom Line
          </button>
        </div>

        {section === "operating_expenses" ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-label">Important</div>
            <div className="ui-help">
              This is the most important classification section on the page.
            </div>
            <div className="ui-help">
              Salary &amp; Wages usually belongs in <strong>Labour</strong>.
            </div>
            <div className="ui-help">
              KiwiSaver, ACC, PPE, uniforms, and staff-linked burden usually
              belong in <strong>Employee Overheads</strong>.
            </div>
            <div className="ui-help">
              Vehicles, plant, tools, and ownership/running costs usually belong
              in <strong>Assets</strong>.
            </div>
            <div className="ui-help">
              Insurance, phones, internet, office, accounting, and general
              business running costs usually belong in{" "}
              <strong>General Overheads</strong>.
            </div>
            <div className="ui-help">
              If classification is wrong here, the next modules will not line up
              properly.
            </div>
          </div>
        ) : null}

        <div className="ui-stack-sm">
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

                  <p className="ui-help">
                    {get_category_help_text(line.category)}
                  </p>
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
        </div>

        <div className="ui-actions justify-end">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => actions.add_pnl_line(section)}
          >
            Add Custom Line
          </button>
        </div>

        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{subtotal_label}</span>
          <div>{subtotal_value}</div>
        </div>
      </div>
    </CollapsibleSection>
  );
}