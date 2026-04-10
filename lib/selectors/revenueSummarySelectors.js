function get_health(calculated = {}) {
  if ((calculated.actual_profit_model ?? 0) < 0) return "bad";
  if ((calculated.actual_profit_percent ?? 0) < 10) return "ok";
  return "good";
}

export function buildRevenueSummaryStatus({
  revenue_summary_state = {},
  calculated = {},
} = {}) {
  return {
    profile_active: Boolean(revenue_summary_state.is_active ?? true),
    current_revenue: calculated.current_revenue ?? 0,
    total_cost_burden: calculated.total_cost_burden ?? 0,
    actual_profit_model: calculated.actual_profit_model ?? 0,
    actual_profit_percent: calculated.actual_profit_percent ?? 0,
    health: get_health(calculated),
    warning_count: Array.isArray(calculated.warnings)
      ? calculated.warnings.length
      : 0,
    warnings: calculated.warnings ?? [],
  };
}

export function buildRevenueSummaryCard({
  revenue_summary_state = {},
  calculated = {},
  update_revenue_summary_field = () => {},
  reset_revenue_summary_state = () => {},
} = {}) {
  return {
    sales_revenue: revenue_summary_state.sales_revenue ?? 0,

    pnl_direct_labour: revenue_summary_state.pnl_direct_labour ?? 0,
    subcontract_labour_cost:
      revenue_summary_state.subcontract_labour_cost ?? 0,
    subcontract_general_cost:
      revenue_summary_state.subcontract_general_cost ?? 0,
    equipment_hire_cost: revenue_summary_state.equipment_hire_cost ?? 0,
    trade_delivery_other_cost:
      revenue_summary_state.trade_delivery_other_cost ?? 0,

    material_cost_total: revenue_summary_state.material_cost_total ?? 0,
    operating_expenses_total:
      revenue_summary_state.operating_expenses_total ?? 0,

    target_profit_percent: revenue_summary_state.target_profit_percent ?? 0,
    target_profit_amount_override:
      revenue_summary_state.target_profit_amount_override ?? 0,
    target_material_percent: revenue_summary_state.target_material_percent ?? 0,
    target_labour_percent: revenue_summary_state.target_labour_percent ?? 0,

    total_cost_burden: calculated.total_cost_burden ?? 0,
    total_people_cost_annual: calculated.total_people_cost_annual ?? 0,

    current_revenue: calculated.current_revenue ?? 0,
    actual_profit_model: calculated.actual_profit_model ?? 0,
    actual_profit_percent: calculated.actual_profit_percent ?? 0,

    total_delivery_cost: calculated.total_delivery_cost ?? 0,
    material_cost_total_output: calculated.material_cost_total ?? 0,
    operating_expenses_total_output: calculated.operating_expenses_total ?? 0,
    gross_margin_before_operating_expenses:
      calculated.gross_margin_before_operating_expenses ?? 0,
    pnl_net_result: calculated.pnl_net_result ?? 0,

    required_revenue: calculated.required_revenue ?? 0,
    target_profit_amount: calculated.target_profit_amount ?? 0,
    revenue_gap: calculated.revenue_gap ?? 0,
    profit_gap: calculated.profit_gap ?? 0,

    material_cost_percent_of_sales:
      calculated.material_cost_percent_of_sales ?? 0,
    delivery_cost_percent_of_sales:
      calculated.delivery_cost_percent_of_sales ?? 0,
    operating_expense_percent_of_sales:
      calculated.operating_expense_percent_of_sales ?? 0,

    labour_variance: calculated.labour_variance ?? 0,
    labour_variance_percent: calculated.labour_variance_percent ?? 0,
    labour_variance_note: calculated.labour_variance_note ?? "",

    target_split_total: calculated.target_split_total ?? 0,
    warnings: calculated.warnings ?? [],

    on_sales_revenue_change: (value) =>
      update_revenue_summary_field("sales_revenue", value),

    on_pnl_direct_labour_change: (value) =>
      update_revenue_summary_field("pnl_direct_labour", value),

    on_subcontract_labour_cost_change: (value) =>
      update_revenue_summary_field("subcontract_labour_cost", value),

    on_subcontract_general_cost_change: (value) =>
      update_revenue_summary_field("subcontract_general_cost", value),

    on_equipment_hire_cost_change: (value) =>
      update_revenue_summary_field("equipment_hire_cost", value),

    on_trade_delivery_other_cost_change: (value) =>
      update_revenue_summary_field("trade_delivery_other_cost", value),

    on_material_cost_total_change: (value) =>
      update_revenue_summary_field("material_cost_total", value),

    on_operating_expenses_total_change: (value) =>
      update_revenue_summary_field("operating_expenses_total", value),

    on_target_profit_percent_change: (value) =>
      update_revenue_summary_field("target_profit_percent", value),

    on_target_profit_amount_override_change: (value) =>
      update_revenue_summary_field("target_profit_amount_override", value),

    on_target_material_percent_change: (value) =>
      update_revenue_summary_field("target_material_percent", value),

    on_target_labour_percent_change: (value) =>
      update_revenue_summary_field("target_labour_percent", value),

    on_reset: reset_revenue_summary_state,
  };
}

export function buildRevenueSummarySummary({ calculated = {} } = {}) {
  return {
    current_revenue: calculated.current_revenue ?? 0,
    total_cost_burden: calculated.total_cost_burden ?? 0,
    actual_profit_model: calculated.actual_profit_model ?? 0,
    actual_profit_percent: calculated.actual_profit_percent ?? 0,
    required_revenue: calculated.required_revenue ?? 0,
    revenue_gap: calculated.revenue_gap ?? 0,
    health: get_health(calculated),

    total_delivery_cost: calculated.total_delivery_cost ?? 0,
    material_cost_total_output: calculated.material_cost_total ?? 0,
    operating_expenses_total_output: calculated.operating_expenses_total ?? 0,
    gross_margin_before_operating_expenses:
      calculated.gross_margin_before_operating_expenses ?? 0,
    pnl_net_result: calculated.pnl_net_result ?? 0,

    material_cost_percent_of_sales:
      calculated.material_cost_percent_of_sales ?? 0,
    delivery_cost_percent_of_sales:
      calculated.delivery_cost_percent_of_sales ?? 0,
    operating_expense_percent_of_sales:
      calculated.operating_expense_percent_of_sales ?? 0,
  };
}