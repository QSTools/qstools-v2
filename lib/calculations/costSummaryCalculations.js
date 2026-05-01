function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateCostSummary({
  labour_data = {},
  asset_data = {},
  general_overhead_data = {},
}) {
  const total_people_cost_annual = to_number(
    labour_data.total_labour_cost_annual
  );
  const total_productive_output = to_number(
    labour_data.total_productive_output
  );

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
    total_productive_output > 0
      ? required_revenue / total_productive_output
      : 0;

  return {
    total_people_cost_annual,

    total_productive_output,

    total_asset_cost_annual,
    total_asset_interest_annual,
    total_business_overheads,
    total_business_cost_annual,

    total_cost_burden,
    required_revenue,
    required_recovery_rate,
  };
}
