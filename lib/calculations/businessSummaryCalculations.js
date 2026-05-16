function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safe_divide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function get_activity_driver_config({
  business_type = "labour_based",
  total_productive_output = 0,
  units_sold_annual = 0,
}) {
  const is_product_based = business_type === "product_based";

  if (is_product_based) {
    return {
      business_type,
      activity_driver_type: "units",
      activity_driver_label: "Units sold",
      activity_driver_value: to_number(units_sold_annual),
      required_recovery_label: "Required recovery per unit",
      required_recovery_unit_label: "$/unit",
      current_margin_label: "Current margin per unit",
      recovery_gap_label: "Unit recovery gap",
      activity_driver_display_label: "Units sold per year",
      activity_driver_suffix: "units",
    };
  }

  return {
    business_type: "labour_based",
    activity_driver_type: "hours",
    activity_driver_label: "Productive hours",
    activity_driver_value: to_number(total_productive_output),
    required_recovery_label: "Required recovery per hour",
    required_recovery_unit_label: "$/hour",
    current_margin_label: "Current margin per hour",
    recovery_gap_label: "Hourly gap",
    activity_driver_display_label: "Productive hours",
    activity_driver_suffix: "hrs",
  };
}

export function calculateBusinessSummary({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  total_cost_burden = 0,
  total_recovery_hours = 0,
  total_productive_output = 0,
  units_sold_annual = 0,
  business_type = "labour_based",
  required_recovery_rate = 0,
} = {}) {
  const revenue_total = to_number(total_revenue);
  const direct_cost_total = to_number(total_direct_costs);
  const margin_pool_total = to_number(margin_pool);
  const gross_margin_rate = to_number(gross_margin_percent);
  const operating_cost_total = to_number(total_cost_burden);
  const recovery_hours_total = to_number(total_recovery_hours);
  const productive_output_total = to_number(total_productive_output);
  const units_sold_total = to_number(units_sold_annual);
  const cost_summary_required_recovery_rate = to_number(required_recovery_rate);
  const recovery_hours_used =
    recovery_hours_total > 0 ? recovery_hours_total : productive_output_total;

  const driver_config = get_activity_driver_config({
    business_type,
    total_productive_output: productive_output_total,
    units_sold_annual: units_sold_total,
  });

  const activity_driver_value = driver_config.activity_driver_value;

  const required_recovery_per_driver = safe_divide(
    operating_cost_total,
    activity_driver_value
  );

  const current_margin_per_driver = safe_divide(
    margin_pool_total,
    activity_driver_value
  );

  const recovery_gap_per_driver =
    activity_driver_value > 0
      ? current_margin_per_driver - required_recovery_per_driver
      : 0;

  const net_position = margin_pool_total - operating_cost_total;

  const actual_recovery_rate =
    recovery_hours_used > 0
      ? safe_divide(margin_pool_total, recovery_hours_used)
      : 0;

  const profit_or_deficit_per_recovery_hour =
    recovery_hours_used > 0
      ? actual_recovery_rate - cost_summary_required_recovery_rate
      : 0;

  /*
    Backwards-compatible hour fields.
    These are still used by Business Modelling and existing pages.
    In labour mode they match the universal driver values.
    In product mode they remain hour-based outputs if productive hours exist.
  */
  const productive_hour_required_recovery_rate =
    productive_output_total > 0
      ? safe_divide(operating_cost_total, productive_output_total)
      : cost_summary_required_recovery_rate;

  const current_margin_per_hour =
    productive_output_total > 0
      ? safe_divide(margin_pool_total, productive_output_total)
      : 0;

  const hourly_gap =
    productive_output_total > 0
      ? current_margin_per_hour - productive_hour_required_recovery_rate
      : 0;

  return {
    total_revenue: revenue_total,
    total_direct_costs: direct_cost_total,
    margin_pool: margin_pool_total,
    gross_margin_percent: gross_margin_rate,
    total_cost_burden: operating_cost_total,
    total_recovery_hours: recovery_hours_total,
    recovery_hours_used,
    total_productive_output: productive_output_total,
    units_sold_annual: units_sold_total,

    business_type: driver_config.business_type,
    activity_driver_type: driver_config.activity_driver_type,
    activity_driver_label: driver_config.activity_driver_label,
    activity_driver_value,
    activity_driver_display_label: driver_config.activity_driver_display_label,
    activity_driver_suffix: driver_config.activity_driver_suffix,

    required_recovery_per_driver,
    required_recovery_label: driver_config.required_recovery_label,
    required_recovery_unit_label: driver_config.required_recovery_unit_label,

    current_margin_per_driver,
    current_margin_label: driver_config.current_margin_label,

    recovery_gap_per_driver,
    recovery_gap_label: driver_config.recovery_gap_label,

    required_recovery_rate: cost_summary_required_recovery_rate,
    productive_hour_required_recovery_rate,
    actual_recovery_rate,
    profit_or_deficit_per_recovery_hour,
    net_position,
    current_margin_per_hour,
    hourly_gap,
  };
}
