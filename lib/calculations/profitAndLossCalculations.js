function to_number(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum_values(values = []) {
  return values.reduce((sum, value) => sum + to_number(value), 0);
}

function sum_custom_lines(lines = []) {
  return (lines ?? [])
    .filter((line) => line?.is_active !== false)
    .reduce((sum, line) => sum + to_number(line?.value), 0);
}

function safe_divide(numerator, denominator) {
  if (!denominator) return 0;
  return numerator / denominator;
}

// 👇 NEW
function calculate_recovered_hours(labour_revenue, charge_out_rate) {
  if (!labour_revenue || !charge_out_rate) return 0;
  return labour_revenue / charge_out_rate;
}

export function calculateProfitAndLoss(state = {}) {
  const total_trading_income =
    sum_values([state.sales, state.other_trading_income]) +
    sum_custom_lines(state.custom_trading_income_lines);

  const total_cost_of_sales =
    sum_values([
      state.materials,
      state.staff_labour,
      state.subcontract_labour,
      state.subcontract_services,
      state.equipment_hire,
      state.freight_cartage,
      state.waste_disposal,
      state.wip_adjustment,
      state.other_job_costs,
    ]) + sum_custom_lines(state.custom_cost_of_sales_lines);

  const gross_profit = total_trading_income - total_cost_of_sales;

  const total_other_income =
    sum_values([state.other_income]) +
    sum_custom_lines(state.custom_other_income_lines);

  const total_operating_expenses =
    sum_values([
      state.acc_levy,
      state.accounting_fees,
      state.administration_fees,
      state.advertising,
      state.bank_fees,
      state.cleaning,
      state.computer_expenses,
      state.entertainment,
      state.entertainment_non_deductible,
      state.insurance,
      state.interest_expense,
      state.kiwisaver_employer_contributions,
      state.legal_expenses,
      state.licences_registrations,
      state.motor_vehicle_expenses,
      state.office_expenses,
      state.penalties_fees,
      state.printing_stationery,
      state.repairs_maintenance,
      state.salary_wages,
      state.staff_expenses,
      state.storage_fees,
      state.subscriptions,
      state.telephone_internet,
      state.tools_equipment,
      state.travel_national,
    ]) + sum_custom_lines(state.custom_operating_expense_lines);

  const net_profit =
    gross_profit + total_other_income - total_operating_expenses;

  const gross_profit_percent = safe_divide(gross_profit, total_trading_income);
  const net_profit_percent = safe_divide(net_profit, total_trading_income);

  // 👇 NEW OUTPUT
  const recovered_hours = calculate_recovered_hours(
    state.labour_revenue,
    state.charge_out_rate
  );

  return {
    total_trading_income,
    total_cost_of_sales,
    gross_profit,
    total_other_income,
    total_operating_expenses,
    net_profit,
    gross_profit_percent,
    net_profit_percent,
    recovered_hours,
  };
}