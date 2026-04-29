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

function is_wip_line(line_name = "") {
  const normalized = normalize_line_name(line_name);
  return (
    normalized.includes("wip") ||
    normalized.includes("work in progress") ||
    normalized.includes("opening wip") ||
    normalized.includes("closing wip") ||
    normalized.includes("wip adjustment")
  );
}

function infer_category_from_line_name(line_name = "") {
  const normalized = normalize_line_name(line_name);

  if (!normalized) return null;

  if (is_wip_line(line_name)) {
    return null;
  }

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
    normalized.includes("tools") ||
    normalized.includes("small equipment")
  ) {
    return "general_overheads";
  }

  if (
    normalized.includes("fuel") ||
    normalized.includes("diesel") ||
    normalized.includes("petrol") ||
    normalized.includes("motor vehicle") ||
    normalized.includes("vehicle") ||
    normalized.includes("registration") ||
    normalized.includes("registrations") ||
    normalized.includes("rego") ||
    normalized.includes("licence") ||
    normalized.includes("licences") ||
    normalized.includes("license") ||
    normalized.includes("licenses") ||
    normalized.includes("repair") ||
    normalized.includes("repairs") ||
    normalized.includes("maintenance") ||
    normalized.includes("servicing")
  ) {
    return "general_overheads";
  }

  if (
    normalized.includes("plant") ||
    normalized.includes("asset finance") ||
    normalized.includes("equipment finance") ||
    normalized.includes("finance lease") ||
    normalized.includes("lease interest") ||
    normalized.includes("ownership")
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
      return "Feeds the Labour benchmark. Use for wages and direct labour burden.";
    case "assets":
      return "Feeds the Assets benchmark. Use for owned plant, equipment, asset finance, and ownership-related costs.";
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide overheads, staff overheads, shared vehicle running costs, office, admin, insurance, and compliance.";
    case "review_required":
      return "Review required. This line has been identified as a WIP accounting adjustment and needs further review before model assignment.";
    case "excluded":
      return "Excluded from QS cost model. This WIP cost will not be included in the QS recovery benchmark.";
    case "cogs":
      return "Included as COGS / Direct Job Cost for QS benchmark and reconciliation.";
    case "income":
      return "Income / Revenue Timing Adjustment. This line is treated as timing-related revenue rather than an operating cost.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

function build_line_category_options(line, category_options) {
  if (is_wip_line(line.line_name)) {
    return [
      {
        value: "review_required",
        label: "WIP / Accounting Adjustment",
        review_subcategory: "wip_accounting_adjustment",
        wip_treatment: "unresolved",
      },
      {
        value: "excluded",
        label: "Exclude from QS Cost Model",
        review_subcategory: "wip_accounting_adjustment_excluded",
        wip_treatment: "excluded_from_qs_cost_model",
      },
      {
        value: "cogs",
        label: "Include as COGS / Direct Job Cost",
        review_subcategory: "wip_direct_job_cost",
        wip_treatment: "include_as_direct_job_cost",
      },
      {
        value: "income",
        label: "Income / Revenue Timing Adjustment",
        review_subcategory: "wip_income_timing_adjustment",
        wip_treatment: "income_timing_adjustment",
      },
      ...category_options,
    ];
  }

  return category_options;
}

function get_suggested_category_text(line_name) {
  const suggested_category = infer_category_from_line_name(line_name);

  if (!suggested_category) return null;

  switch (suggested_category) {
    case "labour":
      return "Suggested: Labour";
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
      return "Classify costs to drive Labour, Assets, and General Overheads setup.";
    default:
      return "";
  }
}

function get_section_default_open(section) {
  switch (section) {
    case "trading_income":
    case "cost_of_sales":
    case "other_income":
    case "operating_expenses":
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
    return "assets_equipment";
  }

  if (category === "general_overheads") {
    if (
      name.includes("vehicle") ||
      name.includes("motor") ||
      name.includes("fuel") ||
      name.includes("diesel") ||
      name.includes("petrol") ||
      name.includes("registration") ||
      name.includes("registrations") ||
      name.includes("rego") ||
      name.includes("licence") ||
      name.includes("licences") ||
      name.includes("license") ||
      name.includes("licenses") ||
      name.includes("repair") ||
      name.includes("repairs") ||
      name.includes("maintenance") ||
      name.includes("servicing")
    ) {
      return "vehicles_running";
    }

    if (
      name.includes("tool") ||
      name.includes("tools") ||
      name.includes("ppe") ||
      name.includes("uniform") ||
      name.includes("uniforms") ||
      name.includes("training") ||
      name.includes("small equipment")
    ) {
      return "staff_overheads";
    }

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
    defaultOpen: false,
  },
  {
    key: "staff_overheads",
    title: "Staff Overheads",
    help: "Staff-linked and shared people support costs such as PPE, uniforms, training, tools, phones, small equipment, and similar overheads. These feed General Overheads in v3.5.",
    defaultOpen: false,
  },
  {
    key: "vehicles_running",
    title: "Vehicles (Running)",
    help: "Shared vehicle fuel, licences, registrations, repairs, servicing, and maintenance. These feed General Overheads unless they are later assigned to a specific asset layer.",
    defaultOpen: false,
  },
  {
    key: "assets_equipment",
    title: "Assets / Equipment",
    help: "Plant, equipment, asset finance, ownership-related costs, and asset costs that are not shared vehicle running costs.",
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
    defaultOpen: false,
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
  const local_category_options = build_line_category_options(line, category_options);
  const effective_category =
    is_wip_line(line.line_name) && (line.category === "unassigned" || !line.category)
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
          QS Category
          <Tooltip text="This decides where the cost flows next inside QS Tools. Choosing the wrong category will affect later setup and reconciliation." />
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
            <option
              key={`${option.value}-${option.label}`}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <p className="ui-help">{get_category_help_text(effective_category)}</p>

        {is_wip_line(line.line_name) ? (
          <div className="ui-panel ui-stack-sm theme-warn-soft">
            <span className="ui-label">WIP Decision Guide</span>
            <p className="ui-help">
              QS Tools cannot classify this WIP line from the P&L alone. Check
              the WIP schedule, accountant journal, or source detail, then
              choose the treatment below. If this is only a year-end accounting,
              tax, or timing adjustment, exclude it from the QS cost model. If
              it represents real direct job costs for the model period, include
              it as COGS / Direct Job Cost. If it relates to revenue timing,
              treat it as Income / Revenue Timing Adjustment. If unsure, leave
              it as Review Required.
            </p>
            <ul className="ui-list">
              <li>
                <strong>Review Required:</strong> blocks readiness until this
                WIP is resolved.
              </li>
              <li>
                <strong>Exclude from QS Cost Model:</strong> removes the line
                from QS benchmark and recovery.
              </li>
              <li>
                <strong>Include as COGS / Direct Job Cost:</strong> includes
                the line in benchmark/reconciliation.
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

    if (
      is_wip_line(next_line_name) &&
      (line.category === "unassigned" || !line.category)
    ) {
      actions.update_pnl_line(
        line.pnl_line_id,
        "category",
        "review_required",
      );
      return;
    }

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
              PPE, uniforms, training, tools, staff support costs, phones, and
              shared staff overheads usually belong in{" "}
              <strong>General Overheads</strong>.
            </div>
            <div className="ui-help">
              Vehicle fuel, licences, registrations, repairs, and maintenance
              usually belong in <strong>General Overheads</strong> for the macro
              setup layer.
            </div>
            <div className="ui-help">
              Owned plant, equipment, asset finance, and asset ownership costs
              usually belong in <strong>Assets</strong>.
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