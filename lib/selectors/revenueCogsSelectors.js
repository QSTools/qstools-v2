function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLineName(line = {}) {
  return line.line_name || line.name || line.label || "Revenue line";
}

function getLineAmount(line = {}) {
  return toNumber(line.amount);
}

function buildSupportingLines(lines = [], fallback_label = "Line") {
  return (Array.isArray(lines) ? lines : []).map((line, index) => ({
    line_id: line.line_id || line.id || `${fallback_label}-${index}`,
    label: getLineName(line),
    amount: getLineAmount(line),
  }));
}

function buildDirectCostCategories(categories = []) {
  return (Array.isArray(categories) ? categories : [])
    .map((category, index) => ({
      category_id: category.category_id || `direct-cost-${index}`,
      label: category.category_name || category.label || "Direct cost category",
      amount: toNumber(category.total),
    }))
    .filter((category) => category.amount !== 0);
}

export function buildRevenueCogsStatus(calculations = {}) {
  const total_revenue = toNumber(calculations.total_revenue);
  const total_direct_costs = toNumber(calculations.total_direct_costs);
  const margin_pool = toNumber(calculations.margin_pool);
  const warnings = [];

  if (total_revenue === 0) {
    warnings.push({
      warning_id: "no_revenue_data",
      message:
        "No revenue data is flowing from P&L revenue classification.",
    });
  }

  if (total_direct_costs === 0) {
    warnings.push({
      warning_id: "no_direct_cost_data",
      message:
        "No direct cost data is flowing from P&L COGS classification.",
    });
  }

  if (margin_pool < 0) {
    warnings.push({
      warning_id: "negative_margin_pool",
      message:
        "Direct Costs are greater than Revenue, so the Margin Pool is negative.",
    });
  }

  return {
    revenue_cogs_ready: warnings.length === 0,
    total_revenue,
    total_direct_costs,
    margin_pool,
    warning_count: warnings.length,
    revenue_cogs_warnings: warnings,
  };
}

export function buildRevenueCogsCard(calculations = {}) {
  const total_revenue = toNumber(calculations.total_revenue);
  const total_direct_costs = toNumber(calculations.total_direct_costs);
  const margin_pool = toNumber(calculations.margin_pool);
  const gross_margin_percent = toNumber(calculations.gross_margin_percent);

  const revenue_line_items = buildSupportingLines(
    calculations.revenue_lines,
    "revenue-line"
  );
  const direct_cost_categories = buildDirectCostCategories(
    calculations.direct_cost_category_totals
  );

  return {
    total_revenue,
    total_direct_costs,
    margin_pool,
    gross_margin_percent,
    revenue_line_items,
    direct_cost_categories,
  };
}
