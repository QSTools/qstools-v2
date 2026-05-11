"use client";

import { useState } from "react";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import Tooltip from "@/components/common/Tooltip";
import ProfitAndLossOperatingExpenseGroup from "@/components/p-and-l/ProfitAndLossOperatingExpenseGroup";
import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

function format_money(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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

function get_line_amount_total(lines = []) {
  return (lines ?? []).reduce((total, line) => {
    return total + Number(line.amount || 0);
  }, 0);
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

function infer_direct_cost_category_id(line_name = "") {
  const normalized = normalize_line_name(line_name);

  if (!normalized) return "other_direct_costs";

  if (
    normalized.includes("material") ||
    normalized.includes("materials") ||
    normalized.includes("purchase") ||
    normalized.includes("purchases") ||
    normalized.includes("stock") ||
    normalized.includes("supplies")
  ) {
    return "materials";
  }

  if (
    normalized.includes("subcontract") ||
    normalized.includes("sub contractor") ||
    normalized.includes("contractor") ||
    normalized.includes("labour hire")
  ) {
    return "subcontract_labour";
  }

  if (
    normalized.includes("hire") ||
    normalized.includes("equipment hire") ||
    normalized.includes("plant hire") ||
    normalized.includes("machine hire") ||
    normalized.includes("scaffold")
  ) {
    return "hired_equipment_plant";
  }

  if (
    normalized.includes("freight") ||
    normalized.includes("cartage") ||
    normalized.includes("delivery") ||
    normalized.includes("transport")
  ) {
    return "freight_cartage";
  }

  if (
    normalized.includes("waste") ||
    normalized.includes("tipping") ||
    normalized.includes("tip") ||
    normalized.includes("dump") ||
    normalized.includes("disposal")
  ) {
    return "waste_tipping";
  }

  if (
    normalized.includes("consumable") ||
    normalized.includes("consumables") ||
    normalized.includes("sundry") ||
    normalized.includes("fixings") ||
    normalized.includes("adhesive")
  ) {
    return "direct_consumables";
  }

  return "other_direct_costs";
}

function get_category_help_text(category) {
  switch (category) {
    case "revenue":
      return "P&L benchmark only. This stays on the P&L page as income context.";
    case "labour":
      return "Feeds the Labour benchmark. Use for wages and direct labour burden.";
    case "assets":
      return "Feeds the Assets benchmark. Use for owned plant, equipment, asset finance, and ownership-related costs.";
    case "general_overheads":
      return "Feeds the General Overheads benchmark. Use for business-wide overheads, staff overheads, shared vehicle running costs, office, admin, insurance, and compliance.";
    case "review_required":
      return "Review required. This line needs further review before model assignment.";
    case "excluded":
      return "Excluded from Mirra cost model. This cost will not be included in the recovery benchmark.";
    case "cogs":
      return "Included as Materials / Cost of Goods Sold for benchmark and reconciliation.";
    case "income":
      return "Income / Revenue Timing Adjustment. This line is treated as timing-related revenue rather than an operating cost.";
    case "unassigned":
    default:
      return "Not ready yet. Leave here only if you still need to decide where this line belongs.";
  }
}

function detect_operating_expense_subcategory(line_name = "") {
  const normalized = String(line_name).trim().toLowerCase();

  if (
    normalized.includes("salary") ||
    normalized.includes("wages") ||
    normalized.includes("payroll")
  ) {
    return {
      category: "labour",
      subcategory: "salary_wages",
      label: "Salary & Wages",
    };
  }

  if (normalized.includes("kiwisaver") || normalized.includes("kiwi saver")) {
    return {
      category: "labour",
      subcategory: "employer_kiwisaver",
      label: "KiwiSaver",
    };
  }

  if (normalized.includes("acc levy") || normalized.includes("acc ")) {
    return {
      category: "labour",
      subcategory: "employer_acc",
      label: "ACC Levy",
    };
  }

  if (
    normalized.includes("staff expense") ||
    normalized.includes("staff expenses") ||
    normalized.includes("staff welfare") ||
    normalized.includes("staff amenities") ||
    normalized.includes("staff support")
  ) {
    return {
      category: "general_overheads",
      subcategory: "staff_overheads",
      label: "Staff Overheads",
    };
  }

  if (normalized.includes("entertainment")) {
    return {
      category: "general_overheads",
      subcategory: "staff_overheads",
      label: "Entertainment",
    };
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
    return {
      category: "general_overheads",
      subcategory: "vehicle_running_costs",
      label: "Vehicle Running Costs",
    };
  }

  if (
    normalized.includes("computer") ||
    normalized.includes("printing") ||
    normalized.includes("stationery") ||
    normalized.includes("office") ||
    normalized.includes("supplies") ||
    normalized.includes("phone") ||
    normalized.includes("telephone") ||
    normalized.includes("internet") ||
    normalized.includes("software") ||
    normalized.includes("subscription")
  ) {
    return {
      category: "general_overheads",
      subcategory: "office_admin",
      label: "Office / Admin",
    };
  }

  if (
    normalized.includes("asset finance") ||
    normalized.includes("equipment finance") ||
    normalized.includes("finance lease")
  ) {
    return {
      category: "assets",
      subcategory: "asset_finance",
      label: "Asset Finance",
    };
  }

  if (normalized.includes("mixed") || normalized.includes("mixed finance")) {
    return {
      category: "review_required",
      subcategory: "mixed_finance",
      label: "Mixed Finance",
    };
  }

  if (normalized.includes("accounting") || normalized.includes("bookkeeper")) {
    return {
      category: "general_overheads",
      subcategory: "finance_admin",
      label: "Accounting / Admin",
    };
  }

  if (
    normalized.includes("bank fees") ||
    normalized.includes("loan interest") ||
    normalized.includes("finance") ||
    normalized.includes("interest")
  ) {
    return {
      category: "general_overheads",
      subcategory: "finance_interest",
      label: "Finance / Interest",
    };
  }

  if (normalized.includes("insurance")) {
    return {
      category: "general_overheads",
      subcategory: "insurance_compliance",
      label: "Insurance / Compliance",
    };
  }

  if (
    normalized.includes("legal") ||
    normalized.includes("compliance") ||
    normalized.includes("audit")
  ) {
    return {
      category: "general_overheads",
      subcategory: "insurance_compliance",
      label: "Insurance / Compliance",
    };
  }

  if (normalized.includes("travel")) {
    return {
      category: "general_overheads",
      subcategory: "travel",
      label: "Travel",
    };
  }

  if (normalized.includes("advertising") || normalized.includes("marketing")) {
    return {
      category: "general_overheads",
      subcategory: "sales_growth",
      label: "Sales / Growth",
    };
  }

  if (
    normalized.includes("penalt") ||
    normalized.includes("fee") ||
    normalized.includes("fine") ||
    normalized.includes("non-deductible")
  ) {
    return {
      category: "excluded",
      subcategory: "penalties_non_deductible",
      label: "Penalties / Non-Deductible",
    };
  }

  if (
    normalized.includes("excluded") ||
    normalized.includes("non-qs") ||
    normalized.includes("non qs")
  ) {
    return {
      category: "excluded",
      subcategory: "excluded_non_qs",
      label: "Excluded / Non-QS Cost",
    };
  }

  if (normalized.includes("other") || normalized.includes("review required")) {
    return {
      category: "review_required",
      subcategory: "other_review_required",
      label: "Other / Review Required",
    };
  }

  return null;
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
        label: "Exclude from Mirra Cost Model",
        review_subcategory: "wip_accounting_adjustment_excluded",
        wip_treatment: "excluded_from_qs_cost_model",
      },
      {
        value: "cogs",
        label: "Include as Materials / Cost of Goods Sold",
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

  const operating_expense_classification = detect_operating_expense_subcategory(
    line.line_name,
  );

  if (operating_expense_classification) {
    const { category, subcategory, label } = operating_expense_classification;

    return [
      {
        value: category,
        label: `${label} → ${category === "general_overheads"
            ? "General Overheads"
            : category === "labour"
              ? "Labour"
              : category === "assets"
                ? "Assets"
                : category === "excluded"
                  ? "Excluded"
                  : category === "review_required"
                    ? "Review Required"
                    : category
          }`,
        review_subcategory: subcategory,
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

function make_custom_direct_cost_category_id(name = "") {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `custom_${slug || Date.now()}`;
}

function get_direct_cost_categories(state = {}) {
  return Array.isArray(state.direct_cost_categories)
    ? state.direct_cost_categories.filter(
      (category) => category?.is_active !== false,
    )
    : [];
}

function get_direct_cost_category_name(state = {}, category_id = "") {
  const matched_category = get_direct_cost_categories(state).find(
    (category) => category.category_id === category_id,
  );

  return matched_category?.category_name || "Other direct costs";
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
      return "Classify the costs directly attached to producing, buying, or delivering what you sell.";
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

  if (category === "excluded") {
    return "excluded_items";
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
    help: "Staff-linked and shared people support costs such as PPE, uniforms, training, tools, phones, small equipment, and similar overheads. These feed General Overheads.",
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
    key: "excluded_items",
    title: "Excluded Items",
    help: "Penalties, non-deductible costs, and other items excluded from the Mirra cost model.",
    defaultOpen: false,
  },
  {
    key: "other_unallocated",
    title: "Other / Unallocated",
    help: "Travel, entertainment, unusual costs, and lines that still need review.",
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

function get_cost_of_sales_group_key(line) {
  const category = line.category || "unassigned";

  if (is_wip_line(line.line_name)) {
    return "__review_required";
  }

  if (category === "review_required") {
    return "__review_required";
  }

  if (category === "excluded") {
    return "__excluded";
  }

  if (category === "unassigned" || !category) {
    return "__unassigned";
  }

  if (category === "cogs") {
    return (
      line.direct_cost_category_id ||
      infer_direct_cost_category_id(line.line_name)
    );
  }

  return "__review_required";
}

function group_cost_of_sales_lines(state = {}, lines = []) {
  const reserved_category_ids = [
    "review_required",
    "__review_required",
    "excluded",
    "__excluded",
    "unassigned",
    "__unassigned",
  ];

  const direct_cost_categories = get_direct_cost_categories(state).filter(
    (category) => !reserved_category_ids.includes(category.category_id),
  );

  const base_groups = direct_cost_categories
    .map((category) => {
      const group_lines = lines.filter(
        (line) => get_cost_of_sales_group_key(line) === category.category_id,
      );

      return {
        key: `direct_${category.category_id}`,
        group_key: category.category_id,
        title: category.category_name,
        help: "Direct costs attached to producing, buying, or delivering what you sell.",
        defaultOpen: false,
        is_custom: category.is_default === false,
        lines: group_lines,
      };
    })
    .filter((group) => group.lines.length > 0 || group.is_custom);

  const review_group = {
    key: "__review_required",
    group_key: "__review_required",
    title: "Review Required",
    help: "Lines that need review before Mirra can trust the Cost of Sales baseline.",
    defaultOpen: true,
    lines: lines.filter(
      (line) => get_cost_of_sales_group_key(line) === "__review_required",
    ),
  };

  const excluded_group = {
    key: "__excluded",
    group_key: "__excluded",
    title: "Excluded",
    help: "Lines excluded from the Mirra cost model.",
    defaultOpen: false,
    lines: lines.filter(
      (line) => get_cost_of_sales_group_key(line) === "__excluded",
    ),
  };

  const unassigned_group = {
    key: "__unassigned",
    group_key: "__unassigned",
    title: "Unassigned",
    help: "Lines that still need a direct cost category.",
    defaultOpen: true,
    lines: lines.filter(
      (line) => get_cost_of_sales_group_key(line) === "__unassigned",
    ),
  };

  const system_groups = [review_group, excluded_group, unassigned_group].filter(
    (group) => group.lines.length > 0,
  );

  return [...base_groups, ...system_groups];
}

function ProfitAndLossLineRow({
  line,
  state,
  category_options,
  actions,
  handle_line_name_change,
}) {
  const [custom_direct_cost_category_name, set_custom_direct_cost_category_name] =
    useState("");

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

      {line.section === "cost_of_sales" ? (
        <div className="ui-panel ui-stack-sm">
          <div>
            <span className="ui-label">Add custom direct cost category</span>
            <p className="ui-help">
              Add categories specific to your business only when the default
              direct cost groups are not enough.
            </p>
          </div>

          <div className="ui-actions">
            <input
              className="ui-input"
              value={custom_direct_cost_category_name}
              placeholder="Example: Stock purchases"
              onChange={(event) =>
                set_custom_direct_cost_category_name(event.target.value)
              }
            />
            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => {
                const category_name = custom_direct_cost_category_name.trim();
                if (!category_name) return;

                const now = new Date().toISOString();
                const category = {
                  category_id: make_custom_direct_cost_category_id(
                    category_name,
                  ),
                  category_name,
                  is_default: false,
                  is_active: true,
                  created_at: now,
                  updated_at: now,
                };

                actions.update_profit_and_loss_field("direct_cost_categories", [
                  ...(state.direct_cost_categories ?? []),
                  category,
                ]);

                actions.update_pnl_line(line.pnl_line_id, "category", "cogs");
                actions.update_pnl_line(
                  line.pnl_line_id,
                  "direct_cost_category_id",
                  category.category_id,
                );

                set_custom_direct_cost_category_name("");
              }}
            >
              Add Category
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfitAndLossCostOfSalesLineRow({
  line,
  state,
  actions,
  handle_line_name_change,
}) {
  const current_group_key = get_cost_of_sales_group_key(line);
  const direct_cost_categories = get_direct_cost_categories(state);

  const select_value =
    line.category === "cogs"
      ? `direct:${current_group_key}`
      : line.category || "unassigned";

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
          Direct Cost Category
          <Tooltip text="This groups Cost of Sales into useful direct cost categories for Mirra's benchmark view." />
        </span>

        <select
          className="ui-select"
          value={select_value}
          onChange={(event) => {
            const selected_value = event.target.value;

            if (selected_value.startsWith("direct:")) {
              const direct_cost_category_id = selected_value.replace(
                "direct:",
                "",
              );

              actions.update_pnl_line(line.pnl_line_id, "category", "cogs");
              actions.update_pnl_line(
                line.pnl_line_id,
                "direct_cost_category_id",
                direct_cost_category_id,
              );
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                direct_cost_category_id,
              );
              return;
            }

            actions.update_pnl_line(
              line.pnl_line_id,
              "category",
              selected_value,
            );

            if (selected_value === "review_required") {
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                "direct_cost_review_required",
              );
              actions.update_pnl_line(
                line.pnl_line_id,
                "wip_treatment",
                "unresolved",
              );
            }

            if (selected_value === "excluded") {
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                "excluded_non_qs",
              );
            }

            if (selected_value === "unassigned") {
              actions.update_pnl_line(
                line.pnl_line_id,
                "review_subcategory",
                "",
              );
            }
          }}
        >
          {direct_cost_categories.map((category) => (
            <option
              key={category.category_id}
              value={`direct:${category.category_id}`}
            >
              {category.category_name} → Materials / Cost of Goods Sold
            </option>
          ))}

          <option value="review_required">Review required</option>
          <option value="excluded">Excluded / Non-Mirra Cost</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <p className="ui-help">
          {line.category === "cogs"
            ? `${get_direct_cost_category_name(
              state,
              current_group_key,
            )} is treated as Materials / Cost of Goods Sold.`
            : get_category_help_text(line.category || "unassigned")}
        </p>
      </div>

      {is_wip_line(line.line_name) ? (
        <div className="ui-panel ui-stack-sm theme-warn-soft">
          <span className="ui-label">WIP Decision Guide</span>
          <p className="ui-help">
            Mirra cannot classify this WIP line from the P&amp;L alone. Check
            the WIP schedule, accountant journal, or source detail, then choose
            the correct treatment.
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

function CostOfSalesGroup({ group, state, actions, handle_line_name_change }) {
  const subtotal = get_line_amount_total(group.lines);
  const line_label = group.lines.length === 1 ? "line" : "lines";

  return (
    <CollapsibleSection
      title={group.title}
      summary={`${format_money(subtotal)} · ${group.lines.length} ${line_label}`}
      defaultOpen={group.defaultOpen}
    >
      <div className="ui-stack-sm">
        <div className="ui-panel ui-stack-sm">
          <span className="ui-label">{group.title}</span>
          <p className="ui-help">{group.help}</p>
        </div>

        {group.lines.map((line) => (
          <ProfitAndLossCostOfSalesLineRow
            key={line.pnl_line_id}
            line={line}
            state={state}
            actions={actions}
            handle_line_name_change={handle_line_name_change}
          />
        ))}

        <div className="ui-panel ui-row-between">
          <span className="ui-label">{group.title} subtotal</span>
          <strong>{format_money(subtotal)}</strong>
        </div>
      </div>
    </CollapsibleSection>
  );
}

function CustomDirectCostCategoryPanel({ state, actions }) {
  const [custom_direct_cost_category_name, set_custom_direct_cost_category_name] =
    useState("");

  return (
    <div className="ui-panel ui-stack-sm">
      <span className="ui-label">Add a Cost of Sales category</span>
      <p className="ui-help">
        Add a business-specific Cost of Sales category, such as stock purchases,
        product packaging, merchant fees, fulfilment costs, or production supplies.
      </p>

      <div className="ui-actions">
        <input
          className="ui-input"
          value={custom_direct_cost_category_name}
          placeholder="Example: Traffic management"
          onChange={(event) =>
            set_custom_direct_cost_category_name(event.target.value)
          }
        />

        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => {
            const category_name = custom_direct_cost_category_name.trim();
            if (!category_name) return;

            const now = new Date().toISOString();
            const category = {
              category_id: make_custom_direct_cost_category_id(category_name),
              category_name,
              is_default: false,
              is_active: true,
              created_at: now,
              updated_at: now,
            };

            actions.update_profit_and_loss_field("direct_cost_categories", [
              ...(state.direct_cost_categories ?? []),
              category,
            ]);

            set_custom_direct_cost_category_name("");
          }}
        >
          Add Category
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

    if (line.section === "cost_of_sales") {
      if (line.category === "unassigned" || !line.category) {
        const direct_cost_category_id =
          infer_direct_cost_category_id(next_line_name);

        actions.update_pnl_line(line.pnl_line_id, "category", "cogs");
        actions.update_pnl_line(
          line.pnl_line_id,
          "direct_cost_category_id",
          direct_cost_category_id,
        );
        actions.update_pnl_line(
          line.pnl_line_id,
          "review_subcategory",
          direct_cost_category_id,
        );
      }

      return;
    }

    const specific_classification = detect_operating_expense_subcategory(
      next_line_name,
    );

    const suggested_category =
      specific_classification?.category ||
      infer_category_from_line_name(next_line_name);

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

      if (specific_classification?.subcategory) {
        actions.update_pnl_line(
          line.pnl_line_id,
          "review_subcategory",
          specific_classification.subcategory,
        );
      }
    }
  }

  const operating_expense_groups = group_operating_expense_lines(lines);
  const cost_of_sales_groups = group_cost_of_sales_lines(state, lines);

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

        {section === "cost_of_sales" ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-label">Direct cost classification</div>
            <div className="ui-help">
              Start with the main Cost of Sales categories. Open a category only
              when you need to review or reclassify the lines inside it.
            </div>
            <div className="ui-help">
              These are the costs directly attached to producing, buying, or
              delivering what you sell.
            </div>
          </div>
        ) : null}

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

        {section === "cost_of_sales" ? (
          <div className="ui-stack-sm">
            {cost_of_sales_groups.map((group) => (
              <CostOfSalesGroup
                key={group.key}
                group={group}
                state={state}
                actions={actions}
                handle_line_name_change={handle_line_name_change}
              />
            ))}

            <CustomDirectCostCategoryPanel state={state} actions={actions} />
          </div>
        ) : section === "operating_expenses" ? (
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
                state={state}
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