function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalise_array(value) {
  return Array.isArray(value) ? value : [];
}

function safe_divide(numerator, denominator) {
  const top = to_number(numerator);
  const bottom = to_number(denominator);

  return bottom === 0 ? 0 : top / bottom;
}

function normalise_commercial_driver_mode(value) {
  const allowed = new Set(["hours_based", "unit_based", "mixed_unit_based"]);
  return allowed.has(value) ? value : "hours_based";
}

function normalise_unit_type(value) {
  const allowed = new Set(["each", "m2", "m3", "lm", "tonne", "hour", "custom"]);
  return allowed.has(value) ? value : "each";
}

function normalise_unit_driver_row(row = {}, index = 0) {
  return {
    id: row.id || row.unit_driver_id || `unit-driver-${index + 1}`,
    unit_label:
      row.unit_label || row.label || (index === 0 ? "Primary unit" : `Unit ${index + 1}`),
    unit_type: normalise_unit_type(row.unit_type),
    revenue_share_percent: to_number(row.revenue_share_percent),
    average_sale_rate_per_unit: to_number(row.average_sale_rate_per_unit),
    direct_cost_per_unit: to_number(row.direct_cost_per_unit),
  };
}

function calculate_unit_driver_rows({
  rows = [],
  total_revenue = 0,
  commercial_driver_mode = "hours_based",
}) {
  const revenue_total = to_number(total_revenue);
  const mode = normalise_commercial_driver_mode(commercial_driver_mode);
  const source_rows = normalise_array(rows).map(normalise_unit_driver_row);

  if (mode === "hours_based") {
    return [];
  }

  const working_rows =
    source_rows.length > 0 ? source_rows : [normalise_unit_driver_row({}, 0)];

  return working_rows.map((row, index) => {
    const revenue_share_percent =
      mode === "unit_based" && working_rows.length === 1
        ? 100
        : to_number(row.revenue_share_percent);

    const annual_revenue = revenue_total * (revenue_share_percent / 100);
    const derived_units_annual = safe_divide(
      annual_revenue,
      row.average_sale_rate_per_unit
    );

    const annual_direct_cost = derived_units_annual * row.direct_cost_per_unit;
    const margin_per_unit =
      row.average_sale_rate_per_unit - row.direct_cost_per_unit;
    const annual_margin_pool = derived_units_annual * margin_per_unit;

    return {
      ...row,
      id: row.id || `unit-driver-${index + 1}`,
      revenue_share_percent,
      annual_revenue,
      annual_direct_cost,
      derived_units_annual,
      margin_per_unit,
      annual_margin_pool,
      direct_cost_margin_percent:
        row.average_sale_rate_per_unit > 0
          ? margin_per_unit / row.average_sale_rate_per_unit
          : 0,
    };
  });
}

function build_unit_driver_warnings({
  commercial_driver_mode,
  unit_driver_rows,
}) {
  const warnings = [];

  if (commercial_driver_mode === "hours_based") {
    return warnings;
  }

  if (unit_driver_rows.length === 0) {
    warnings.push({
      warning_id: "no_unit_drivers",
      message:
        "Unit-based mode is selected, but no commercial unit drivers have been entered.",
    });
    return warnings;
  }

  const revenue_share_total = unit_driver_rows.reduce(
    (sum, row) => sum + to_number(row.revenue_share_percent),
    0
  );

  if (Math.abs(revenue_share_total - 100) > 0.1) {
    warnings.push({
      warning_id: "unit_revenue_split_not_100",
      message:
        "Unit driver revenue split should total 100% for unit-based recovery testing.",
    });
  }

  unit_driver_rows.forEach((row) => {
    if (to_number(row.average_sale_rate_per_unit) <= 0) {
      warnings.push({
        warning_id: "unit_sale_rate_missing",
        unit_driver_id: row.id,
        message: `${row.unit_label} needs an average sale rate per unit.`,
      });
    }

    if (to_number(row.direct_cost_per_unit) < 0) {
      warnings.push({
        warning_id: "unit_direct_cost_negative",
        unit_driver_id: row.id,
        message: `${row.unit_label} has a negative direct cost per unit.`,
      });
    }

    if (
      to_number(row.average_sale_rate_per_unit) > 0 &&
      to_number(row.direct_cost_per_unit) > to_number(row.average_sale_rate_per_unit)
    ) {
      warnings.push({
        warning_id: "unit_margin_negative",
        unit_driver_id: row.id,
        message: `${row.unit_label} direct cost is greater than the sale rate.`,
      });
    }
  });

  return warnings;
}

export function calculateRevenueCogs({
  total_revenue = 0,
  total_direct_costs = 0,
  revenue_lines = [],
  direct_cost_category_totals = [],
  commercial_driver_mode = "hours_based",
  unit_driver_rows = [],
  units_sold_annual = 0,
} = {}) {
  const revenue_total = to_number(total_revenue);
  const direct_cost_total = to_number(total_direct_costs);
  const margin_pool = revenue_total - direct_cost_total;
  const gross_margin_percent =
    revenue_total > 0 ? margin_pool / revenue_total : 0;

  const resolved_commercial_driver_mode =
    normalise_commercial_driver_mode(commercial_driver_mode);

  const calculated_unit_driver_rows = calculate_unit_driver_rows({
    rows: unit_driver_rows,
    total_revenue: revenue_total,
    commercial_driver_mode: resolved_commercial_driver_mode,
  });

  const total_unit_revenue = calculated_unit_driver_rows.reduce(
    (sum, row) => sum + to_number(row.annual_revenue),
    0
  );

  const total_unit_direct_cost = calculated_unit_driver_rows.reduce(
    (sum, row) => sum + to_number(row.annual_direct_cost),
    0
  );

  const total_unit_margin_pool = calculated_unit_driver_rows.reduce(
    (sum, row) => sum + to_number(row.annual_margin_pool),
    0
  );

  const total_derived_units_annual = calculated_unit_driver_rows.reduce(
    (sum, row) => sum + to_number(row.derived_units_annual),
    0
  );

  const weighted_average_margin_per_unit = safe_divide(
    total_unit_margin_pool,
    total_derived_units_annual
  );

  const primary_unit_row = calculated_unit_driver_rows[0] ?? null;

  const unit_recovery_warnings = build_unit_driver_warnings({
    commercial_driver_mode: resolved_commercial_driver_mode,
    unit_driver_rows: calculated_unit_driver_rows,
  });

  const legacy_units_sold_annual =
    resolved_commercial_driver_mode === "hours_based"
      ? to_number(units_sold_annual)
      : total_derived_units_annual;

  const legacy_margin_per_unit =
    resolved_commercial_driver_mode === "hours_based"
      ? safe_divide(margin_pool, to_number(units_sold_annual))
      : weighted_average_margin_per_unit;

  return {
    total_revenue: revenue_total,
    total_direct_costs: direct_cost_total,
    margin_pool,
    gross_margin_percent,
    revenue_lines: normalise_array(revenue_lines),
    direct_cost_category_totals: normalise_array(direct_cost_category_totals),

    commercial_driver_mode: resolved_commercial_driver_mode,
    unit_driver_rows: calculated_unit_driver_rows,
    total_unit_revenue,
    total_unit_direct_cost,
    total_unit_margin_pool,
    total_derived_units_annual,
    primary_unit_label: primary_unit_row?.unit_label || "",
    primary_unit_type: primary_unit_row?.unit_type || "",
    weighted_average_margin_per_unit,
    unit_recovery_ready:
      resolved_commercial_driver_mode === "hours_based" ||
      unit_recovery_warnings.length === 0,
    unit_recovery_warnings,

    // Backwards-compatible fields for existing Recovery Summary / Business Summary.
    units_sold_annual: legacy_units_sold_annual,
    margin_per_unit: legacy_margin_per_unit,
    product_recovery_ready:
      resolved_commercial_driver_mode !== "hours_based" &&
      unit_recovery_warnings.length === 0,
    product_recovery_status:
      resolved_commercial_driver_mode === "hours_based"
        ? "not_selected"
        : weighted_average_margin_per_unit > 0
          ? "recoverable"
          : "not_recoverable",
  };
}