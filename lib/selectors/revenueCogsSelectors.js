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

function getCommercialDriverLabel(value) {
  const label_map = {
    hours_based: "Hours-based trading model",
    unit_based: "Single unit-based trading model",
    mixed_unit_based: "Mixed unit-based trading model",
  };

  return label_map[value] || "Hours-based trading model";
}

function getUnitTypeLabel(value) {
  const label_map = {
    each: "Each",
    m2: "m²",
    m3: "m³",
    lm: "Lineal metre",
    tonne: "Tonne",
    hour: "Hour",
    custom: "Custom",
  };

  return label_map[value] || value || "Unit";
}

export function buildRevenueCogsStatus(calculations = {}) {
  const total_revenue = toNumber(calculations.total_revenue);
  const total_direct_costs = toNumber(calculations.total_direct_costs);
  const margin_pool = toNumber(calculations.margin_pool);
  const commercial_driver_mode =
    calculations.commercial_driver_mode ?? "hours_based";

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

  const unit_warnings = Array.isArray(calculations.unit_recovery_warnings)
    ? calculations.unit_recovery_warnings
    : [];

  const all_warnings = [...warnings, ...unit_warnings];

  return {
    revenue_cogs_ready: all_warnings.length === 0,
    total_revenue,
    total_direct_costs,
    margin_pool,
    commercial_driver_mode,
    commercial_driver_label: getCommercialDriverLabel(commercial_driver_mode),
    unit_recovery_ready: calculations.unit_recovery_ready === true,
    unit_recovery_warnings: unit_warnings,
    warning_count: all_warnings.length,
    revenue_cogs_warnings: all_warnings,
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

  const commercial_driver_mode =
    calculations.commercial_driver_mode ?? "hours_based";

  const unit_driver_rows = Array.isArray(calculations.unit_driver_rows)
    ? calculations.unit_driver_rows.map((row) => ({
        ...row,
        unit_type_label: getUnitTypeLabel(row.unit_type),
      }))
    : [];

  return {
    total_revenue,
    total_direct_costs,
    margin_pool,
    gross_margin_percent,
    revenue_line_items,
    direct_cost_categories,

    commercial_driver_mode,
    commercial_driver_label: getCommercialDriverLabel(commercial_driver_mode),
    is_hours_based: commercial_driver_mode === "hours_based",
    is_unit_based:
      commercial_driver_mode === "unit_based" ||
      commercial_driver_mode === "mixed_unit_based",
    is_mixed_unit_based: commercial_driver_mode === "mixed_unit_based",

    unit_driver_rows,
    total_unit_revenue: toNumber(calculations.total_unit_revenue),
    total_unit_direct_cost: toNumber(calculations.total_unit_direct_cost),
    total_unit_margin_pool: toNumber(calculations.total_unit_margin_pool),
    total_derived_units_annual: toNumber(
      calculations.total_derived_units_annual
    ),
    primary_unit_label: calculations.primary_unit_label ?? "",
    primary_unit_type: calculations.primary_unit_type ?? "",
    primary_unit_type_label: getUnitTypeLabel(calculations.primary_unit_type),
    weighted_average_margin_per_unit: toNumber(
      calculations.weighted_average_margin_per_unit
    ),
    unit_recovery_ready: calculations.unit_recovery_ready === true,
    unit_recovery_warnings: calculations.unit_recovery_warnings ?? [],

    units_sold_annual: toNumber(calculations.units_sold_annual),
    margin_per_unit: toNumber(calculations.margin_per_unit),
    product_recovery_ready: calculations.product_recovery_ready === true,
    product_recovery_status:
      calculations.product_recovery_status ?? "not_selected",
  };
}