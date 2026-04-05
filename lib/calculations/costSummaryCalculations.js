function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function calculateCostSummary({ labour_data }) {
  const active_staff = Array.isArray(labour_data?.active_staff)
    ? labour_data.active_staff
    : [];

  const total_labour_cost_annual = active_staff.reduce((sum, staff) => {
    const productive_hours = toNumber(staff.productive_hours);
    const labour_cost_rate = toNumber(staff.labour_cost_rate);

    return sum + labour_cost_rate * productive_hours;
  }, 0);

  const total_productive_output = active_staff.reduce((sum, staff) => {
    return sum + toNumber(staff.productive_hours);
  }, 0);

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