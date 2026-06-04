function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateCostSummary({
  labour_data = {},
  asset_data = {},
  general_overhead_data = {},
  opening_hours_data = {},
}) {
  const total_people_cost_annual = to_number(
    labour_data.total_labour_cost_annual
  );
  const total_productive_output = to_number(
    labour_data.total_productive_output
  );
  const business_recovery_hours = to_number(
    labour_data.business_recovery_hours ??
      labour_data.operating_recovery_hours ??
      labour_data.total_recovery_hours
  );
  const total_staff_recovery_hours = to_number(
    labour_data.total_staff_recovery_hours ?? labour_data.total_productive_output
  );
  const labour_recovery_hours = to_number(business_recovery_hours);
  const total_recovery_hours =
    labour_recovery_hours > 0 ? labour_recovery_hours : total_productive_output;

  const total_asset_cost_annual = to_number(asset_data.total_asset_cost_annual);
  const total_asset_interest_annual = to_number(
    asset_data.total_asset_interest_annual
  );
  const total_business_overheads = to_number(
    general_overhead_data.total_general_overheads
  );

  const total_business_cost_annual =
    total_asset_cost_annual + total_business_overheads;

  const total_cost_burden =
    total_people_cost_annual +
    total_asset_cost_annual +
    total_business_overheads;

  const required_revenue = total_cost_burden;

  const required_recovery_rate =
    total_recovery_hours > 0
      ? required_revenue / total_recovery_hours
      : 0;

  // Labour-based denominator: cost per productive output (labour perspective)
  const required_labour_burden_rate =
    total_productive_output > 0 ? total_cost_burden / total_productive_output : 0;

  // Macro operating calendar denominator: cost per available business open hour
  const net_annual_business_open_hours = to_number(
    opening_hours_data?.net_annual_business_open_hours ??
      opening_hours_data?.netAnnualBusinessOpenHours ??
      0
  );

  const opening_hours_warnings = [];

  let macro_required_operating_hour_rate = 0;
  if (net_annual_business_open_hours > 0) {
    macro_required_operating_hour_rate =
      total_cost_burden / net_annual_business_open_hours;
  } else {
    // Do not fall back to labour productive hours silently.
    macro_required_operating_hour_rate = 0;
    opening_hours_warnings.push(
      "Opening Hours missing or zero: macro_required_operating_hour_rate unavailable"
    );
  }

  return {
    total_people_cost_annual,

    total_productive_output,
    total_staff_recovery_hours,
    business_recovery_hours: total_recovery_hours,
    operating_recovery_hours: total_recovery_hours,
    total_recovery_hours,

    total_asset_cost_annual,
    total_asset_interest_annual,
    total_business_overheads,
    total_business_cost_annual,

    total_cost_burden,
    required_revenue,
    required_recovery_rate,
    required_labour_burden_rate,
    net_annual_business_open_hours,
    macro_required_operating_hour_rate,
    opening_hours_warnings,
  };
}
