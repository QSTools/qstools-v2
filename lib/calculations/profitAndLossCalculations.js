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

  return category || "unassigned";
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

function should_exclude_interest_line(line) {
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
    if (should_exclude_interest_line(line)) {
      return sum;
    }

    return sum + to_number(line?.amount);
  }, 0);
}

function sum_excluded_asset_finance_interest(lines = []) {
  return (lines ?? []).reduce((sum, line) => {
    if (!should_exclude_interest_line(line)) {
      return sum;
    }

    return sum + to_number(line?.amount);
  }, 0);
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
  const cogs_material_lines = get_lines_by_category(
    pnl_lines,
    "cogs_materials",
  );
  const cogs_subcontract_lines = get_lines_by_category(
    pnl_lines,
    "cogs_subcontract",
  );
  const cogs_hire_lines = get_lines_by_category(pnl_lines, "cogs_hire");

  const labour_lines = get_lines_by_category(pnl_lines, "labour");
  const assets_lines = get_lines_by_category(pnl_lines, "assets");
  const general_overheads_lines = get_lines_by_category(
    pnl_lines,
    "general_overheads",
  );
  const unassigned_lines = get_lines_by_category(pnl_lines, "unassigned");

  const total_revenue = sum_qs_line_amounts(revenue_lines);

  const materials_cost = sum_qs_line_amounts(cogs_material_lines);
  const subcontract_cost = sum_qs_line_amounts(cogs_subcontract_lines);
  const hired_equipment_cost = sum_qs_line_amounts(cogs_hire_lines);

  const total_cogs =
    materials_cost + subcontract_cost + hired_equipment_cost;

  const labour_benchmark_total = sum_qs_line_amounts(labour_lines);
  const assets_benchmark_total = sum_qs_line_amounts(assets_lines);
  const general_overheads_benchmark_total = sum_qs_line_amounts(
    general_overheads_lines,
  );

  const employee_overheads_lines = [];
  const employee_overheads_benchmark_total = 0;

  const unassigned_balance = sum_qs_line_amounts(unassigned_lines);

  const excluded_asset_finance_interest_total =
    sum_excluded_asset_finance_interest(pnl_lines);
  const unreviewed_interest_lines = get_unreviewed_interest_lines(pnl_lines);
  const unreviewed_interest_total = sum_line_amounts(unreviewed_interest_lines);

  const total_assigned_business_costs =
    labour_benchmark_total +
    assets_benchmark_total +
    general_overheads_benchmark_total;

  const total_business_costs =
    total_assigned_business_costs + unassigned_balance;

  const pnl_ready =
    unassigned_balance === 0 && unreviewed_interest_lines.length === 0;

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
    labour_lines,
    employee_overheads_lines,
    assets_lines,
    general_overheads_lines,
    unassigned_lines,

    total_revenue,
    materials_cost,
    subcontract_cost,
    hired_equipment_cost,
    total_cogs,

    labour_benchmark_total,
    employee_overheads_benchmark_total,
    assets_benchmark_total,
    general_overheads_benchmark_total,

    excluded_asset_finance_interest_total,
    unreviewed_interest_lines,
    unreviewed_interest_count: unreviewed_interest_lines.length,
    unreviewed_interest_total,

    total_business_costs,
    total_assigned_business_costs,
    unassigned_balance,
    pnl_ready,
  };
}
