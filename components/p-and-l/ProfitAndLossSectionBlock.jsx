"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";
import Tooltip from "@/components/common/Tooltip";
import ProfitAndLossOperatingExpenseGroup from "@/components/p-and-l/ProfitAndLossOperatingExpenseGroup";
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
    normalized.includes("payroll") ||
    normalized.includes("kiwisaver") ||
    normalized.includes("kiwi saver") ||
    normalized.includes("esct") ||
    normalized.includes("acc levy") ||
    normalized.includes("acc ") ||
    normalized === "acc"
  ) {
    return "labour";
  }

  if (
    normalized.includes("uniform") ||
    normalized.includes("training") ||
    normalized.includes("ppe") ||
    normalized.includes("tool") ||
    normalized.includes("equipment")
  ) {
    return "employee_overheads";
  }

  if (
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("plant") ||
    normalized.includes("trailer") ||
    normalized.includes("fuel") ||
    normalized.includes("registration") ||
    normalized.includes("registrations") ||
    normalized.includes("licence") ||
    normalized.includes("licences") ||
    normalized.includes("license") ||
    normalized.includes("licenses") ||
    normalized.includes("repair") ||
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
      return "Feeds the Labour module benchmark. Use for wages and employer labour burden such as KiwiSaver, ESCT, and ACC.";
    case "employee_overheads":
      return "Feeds the Employee Overheads benchmark. Use for staff-linked overheads such as PPE, uniforms, training, tools, small equipment, and similar support costs.";
    case "assets":
      return "Feeds the Assets benchmark. Use for vehicle, plant, finance, running costs, repairs, maintenance, licences, registrations, and ownership costs.";
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
  return "Classify costs to drive Labour, Overheads, and Assets setup.";
    default:
      return "";
  }
}

function get_section_default_open(section) {
  switch (section) {
    case "trading_income":
      return false;
    case "cost_of_sales":
      return false;
    case "other_income":
      return false;
    case "operating_expenses":
      return false;
    default:
      return false;
  }
}

function get_operating_expense_group_key(line) {
  const name = normalize_line_name(line.line_name);
  const category = line.category ?? "unassigned";

  if (
    name.includes("kiwisaver") ||
    name.includes("kiwi saver") ||
    name.includes("acc levy") ||
    name.includes("acc ") ||
    name === "acc"
  ) {
    return "labour";
  }

  if (
    name.includes("travel") ||
    name.includes("entertainment") ||
    name.includes("penalt")
  ) {
    return "other_unallocated";
  }

  if (category === "labour") {
    return "labour";
  }

  if (category === "employee_overheads") {
    return "staff_overheads";
  }

  if (category === "assets") {
    if (name.includes("tool") || name.includes("equipment")) {
      return "staff_overheads";
    }

    if (
      name.includes("vehicle") ||
      name.includes("fuel") ||
      name.includes("registration") ||
      name.includes("registrations") ||
      name.includes("licence") ||
      name.includes("licences") ||
      name.includes("license") ||
      name.includes("licenses") ||
      name.includes("motor") ||
      name.includes("repair") ||
      name.includes("repairs") ||
      name.includes("maintenance")
    ) {
      return "vehicles_running";
    }

    return "assets_equipment";
  }

  if (category === "general_overheads") {
    if (
      name.includes("accounting") ||
      name.includes("legal") ||
      name.includes("bank fees") ||
      name.includes("bookkeeper")
    ) {
      return "financial_admin";
    }

    if (name.includes("insurance")) {
      return "insurance_compliance";
    }

    if (
      name.includes("rent") ||
      name.includes("power") ||
      name.includes("cleaning") ||
      name.includes("storage")
    ) {
      return "facilities_premises";
    }

    if (name.includes("advertising") || name.includes("marketing")) {
      return "sales_growth";
    }

    return "office_admin";
  }

  return "other_unallocated";
}

const OPERATING_EXPENSE_GROUPS = [
  {
    key: "labour",
    title: "Labour",
    help: "Wages and employer labour burden that should benchmark against the Labour module, including Salary & Wages, KiwiSaver, and ACC.",
    defaultOpen: true,
  },
  {
    key: "staff_overheads",
    title: "Staff Overheads",
    help: "Staff-linked support costs such as PPE, uniforms, training, tools, small equipment, and similar overheads.",
    defaultOpen: true,
  },
  {
    key: "vehicles_running",
    title: "Vehicles (Running)",
    help: "Vehicle fuel, licences, registrations, repairs, maintenance, and running costs that benchmark against the Assets module.",
    defaultOpen: true,
  },
  {
    key: "assets_equipment",
    title: "Assets / Equipment",
    help: "Plant, asset finance, ownership-related costs, and asset costs that are not vehicle running costs.",
    defaultOpen: false,
  },
  {
    key: "office_admin",
    title: "Office / Admin",
    help: "General office, admin, software, phone, internet, and business running costs.",
    defaultOpen: false,
  },
  {
    key: "financial_admin",
    title: "Financial Admin",
    help: "Accounting, bookkeeping, legal, bank fees, and finance administration.",
    defaultOpen: false,
  },
  {
    key: "insurance_compliance",
    title: "Insurance & Compliance",
    help: "Insurance, compliance, and related business cover.",
    defaultOpen: false,
  },
  {
    key: "facilities_premises",
    title: "Facilities / Premises",
    help: "Premises, rent, power, cleaning, storage, and site/office facility costs.",
    defaultOpen: false,
  },
  {
    key: "sales_growth",
    title: "Sales / Growth",
    help: "Advertising, marketing, and growth-related overheads.",
    defaultOpen: false,
  },
  {
    key: "other_unallocated",
    title: "Other / Unallocated",
    help: "Travel, entertainment, penalties, unusual costs, and lines that still need review.",
    defaultOpen: true,
  },
];

function group_operating_expense_lines(lines = []) {
  return OPERATING_EXPENSE_GROUPS.map((group) => ({
    ...group,
    lines: lines.filter(
      (line) => get_operating_expense_group_key(line) === group.key,
    ),
  }));
}

function ProfitAndLossLineRow({
  line,
  category_options,
  actions,
  handle_line_name_change,
}) {
  const suggested_category_text = get_suggested_category_text(line.line_name);

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

  const operating_expense_groups = group_operating_expense_lines(lines);

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
              Salary &amp; Wages, KiwiSaver, ESCT, and ACC usually belong in{" "}
              <strong>Labour</strong>.
            </div>
            <div className="ui-help">
              PPE, uniforms, training, tools, and small equipment usually belong
              in <strong>Employee Overheads</strong>.
            </div>
            <div className="ui-help">
              Vehicles, fuel, licences, registrations, repairs, and maintenance
              usually belong in <strong>Assets</strong>.
            </div>
            <div className="ui-help">
              Insurance, phones, internet, office, accounting, and general
              business running costs usually belong in{" "}
              <strong>General Overheads</strong>.
            </div>
            <div className="ui-help">
              Travel, entertainment, penalties, and unusual one-off costs should
              usually be reviewed under <strong>Other / Unallocated</strong>.
            </div>
            <div className="ui-help">
              If classification is wrong here, the next modules will not line up
              properly.
            </div>
          </div>
        ) : null}

        {section === "operating_expenses" ? (
          <div className="ui-stack-sm">
            {operating_expense_groups.map((group) => (
              <ProfitAndLossOperatingExpenseGroup
                key={group.key}
                title={group.title}
                help={group.help}
                lines={group.lines}
                category_options={category_options}
                actions={actions}
                handle_line_name_change={handle_line_name_change}
                get_suggested_category_text={get_suggested_category_text}
                defaultOpen={group.defaultOpen}
              />
            ))}
          </div>
        ) : (
          <div className="ui-stack-sm">
            {lines.map((line) => (
              <ProfitAndLossLineRow
                key={line.pnl_line_id}
                line={line}
                category_options={category_options}
                actions={actions}
                handle_line_name_change={handle_line_name_change}
              />
            ))}
          </div>
        )}

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