import { create_empty_general_overhead_state } from "@/lib/storage/generalOverheadStorage";
import { to_number } from "@/hooks/general-overheads/generalOverheadHookUtils";

function normalise_name(value) {
  return String(value || "").trim().toLowerCase();
}

function matches_keywords(name, keywords = []) {
  return keywords.some((keyword) => name.includes(keyword));
}

function normalise_pnl_category(category) {
  switch (category) {
    case "employee_overheads":
      return "general_overheads";
    case "cogs_materials":
    case "cogs_subcontract":
    case "cogs_hire":
      return "cogs";
    default:
      return category || "unassigned";
  }
}

function is_excluded_operating_expense_category(category) {
  return [
    "revenue",
    "cogs",
    "direct_costs",
    "labour",
    "assets",
    "excluded",
  ].includes(normalise_pnl_category(category));
}

function is_interest_line(line) {
  return normalise_name(line?.line_name).includes("interest");
}

function normalise_interest_treatment(value) {
  switch (value) {
    case "asset_finance_exclude":
      return "contains_asset_finance_interest";
    case "general_overhead_keep":
      return "no_asset_finance_interest";
    case "unknown":
    case "not_reviewed":
    case undefined:
    case null:
    case "":
      return "not_reviewed";
    default:
      return value;
  }
}

function create_synced_interest_item(line, amount, index) {
  const interest_treatment = normalise_interest_treatment(
    line?.interest_treatment
  );
  const source_id =
    line?.pnl_line_id || `${normalise_name(line?.line_name)}-${index}`;

  return {
    synced_overhead_id: `pnl-interest-${source_id}`,
    synced_overhead_name: line?.line_name || "P&L Interest",
    synced_overhead_amount: amount,
    source_module: "p_and_l",
    source_pnl_line_id: line?.pnl_line_id || "",
    source_line_name: line?.line_name || "",
    source_review_subcategory: line?.review_subcategory || "",
    source_category: line?.category || "",
    overhead_category_key: "finance_interest",
    interest_treatment,
    contains_asset_finance_interest:
      interest_treatment === "contains_asset_finance_interest",
  };
}

function get_overhead_category_key_for_line(line = {}) {
  const name = normalise_name(line.line_name);
  const review_subcategory = normalise_name(line.review_subcategory);

  switch (review_subcategory) {
    case "staff_overheads":
      return "staff_overheads";
    case "office_admin":
      return "office_admin";
    case "finance_admin":
      return "financial_admin";
    case "finance_interest":
      return "finance_interest";
    case "insurance_compliance":
      return "insurance_compliance";
    case "sales_growth":
      return "sales_growth";
    case "travel":
      return "travel";
    case "vehicle_running_costs":
      return "vehicles_running";
    default:
      break;
  }

  if (
    matches_keywords(name, [
      "fuel",
      "diesel",
      "petrol",
      "motor vehicle",
      "vehicle",
      "rego",
      "registration",
      "licence",
      "licences",
      "license",
      "licenses",
      "repair",
      "repairs",
      "maintenance",
      "service",
      "servicing",
    ])
  ) {
    return "vehicles_running";
  }

  if (
    matches_keywords(name, [
      "accounting",
      "accountant",
      "bookkeeper",
      "legal",
      "lawyer",
      "solicitor",
      "bank",
    ])
  ) {
    return "financial_admin";
  }

  if (
    matches_keywords(name, [
      "public liability",
      "liability insurance",
      "professional indemnity",
      "indemnity insurance",
      "asset insurance",
      "vehicle insurance",
      "plant insurance",
      "fleet insurance",
      "equipment insurance",
      "insurance",
    ])
  ) {
    return "insurance_compliance";
  }

  if (
    matches_keywords(name, [
      "software",
      "subscription",
      "subscriptions",
      "computer",
      "telephone",
      "phone",
      "internet",
      "stationery",
      "office expenses",
      "office supplies",
      "printing",
      "admin",
      "administration",
      "staff",
      "ppe",
      "uniform",
      "uniforms",
      "training",
      "tools",
      "small equipment",
    ])
  ) {
    return "office_admin";
  }

  if (
    matches_keywords(name, [
      "rent",
      "storage",
      "premises",
      "power",
      "electricity",
      "cleaning",
      "cleaner",
      "cleaners",
      "cleaning services",
    ])
  ) {
    return "facilities_premises";
  }

  if (matches_keywords(name, ["advertising", "marketing"])) {
    return "sales_growth";
  }

  return "other_unallocated";
}

function create_synced_pnl_overhead_item(line, amount, index) {
  if (is_interest_line(line)) {
    return create_synced_interest_item(line, amount, index);
  }

  const source_id =
    line?.pnl_line_id || `${normalise_name(line?.line_name)}-${index}`;

  return {
    synced_overhead_id: `pnl-overhead-${source_id}`,
    synced_overhead_name: line?.line_name || "P&L Operating Expense",
    synced_overhead_amount: amount,
    source_module: "p_and_l",
    source_pnl_line_id: line?.pnl_line_id || "",
    source_line_name: line?.line_name || "",
    source_review_subcategory: line?.review_subcategory || "",
    source_category: line?.category || "",
    source_section: line?.section || "",
    overhead_category_key: get_overhead_category_key_for_line(line),
    interest_treatment: "",
    contains_asset_finance_interest: false,
  };
}

export function build_pnl_sync_signature(pnl_output_contract = {}) {
  const operating_expense_lines = Array.isArray(
    pnl_output_contract?.operating_expense_lines
  )
    ? pnl_output_contract.operating_expense_lines
    : [];

  return JSON.stringify(
    operating_expense_lines.map((line, index) => ({
      index,
      pnl_line_id: line?.pnl_line_id || "",
      line_name: line?.line_name || "",
      amount: to_number(line?.amount),
      section: line?.section || "",
      category: line?.category || "",
      review_subcategory: line?.review_subcategory || "",
      interest_treatment: line?.interest_treatment || "",
    }))
  );
}

export function build_general_overheads_from_pnl({
  pnl_output_contract,
  current_overhead_state,
}) {
  const operating_expense_lines = Array.isArray(
    pnl_output_contract?.operating_expense_lines
  )
    ? pnl_output_contract.operating_expense_lines
    : [];

  const timestamp = new Date().toISOString();

  const next_state = {
    ...create_empty_general_overhead_state(),

    overhead_profile_id:
      current_overhead_state?.overhead_profile_id ||
      create_empty_general_overhead_state().overhead_profile_id,

    owner_scope_id: current_overhead_state?.owner_scope_id || "",

    overhead_profile_name:
      current_overhead_state?.overhead_profile_name ||
      "General Overheads from P&L",

    profile_version: Number(current_overhead_state?.profile_version || 1),

    effective_from:
      current_overhead_state?.effective_from ||
      current_overhead_state?.created_at ||
      "",

    is_active: current_overhead_state?.is_active !== false,

    created_at: current_overhead_state?.created_at || timestamp,
    updated_at: timestamp,

    change_reason: current_overhead_state?.change_reason || "",
    notes: current_overhead_state?.notes || "",

    synced_pnl_overhead_items: [],

    custom_overhead_items: Array.isArray(
      current_overhead_state?.custom_overhead_items
    )
      ? current_overhead_state.custom_overhead_items
      : [],

    overhead_category_overrides:
      current_overhead_state?.overhead_category_overrides ?? {},
    system_allocation_overrides:
      current_overhead_state?.system_allocation_overrides ?? {},
    system_allocation_amount_overrides:
      current_overhead_state?.system_allocation_amount_overrides ?? {},
  };

  for (const [index, line] of operating_expense_lines.entries()) {
    const amount = to_number(line.amount);
    const review_subcategory = normalise_name(line.review_subcategory);

    if (amount === 0) {
      continue;
    }

    if (is_excluded_operating_expense_category(line.category)) {
      continue;
    }

    if (
      review_subcategory &&
      [
        "wip_accounting_adjustment",
        "wip_accounting_adjustment_excluded",
        "wip_direct_job_cost",
        "wip_income_timing_adjustment",
      ].includes(review_subcategory)
    ) {
      continue;
    }

    next_state.synced_pnl_overhead_items = [
      ...(next_state.synced_pnl_overhead_items ?? []),
      create_synced_pnl_overhead_item(line, amount, index),
    ];
  }

  return next_state;
}
