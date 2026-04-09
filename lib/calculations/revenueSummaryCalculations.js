function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function round_percent(value) {
  return Number(to_number(value).toFixed(1));
}

function get_labour_variance_note(labour_variance = 0) {
  if (labour_variance === 0) {
    return "Model labour and P&L labour currently align closely.";
  }

  return "Differences may be caused by timing of wage payments, weekend work, programme pressure, owner drawings, or deferred pay.";
}

export function calculateRevenueSummary({
  revenue_summary_state = {},
  cost_summary = {},
} = {}) {
  const total_cost_burden = round_currency(cost_summary.total_cost_burden);
  const total_people_cost_annual = round_currency(
    cost_summary.total_people_cost_annual
  );

  const sales_revenue = round_currency(revenue_summary_state.sales_revenue);

  const pnl_direct_labour = round_currency(revenue_summary_state.pnl_direct_labour);
  const subcontract_labour_cost = round_currency(
    revenue_summary_state.subcontract_labour_cost
  );
  const subcontract_general_cost = round_currency(
    revenue_summary_state.subcontract_general_cost
  );
  const equipment_hire_cost = round_currency(
    revenue_summary_state.equipment_hire_cost
  );
  const trade_delivery_other_cost = round_currency(
    revenue_summary_state.trade_delivery_other_cost
  );

  const material_cost_total = round_currency(
    revenue_summary_state.material_cost_total
  );
  const operating_expenses_total = round_currency(
    revenue_summary_state.operating_expenses_total
  );

  const target_profit_percent = round_percent(
    revenue_summary_state.target_profit_percent
  );
  const target_profit_amount_override = round_currency(
    revenue_summary_state.target_profit_amount_override
  );

  const target_material_percent = round_percent(
    revenue_summary_state.target_material_percent
  );
  const target_labour_percent = round_percent(
    revenue_summary_state.target_labour_percent
  );

  const total_delivery_cost = round_currency(
    subcontract_labour_cost +
      subcontract_general_cost +
      equipment_hire_cost +
      trade_delivery_other_cost
  );

  const gross_margin_before_operating_expenses = round_currency(
    sales_revenue - total_delivery_cost - material_cost_total
  );

  const pnl_net_result = round_currency(
    gross_margin_before_operating_expenses - operating_expenses_total
  );

  const current_revenue = sales_revenue;

  const actual_profit_model = round_currency(current_revenue - total_cost_burden);

  const actual_profit_percent =
    current_revenue > 0
      ? round_percent((actual_profit_model / current_revenue) * 100)
      : 0;

  const target_profit_amount =
    target_profit_amount_override > 0
      ? target_profit_amount_override
      : round_currency((total_cost_burden * target_profit_percent) / 100);

  const required_revenue = round_currency(
    total_cost_burden + target_profit_amount
  );

  const revenue_gap = round_currency(required_revenue - current_revenue);
  const profit_gap = round_currency(target_profit_amount - actual_profit_model);

  const material_cost_percent_of_sales =
    current_revenue > 0
      ? round_percent((material_cost_total / current_revenue) * 100)
      : 0;

  const delivery_cost_percent_of_sales =
    current_revenue > 0
      ? round_percent((total_delivery_cost / current_revenue) * 100)
      : 0;

  const operating_expense_percent_of_sales =
    current_revenue > 0
      ? round_percent((operating_expenses_total / current_revenue) * 100)
      : 0;

  const target_split_total = round_percent(
    target_material_percent + target_labour_percent
  );

  const labour_variance = round_currency(
    pnl_direct_labour - total_people_cost_annual
  );

  const labour_variance_percent =
    total_people_cost_annual > 0
      ? round_percent((labour_variance / total_people_cost_annual) * 100)
      : 0;

  const warnings = [];

  if (sales_revenue <= 0) {
    warnings.push("No sales revenue entered");
  }

  if (material_cost_total <= 0) {
    warnings.push("Material cost total missing");
  }

  if (operating_expenses_total <= 0) {
    warnings.push("Operating expenses total missing");
  }

  if (required_revenue > 0 && current_revenue < required_revenue) {
    warnings.push("Current revenue is below required revenue");
  }

  if (target_split_total > 0 && target_split_total !== 100) {
    warnings.push("Target split does not total 100%");
  }

  return {
    total_cost_burden,
    total_people_cost_annual,

    sales_revenue,
    current_revenue,

    pnl_direct_labour,
    subcontract_labour_cost,
    subcontract_general_cost,
    equipment_hire_cost,
    trade_delivery_other_cost,
    total_delivery_cost,

    material_cost_total,
    operating_expenses_total,

    gross_margin_before_operating_expenses,
    pnl_net_result,

    actual_profit_model,
    actual_profit_percent,

    target_profit_percent,
    target_profit_amount,
    required_revenue,

    target_material_percent,
    target_labour_percent,
    target_split_total,

    revenue_gap,
    profit_gap,

    material_cost_percent_of_sales,
    delivery_cost_percent_of_sales,
    operating_expense_percent_of_sales,

    labour_variance,
    labour_variance_percent,
    labour_variance_note: get_labour_variance_note(labour_variance),

    warnings,
  };
}