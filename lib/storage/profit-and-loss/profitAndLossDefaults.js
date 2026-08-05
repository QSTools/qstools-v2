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

export function create_pnl_line({
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

export function make_direct_cost_category_id(name = "") {
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
    category_id: "subcontracting_general",
    category_name: "Subcontracting - General",
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
