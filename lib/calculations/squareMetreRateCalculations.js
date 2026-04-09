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

export function calculateSquareMetreRate(state = {}) {
  const base_square_metre_rate = round_currency(state.base_square_metre_rate);
  const minimum_charge = round_currency(state.minimum_charge);
  const expected_annual_square_metres = round_currency(
    state.expected_annual_square_metres
  );

  const small_job_threshold_m2 = round_currency(state.small_job_threshold_m2);
  const average_job_size_m2 = round_currency(state.average_job_size_m2);
  const small_job_uplift_percent = round_percent(
    state.small_job_uplift_percent
  );
  const large_job_discount_percent = round_percent(
    state.large_job_discount_percent
  );

  const included_labour_basis_label = state.included_labour_basis_label ?? "";
  const included_material_basis_label =
    state.included_material_basis_label ?? "";

  const expected_revenue_annual = round_currency(
    base_square_metre_rate * expected_annual_square_metres
  );

  const expected_recovery_contribution = expected_revenue_annual;

  const warnings = [];

  if (base_square_metre_rate <= 0) {
    warnings.push("Base rate missing");
  }

  if (expected_annual_square_metres <= 0) {
    warnings.push("Annual volume missing");
  }

  if (minimum_charge <= 0) {
    warnings.push("Minimum charge not entered");
  }

  if (
    expected_annual_square_metres > 0 &&
    expected_revenue_annual > 0 &&
    expected_revenue_annual < 50000
  ) {
    warnings.push("Very low annual revenue relative to expected business scale");
  }

  if (
    small_job_threshold_m2 > 0 &&
    average_job_size_m2 > 0 &&
    average_job_size_m2 < small_job_threshold_m2
  ) {
    warnings.push("Average job size sits below small-job threshold");
  }

  return {
    rate_model_type: "square_metre",
    unit_label: "m2",

    base_rate: base_square_metre_rate,
    minimum_charge,
    expected_annual_volume: expected_annual_square_metres,
    expected_revenue_annual,
    expected_recovery_contribution,

    base_square_metre_rate,
    expected_annual_square_metres,
    small_job_threshold_m2,
    average_job_size_m2,
    small_job_uplift_percent,
    large_job_discount_percent,
    included_labour_basis_label,
    included_material_basis_label,

    warnings,
  };
}