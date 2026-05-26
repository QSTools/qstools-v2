function to_number(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalise_category(category) {
  if (category === "employee_overheads") {
    return "general_overheads";
  }

  if (
    category === "cogs_materials" ||
    category === "cogs_subcontract" ||
    category === "cogs_hire"
  ) {
    return "cogs";
  }

  return category || "unassigned";
}

const REVIEW_DIRECT_COST_CATEGORY_IDS = new Set([
  "",
  "review_required",
  "imported_review_required",
  "__review_required",
  "unassigned",
  "__unassigned",
]);

const DEFAULT_DIRECT_COST_CATEGORIES = [
  { category_id: "materials", category_name: "Materials", is_default: true },
  {
    category_id: "subcontract_labour",
    category_name: "Subcontract labour",
    is_default: true,
  },
  {
    category_id: "subcontracting_general",
    category_name: "Subcontracting - General",
    is_default: true,
  },
  {
    category_id: "hired_equipment_plant",
    category_name: "Hired equipment / plant",
    is_default: true,
  },
  {
    category_id: "freight_cartage",
    category_name: "Freight / cartage",
    is_default: true,
  },
  {
    category_id: "waste_tipping",
    category_name: "Waste / tipping",
    is_default: true,
  },
  {
    category_id: "direct_consumables",
    category_name: "Direct consumables",
    is_default: true,
  },
  {
    category_id: "other_direct_costs",
    category_name: "Other direct costs",
    is_default: true,
  },
  {
    category_id: "review_required",
    category_name: "Review required",
    is_default: true,
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

function get_direct_cost_categories(state = {}) {
  const seen = new Set();
  const categories = [
    ...DEFAULT_DIRECT_COST_CATEGORIES,
    ...(Array.isArray(state.direct_cost_categories)
      ? state.direct_cost_categories
      : []),
  ];

  return categories.filter((category) => {
    const category_id = category?.category_id || "";
    if (!category_id || seen.has(category_id) || category?.is_active === false) {
      return false;
    }

    seen.add(category_id);
    return true;
  });
}

function get_line_direct_cost_category_id(line = {}) {
  return (
    line.direct_cost_category_id ||
    get_legacy_direct_cost_category_id(line.category) ||
    "review_required"
  );
}

function is_review_assignment_line(line = {}) {
  const category = normalise_category(line?.category);

  if (category === "unassigned" || category === "review_required") {
    return true;
  }

  if (
    category === "cogs" &&
    REVIEW_DIRECT_COST_CATEGORY_IDS.has(get_line_direct_cost_category_id(line))
  ) {
    return true;
  }

  return false;
}

function is_cogs_line(line = {}) {
  return normalise_category(line.category) === "cogs";
}

function is_interest_line(line) {
  return String(line?.line_name || "")
    .toLowerCase()
    .includes("interest");
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

function is_asset_finance_interest_marked(line) {
  return (
    normalise_interest_treatment(line?.interest_treatment) ===
    "contains_asset_finance_interest"
  );
}

function get_unreviewed_interest_lines(lines = []) {
  return (lines ?? []).filter((line) => {
    return (
      is_interest_line(line) &&
      normalise_interest_treatment(line?.interest_treatment) === "not_reviewed"
    );
  });
}

function get_lines_by_section(lines = [], section) {
  return (lines ?? []).filter((line) => line?.section === section);
}

function get_lines_by_category(lines = [], category) {
  return (lines ?? []).filter((line) => {
    return normalise_category(line?.category) === category;
  });
}

function sum_line_amounts(lines = []) {
  return (lines ?? []).reduce((sum, line) => {
    return sum + to_number(line?.amount);
  }, 0);
}

function sum_qs_line_amounts(lines = []) {
  return (lines ?? []).reduce((sum, line) => {
    return sum + to_number(line?.amount);
  }, 0);
}

function sum_asset_finance_interest_marked(lines = []) {
  return (lines ?? []).reduce((sum, line) => {
    if (!is_interest_line(line) || !is_asset_finance_interest_marked(line)) {
      return sum;
    }

    return sum + to_number(line?.amount);
  }, 0);
}

function sum_interest_lines(lines = []) {
  return sum_line_amounts((lines ?? []).filter(is_interest_line));
}

export function calculateProfitAndLoss(state = {}) {
  const pnl_lines = Array.isArray(state.pnl_lines) ? state.pnl_lines : [];

  const trading_income_lines = get_lines_by_section(
    pnl_lines,
    "trading_income",
  );
  const cost_of_sales_lines = get_lines_by_section(pnl_lines, "cost_of_sales");
  const other_income_lines = get_lines_by_section(pnl_lines, "other_income");
  const operating_expense_lines = get_lines_by_section(
    pnl_lines,
    "operating_expenses",
  );

  const total_trading_income = sum_line_amounts(trading_income_lines);
  const total_cost_of_sales = sum_line_amounts(cost_of_sales_lines);
  const total_other_income = sum_line_amounts(other_income_lines);
  const total_operating_expenses = sum_line_amounts(operating_expense_lines);

  const gross_profit = total_trading_income - total_cost_of_sales;
  const net_profit =
    gross_profit + total_other_income - total_operating_expenses;

  const revenue_lines = get_lines_by_category(pnl_lines, "revenue");
  const cogs_material_lines = pnl_lines.filter((line) => {
    return (
      is_cogs_line(line) &&
      get_line_direct_cost_category_id(line) === "materials"
    );
  });
  const cogs_subcontract_lines = pnl_lines.filter((line) => {
    return (
      is_cogs_line(line) &&
      get_line_direct_cost_category_id(line) === "subcontract_labour"
    );
  });
  const cogs_hire_lines = pnl_lines.filter((line) => {
    return (
      is_cogs_line(line) &&
      get_line_direct_cost_category_id(line) === "hired_equipment_plant"
    );
  });

  const labour_lines = get_lines_by_category(operating_expense_lines, "labour");
  const assets_lines = get_lines_by_category(operating_expense_lines, "assets");
  const general_overheads_lines = get_lines_by_category(
    operating_expense_lines,
    "general_overheads",
  );
  const unassigned_lines = operating_expense_lines.filter(
    is_review_assignment_line,
  );

  const total_revenue = sum_qs_line_amounts(revenue_lines);

  const direct_cost_categories = get_direct_cost_categories(state);
  const direct_cost_category_totals = direct_cost_categories.map((category) => {
    const lines = pnl_lines.filter((line) => {
      return (
        is_cogs_line(line) &&
        get_line_direct_cost_category_id(line) === category.category_id
      );
    });

    return {
      category_id: category.category_id,
      category_name: category.category_name,
      is_default: category.is_default === true,
      total: sum_qs_line_amounts(lines),
      lines,
    };
  });

  const get_direct_total = (category_id) =>
    direct_cost_category_totals.find(
      (category) => category.category_id === category_id,
    )?.total ?? 0;

  const materials_cost = get_direct_total("materials");
  const subcontract_cost = get_direct_total("subcontract_labour");
  const hired_equipment_cost = get_direct_total("hired_equipment_plant");

  const total_direct_costs = direct_cost_category_totals.reduce(
    (total, category) => total + to_number(category.total),
    0,
  );
  const total_cogs = total_direct_costs;

  const labour_benchmark_total = sum_qs_line_amounts(labour_lines);
  const assets_benchmark_total = sum_qs_line_amounts(assets_lines);
  const general_overheads_benchmark_total = sum_qs_line_amounts(
    general_overheads_lines,
  );

  const employee_overheads_lines = [];
  const employee_overheads_benchmark_total = 0;

  const unassigned_balance = sum_qs_line_amounts(unassigned_lines);

  const pnl_interest_total = sum_interest_lines(pnl_lines);
  const pnl_interest_marked_asset_finance_total =
    sum_asset_finance_interest_marked(operating_expense_lines);
  const excluded_asset_finance_interest_total =
    pnl_interest_marked_asset_finance_total;
  const unreviewed_interest_lines =
    get_unreviewed_interest_lines(operating_expense_lines);
  const unreviewed_interest_total = sum_line_amounts(unreviewed_interest_lines);
  const review_required_lines = pnl_lines.filter(is_review_assignment_line);

  const total_assigned_business_costs =
    labour_benchmark_total +
    assets_benchmark_total +
    general_overheads_benchmark_total;

  const total_business_costs =
    total_assigned_business_costs + unassigned_balance;

  const pnl_ready = review_required_lines.length === 0;

  return {
    pnl_lines,

    trading_income_lines,
    cost_of_sales_lines,
    other_income_lines,
    operating_expense_lines,

    total_trading_income,
    total_cost_of_sales,
    total_other_income,
    total_operating_expenses,

    gross_profit,
    net_profit,

    revenue_lines,
    cogs_material_lines,
    cogs_subcontract_lines,
    cogs_hire_lines,
    direct_cost_categories,
    direct_cost_category_totals,
    labour_lines,
    employee_overheads_lines,
    assets_lines,
    general_overheads_lines,
    unassigned_lines,

    total_revenue,
    income_benchmark_total: total_revenue,
    materials_cost,
    subcontract_cost,
    hired_equipment_cost,
    total_direct_costs,
    total_cogs,
    cogs_benchmark_total: total_cogs,
    direct_cost_benchmark_total: total_direct_costs,

    labour_benchmark_total,
    employee_overheads_benchmark_total,
    assets_benchmark_total,
    general_overheads_benchmark_total,

    excluded_asset_finance_interest_total,
    pnl_interest_total,
    pnl_interest_marked_asset_finance_total,
    unreviewed_interest_lines,
    unreviewed_interest_count: unreviewed_interest_lines.length,
    unreviewed_interest_total,
    review_required_lines,
    review_required_count: review_required_lines.length,

    total_business_costs,
    total_assigned_business_costs,
    unassigned_balance,
    pnl_ready,
  };
}
