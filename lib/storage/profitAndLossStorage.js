"use client";

import { useEffect, useState } from "react";

function get_default_financial_year() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // NZ financial year: 1 Apr -> 31 Mar
  return month >= 4 ? year + 1 : year;
}

function make_pnl_line_id() {
  return `pnl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function create_pnl_line({
  line_name = "",
  amount = 0,
  section = "operating_expenses",
  category = "unassigned",
  interest_treatment = "not_reviewed",
  review_subcategory = "",
  direct_cost_category_id = "",
} = {}) {
  return {
    pnl_line_id: make_pnl_line_id(),
    line_name,
    amount,
    section,
    category,
    interest_treatment,
    review_subcategory,
    direct_cost_category_id,
  };
}

function make_direct_cost_category_id(name = "") {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `custom_${slug || Date.now()}`;
}

export const DEFAULT_DIRECT_COST_CATEGORIES = [
  {
    category_id: "materials",
    category_name: "Materials",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "subcontract_labour",
    category_name: "Subcontract labour",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "hired_equipment_plant",
    category_name: "Hired equipment / plant",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "freight_cartage",
    category_name: "Freight / cartage",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "waste_tipping",
    category_name: "Waste / tipping",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "direct_consumables",
    category_name: "Direct consumables",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "other_direct_costs",
    category_name: "Other direct costs",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
  {
    category_id: "review_required",
    category_name: "Review required",
    is_default: true,
    is_active: true,
    created_at: "",
    updated_at: "",
  },
];

function get_legacy_direct_cost_category_id(category = "") {
  switch (category) {
    case "cogs_materials":
      return "materials";
    case "cogs_subcontract":
      return "subcontract_labour";
    case "cogs_hire":
      return "hired_equipment_plant";
    case "cogs":
      return "other_direct_costs";
    default:
      return "";
  }
}

function normalize_direct_cost_categories(categories = []) {
  const seen = new Set();
  const normalized = [];

  [...DEFAULT_DIRECT_COST_CATEGORIES, ...(categories ?? [])].forEach((category) => {
    const category_name = String(category?.category_name || "").trim();
    const category_id =
      category?.category_id || make_direct_cost_category_id(category_name);

    if (!category_id || seen.has(category_id)) return;

    seen.add(category_id);
    normalized.push({
      category_id,
      category_name:
        category_name ||
        DEFAULT_DIRECT_COST_CATEGORIES.find(
          (item) => item.category_id === category_id,
        )?.category_name ||
        "Custom direct cost",
      is_default: Boolean(
        category?.is_default ??
          DEFAULT_DIRECT_COST_CATEGORIES.some(
            (item) => item.category_id === category_id,
          ),
      ),
      is_active: category?.is_active !== false,
      created_at: category?.created_at || "",
      updated_at: category?.updated_at || "",
    });
  });

  return normalized;
}

export function createDirectCostCategory(category_name = "") {
  const now = new Date().toISOString();
  const clean_name = String(category_name || "").trim();

  return {
    category_id: make_direct_cost_category_id(clean_name),
    category_name: clean_name,
    is_default: false,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

function normalize_interest_treatment(value) {
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

export const PNL_SECTION_OPTIONS = [
  "trading_income",
  "cost_of_sales",
  "other_income",
  "operating_expenses",
];

export const PNL_CATEGORY_OPTIONS = [
  "revenue",
  "cogs",
  "cogs_materials",
  "cogs_subcontract",
  "cogs_hire",
  "labour",
  "assets",
  "general_overheads",
  "unassigned",
];

export const DEFAULT_PROFIT_AND_LOSS_STATE = {
  financial_year: get_default_financial_year(),
  period_month: "",
  pnl_lines: [
    create_pnl_line({
      line_name: "Sales",
      amount: 0,
      section: "trading_income",
      category: "revenue",
    }),
    create_pnl_line({
      line_name: "Materials",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "materials",
    }),
    create_pnl_line({
      line_name: "Subcontract Labour",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "subcontract_labour",
    }),
    create_pnl_line({
      line_name: "Subcontract Services",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "subcontract_labour",
    }),
    create_pnl_line({
      line_name: "Equipment Hire",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "hired_equipment_plant",
    }),
    create_pnl_line({
      line_name: "Freight / Cartage",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "freight_cartage",
    }),
    create_pnl_line({
      line_name: "Waste Disposal",
      amount: 0,
      section: "cost_of_sales",
      category: "cogs",
      direct_cost_category_id: "waste_tipping",
    }),
    create_pnl_line({
      line_name: "WIP Adjustment",
      amount: 0,
      section: "cost_of_sales",
      category: "unassigned",
    }),
    create_pnl_line({
      line_name: "Other Income",
      amount: 0,
      section: "other_income",
      category: "unassigned",
    }),

    create_pnl_line({
      line_name: "Salary & Wages",
      amount: 0,
      section: "operating_expenses",
      category: "labour",
      review_subcategory: "salary_wages",
    }),
    create_pnl_line({
      line_name: "KiwiSaver Employer Contributions",
      amount: 0,
      section: "operating_expenses",
      category: "labour",
      review_subcategory: "employer_kiwisaver",
    }),
    create_pnl_line({
      line_name: "ACC Levy",
      amount: 0,
      section: "operating_expenses",
      category: "labour",
      review_subcategory: "employer_acc",
    }),

    create_pnl_line({
      line_name: "Staff Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "staff_overheads",
    }),
    create_pnl_line({
      line_name: "Tools & Equipment",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),

    create_pnl_line({
      line_name: "Motor Vehicle Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "Fuel",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "Licences & Registrations",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "Repairs & Maintenance",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
    }),
    create_pnl_line({
      line_name: "Interest Expense",
      amount: 0,
      section: "operating_expenses",
      category: "assets",
      interest_treatment: "not_reviewed",
    }),

    create_pnl_line({
      line_name: "Accounting Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "finance_admin",
    }),
    create_pnl_line({
      line_name: "Administration Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Advertising",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "sales_growth",
    }),
    create_pnl_line({
      line_name: "Bank Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "finance_interest",
    }),
    create_pnl_line({
      line_name: "Cleaning",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Computer Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "office_admin",
    }),
    create_pnl_line({
      line_name: "Insurance",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "insurance_compliance",
    }),
    create_pnl_line({
      line_name: "Legal Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "insurance_compliance",
    }),
    create_pnl_line({
      line_name: "Office Expenses",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Printing & Stationery",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "office_admin",
    }),
    create_pnl_line({
      line_name: "Storage Fees",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Subscriptions",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),
    create_pnl_line({
      line_name: "Telephone & Internet",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
    }),

    create_pnl_line({
      line_name: "Entertainment",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "staff_overheads",
    }),
    create_pnl_line({
      line_name: "Entertainment - Non Deductible",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "staff_overheads",
    }),
    create_pnl_line({
      line_name: "Penalties & Fees",
      amount: 0,
      section: "operating_expenses",
      category: "excluded",
      review_subcategory: "penalties_non_deductible",
    }),
    create_pnl_line({
      line_name: "Travel - National",
      amount: 0,
      section: "operating_expenses",
      category: "general_overheads",
      review_subcategory: "travel",
    }),
  ],
  direct_cost_categories: DEFAULT_DIRECT_COST_CATEGORIES,
};

const PROFIT_AND_LOSS_STATE_STORAGE_KEY = "qs_tools_profit_and_loss_state";

function sanitize_profit_and_loss_state(input = {}) {
  const fallback = DEFAULT_PROFIT_AND_LOSS_STATE;

  return {
    ...fallback,
    ...input,
    financial_year: input?.financial_year ?? fallback.financial_year,
    period_month: input?.period_month ?? fallback.period_month,
    direct_cost_categories: normalize_direct_cost_categories(
      input?.direct_cost_categories ?? fallback.direct_cost_categories,
    ),
    pnl_lines: Array.isArray(input?.pnl_lines)
      ? input.pnl_lines.map((line) => ({
          ...line,
          category:
            line?.category === "employee_overheads"
              ? "general_overheads"
              : line?.category === "cogs_materials" ||
                  line?.category === "cogs_subcontract" ||
                  line?.category === "cogs_hire"
                ? "cogs"
              : line?.category ?? "unassigned",
          interest_treatment: normalize_interest_treatment(
            line?.interest_treatment,
          ),
          direct_cost_category_id:
            line?.direct_cost_category_id ||
            get_legacy_direct_cost_category_id(line?.category),
        }))
      : fallback.pnl_lines,
  };
}

function read_stored_profit_and_loss_state() {
  if (typeof window === "undefined") {
    return DEFAULT_PROFIT_AND_LOSS_STATE;
  }

  try {
    const raw = window.localStorage.getItem(PROFIT_AND_LOSS_STATE_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_PROFIT_AND_LOSS_STATE;
    }

    return sanitize_profit_and_loss_state(JSON.parse(raw));
  } catch {
    return DEFAULT_PROFIT_AND_LOSS_STATE;
  }
}

export function useProfitAndLossStorage() {
  const [profit_and_loss_state, set_profit_and_loss_state] = useState(
    DEFAULT_PROFIT_AND_LOSS_STATE,
  );
  const [is_editing, set_is_editing] = useState(true);
  const [has_hydrated, set_has_hydrated] = useState(false);

  useEffect(() => {
    const stored_state = read_stored_profit_and_loss_state();
    set_profit_and_loss_state(stored_state);
    set_has_hydrated(true);
  }, []);

  useEffect(() => {
    if (!has_hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      PROFIT_AND_LOSS_STATE_STORAGE_KEY,
      JSON.stringify(profit_and_loss_state),
    );
  }, [profit_and_loss_state, has_hydrated]);

  function update_profit_and_loss_field(field, value) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function add_pnl_line(section = "operating_expenses") {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      pnl_lines: [
        ...(prev.pnl_lines ?? []),
        create_pnl_line({
          section,
          category: section === "trading_income" ? "revenue" : "unassigned",
        }),
      ],
    }));
  }

  function update_pnl_line(pnl_line_id, field, value) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      pnl_lines: (prev.pnl_lines ?? []).map((line) =>
        line.pnl_line_id === pnl_line_id
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    }));
  }

  function add_direct_cost_category(category_name) {
    const clean_name = String(category_name || "").trim();
    if (!clean_name) return null;

    const category = createDirectCostCategory(clean_name);

    set_profit_and_loss_state((prev) => ({
      ...prev,
      direct_cost_categories: normalize_direct_cost_categories([
        ...(prev.direct_cost_categories ?? []),
        category,
      ]),
    }));

    return category;
  }

  function remove_pnl_line(pnl_line_id) {
    set_profit_and_loss_state((prev) => ({
      ...prev,
      pnl_lines: (prev.pnl_lines ?? []).filter(
        (line) => line.pnl_line_id !== pnl_line_id,
      ),
    }));
  }

  function replace_profit_and_loss_state(next_state) {
    set_profit_and_loss_state(sanitize_profit_and_loss_state(next_state));
  }

  function reset_profit_and_loss_state() {
    set_profit_and_loss_state(DEFAULT_PROFIT_AND_LOSS_STATE);
  }

  function toggle_edit() {
    set_is_editing((prev) => !prev);
  }

  return {
    profit_and_loss_state,
    set_profit_and_loss_state: replace_profit_and_loss_state,
    update_profit_and_loss_field,
    add_pnl_line,
    update_pnl_line,
    add_direct_cost_category,
    remove_pnl_line,
    reset_profit_and_loss_state,
    is_editing,
    toggle_edit,
  };
}
