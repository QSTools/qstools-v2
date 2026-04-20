function to_number(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_lines_by_section(lines = [], section) {
  return (lines ?? []).filter((line) => line?.section === section);
}

function get_lines_by_category(lines = [], category) {
  return (lines ?? []).filter((line) => line?.category === category);
}

function sum_line_amounts(lines = []) {
  return (lines ?? []).reduce((sum, line) => {
    return sum + to_number(line?.amount);
  }, 0);
}

export function calculateProfitAndLoss(state = {}) {
  const pnl_lines = Array.isArray(state.pnl_lines) ? state.pnl_lines : [];

  // Section groupings
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

  // Section totals
  const total_trading_income = sum_line_amounts(trading_income_lines);
  const total_cost_of_sales = sum_line_amounts(cost_of_sales_lines);
  const total_other_income = sum_line_amounts(other_income_lines);
  const total_operating_expenses = sum_line_amounts(operating_expense_lines);

  // Traditional accounting view
  const gross_profit = total_trading_income - total_cost_of_sales;
  const net_profit =
    gross_profit + total_other_income - total_operating_expenses;

  // QS category groupings
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
  const employee_overheads_lines = get_lines_by_category(
    pnl_lines,
    "employee_overheads",
  );
  const assets_lines = get_lines_by_category(pnl_lines, "assets");
  const general_overheads_lines = get_lines_by_category(
    pnl_lines,
    "general_overheads",
  );
  const unassigned_lines = get_lines_by_category(pnl_lines, "unassigned");

  // QS benchmark totals
  const total_revenue = sum_line_amounts(revenue_lines);

  const materials_cost = sum_line_amounts(cogs_material_lines);
  const subcontract_cost = sum_line_amounts(cogs_subcontract_lines);
  const hired_equipment_cost = sum_line_amounts(cogs_hire_lines);

  const total_cogs =
    materials_cost + subcontract_cost + hired_equipment_cost;

  const labour_benchmark_total = sum_line_amounts(labour_lines);
  const employee_overheads_benchmark_total = sum_line_amounts(
    employee_overheads_lines,
  );
  const assets_benchmark_total = sum_line_amounts(assets_lines);
  const general_overheads_benchmark_total = sum_line_amounts(
    general_overheads_lines,
  );

  const unassigned_balance = sum_line_amounts(unassigned_lines);

  const total_assigned_business_costs =
    labour_benchmark_total +
    employee_overheads_benchmark_total +
    assets_benchmark_total +
    general_overheads_benchmark_total;

  const total_business_costs =
    total_assigned_business_costs + unassigned_balance;

  const pnl_ready = unassigned_balance === 0;

  return {
    pnl_lines,

    // section lines
    trading_income_lines,
    cost_of_sales_lines,
    other_income_lines,
    operating_expense_lines,

    // section totals
    total_trading_income,
    total_cost_of_sales,
    total_other_income,
    total_operating_expenses,

    // traditional accounting outputs
    gross_profit,
    net_profit,

    // category lines
    revenue_lines,
    cogs_material_lines,
    cogs_subcontract_lines,
    cogs_hire_lines,
    labour_lines,
    employee_overheads_lines,
    assets_lines,
    general_overheads_lines,
    unassigned_lines,

    // QS outputs
    total_revenue,
    materials_cost,
    subcontract_cost,
    hired_equipment_cost,
    total_cogs,

    labour_benchmark_total,
    employee_overheads_benchmark_total,
    assets_benchmark_total,
    general_overheads_benchmark_total,

    total_business_costs,
    total_assigned_business_costs,
    unassigned_balance,
    pnl_ready,
  };
}