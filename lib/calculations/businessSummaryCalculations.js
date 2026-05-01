function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateBusinessSummary({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  total_cost_burden = 0,
  total_productive_output = 0,
  required_recovery_rate = 0,
} = {}) {
  const revenue_total = to_number(total_revenue);
  const direct_cost_total = to_number(total_direct_costs);
  const margin_pool_total = to_number(margin_pool);
  const gross_margin_rate = to_number(gross_margin_percent);
  const operating_cost_total = to_number(total_cost_burden);
  const productive_output_total = to_number(total_productive_output);
  const recovery_rate_required = to_number(required_recovery_rate);

  const net_position = margin_pool_total - operating_cost_total;
  const current_margin_per_hour =
    productive_output_total > 0
      ? margin_pool_total / productive_output_total
      : 0;
  const hourly_gap =
    productive_output_total > 0
      ? current_margin_per_hour - recovery_rate_required
      : 0;

  return {
    total_revenue: revenue_total,
    total_direct_costs: direct_cost_total,
    margin_pool: margin_pool_total,
    gross_margin_percent: gross_margin_rate,
    total_cost_burden: operating_cost_total,
    total_productive_output: productive_output_total,
    required_recovery_rate: recovery_rate_required,
    net_position,
    current_margin_per_hour,
    hourly_gap,
  };
}
