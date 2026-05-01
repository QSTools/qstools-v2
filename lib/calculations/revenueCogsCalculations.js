function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalise_array(value) {
  return Array.isArray(value) ? value : [];
}

export function calculateRevenueCogs({
  total_revenue = 0,
  total_direct_costs = 0,
  revenue_lines = [],
  direct_cost_category_totals = [],
} = {}) {
  const revenue_total = to_number(total_revenue);
  const direct_cost_total = to_number(total_direct_costs);
  const margin_pool = revenue_total - direct_cost_total;
  const gross_margin_percent =
    revenue_total > 0 ? margin_pool / revenue_total : 0;

  return {
    total_revenue: revenue_total,
    total_direct_costs: direct_cost_total,
    margin_pool,
    gross_margin_percent,
    revenue_lines: normalise_array(revenue_lines),
    direct_cost_category_totals: normalise_array(direct_cost_category_totals),
  };
}
