function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function calculateCostSummary({ labour_data }) {
  const active_staff = Array.isArray(labour_data?.active_staff)
    ? labour_data.active_staff
    : [];

  let total_labour_cost_annual = 0;
  let total_productive_output = 0;

  active_staff.forEach((staff) => {
    const productive_hours = toNumber(staff.productive_hours);
    const labour_cost_rate = toNumber(staff.labour_cost_rate);

    const labour_cost_per_productive_hour = labour_cost_rate;
    const annual_staff_cost = labour_cost_per_productive_hour * productive_hours;

    total_labour_cost_annual += annual_staff_cost;
    total_productive_output += productive_hours;
  });

  const total_asset_cost_annual = 0;
  const total_business_overheads = 0;

  const total_cost_burden =
    total_labour_cost_annual +
    total_asset_cost_annual +
    total_business_overheads;

  const required_revenue = total_cost_burden;

  const required_recovery_rate =
    total_productive_output > 0
      ? required_revenue / total_productive_output
      : 0;

  return {
    total_labour_cost_annual,
    total_productive_output,
    total_asset_cost_annual,
    total_business_overheads,
    total_cost_burden,
    required_revenue,
    required_recovery_rate,
  };
}