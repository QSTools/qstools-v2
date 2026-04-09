function get_rate_health(calculated = {}) {
  const warning_count = Array.isArray(calculated.warnings)
    ? calculated.warnings.length
    : 0;

  if ((calculated.expected_revenue_annual ?? 0) <= 0) return "bad";
  if (warning_count > 1) return "ok";
  return "good";
}

export function buildSquareMetreRateStatus({
  square_metre_rate_state = {},
  calculated = {},
} = {}) {
  return {
    profile_active: Boolean(square_metre_rate_state.is_active ?? true),
    base_rate: calculated.base_rate ?? 0,
    minimum_charge: calculated.minimum_charge ?? 0,
    expected_annual_volume: calculated.expected_annual_volume ?? 0,
    expected_revenue_annual: calculated.expected_revenue_annual ?? 0,
    rate_health: get_rate_health(calculated),
    warning_count: Array.isArray(calculated.warnings)
      ? calculated.warnings.length
      : 0,
    warnings: calculated.warnings ?? [],
  };
}

export function buildSquareMetreRateCard({
  square_metre_rate_state = {},
  calculated = {},
  update_square_metre_rate_field = () => {},
  reset_square_metre_rate_state = () => {},
} = {}) {
  return {
    base_square_metre_rate: square_metre_rate_state.base_square_metre_rate ?? 0,
    minimum_charge: square_metre_rate_state.minimum_charge ?? 0,
    expected_annual_square_metres:
      square_metre_rate_state.expected_annual_square_metres ?? 0,
    small_job_threshold_m2:
      square_metre_rate_state.small_job_threshold_m2 ?? 0,
    average_job_size_m2: square_metre_rate_state.average_job_size_m2 ?? 0,
    small_job_uplift_percent:
      square_metre_rate_state.small_job_uplift_percent ?? 0,
    large_job_discount_percent:
      square_metre_rate_state.large_job_discount_percent ?? 0,
    included_labour_basis_label:
      square_metre_rate_state.included_labour_basis_label ?? "",
    included_material_basis_label:
      square_metre_rate_state.included_material_basis_label ?? "",

    rate_model_type: calculated.rate_model_type ?? "square_metre",
    unit_label: calculated.unit_label ?? "m2",
    expected_annual_volume: calculated.expected_annual_volume ?? 0,
    expected_revenue_annual: calculated.expected_revenue_annual ?? 0,
    expected_recovery_contribution:
      calculated.expected_recovery_contribution ?? 0,
    warnings: calculated.warnings ?? [],

    on_base_square_metre_rate_change: (value) =>
      update_square_metre_rate_field("base_square_metre_rate", value),

    on_minimum_charge_change: (value) =>
      update_square_metre_rate_field("minimum_charge", value),

    on_expected_annual_square_metres_change: (value) =>
      update_square_metre_rate_field("expected_annual_square_metres", value),

    on_small_job_threshold_m2_change: (value) =>
      update_square_metre_rate_field("small_job_threshold_m2", value),

    on_average_job_size_m2_change: (value) =>
      update_square_metre_rate_field("average_job_size_m2", value),

    on_small_job_uplift_percent_change: (value) =>
      update_square_metre_rate_field("small_job_uplift_percent", value),

    on_large_job_discount_percent_change: (value) =>
      update_square_metre_rate_field("large_job_discount_percent", value),

    on_included_labour_basis_label_change: (value) =>
      update_square_metre_rate_field("included_labour_basis_label", value),

    on_included_material_basis_label_change: (value) =>
      update_square_metre_rate_field("included_material_basis_label", value),

    on_reset: reset_square_metre_rate_state,
  };
}

export function buildSquareMetreRateSummary({ calculated = {} } = {}) {
  return {
    base_rate: calculated.base_rate ?? 0,
    minimum_charge: calculated.minimum_charge ?? 0,
    expected_annual_volume: calculated.expected_annual_volume ?? 0,
    expected_revenue_annual: calculated.expected_revenue_annual ?? 0,
    rate_health: get_rate_health(calculated),
  };
}