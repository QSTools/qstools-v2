function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function calculateCostSummary({ labour_data }) {
  const active_staff = Array.isArray(labour_data?.active_staff)
    ? labour_data.active_staff
    : [];

  const people_rows = active_staff.map((staff) => {
    const gross_wages_annual = toNumber(staff.gross_wages_annual);
    const entitlements_annual = toNumber(staff.entitlements_annual);
    const employer_kiwisaver_annual = toNumber(staff.employer_kiwisaver_gross);
    const esct_annual = toNumber(staff.esct_amount);
    const total_employer_contribution_annual = toNumber(
      staff.total_employer_contribution_cost
    );

    const total_people_cost_annual =
      gross_wages_annual +
      entitlements_annual +
      employer_kiwisaver_annual +
      esct_annual;

    return {
      staff_id: staff.staff_id,
      staff_name: staff.staff_name,
      staff_role: staff.staff_role,
      labour_class: staff.labour_class,

      productive_hours: toNumber(staff.productive_hours),

      gross_wages_annual,
      entitlements_annual,
      employer_kiwisaver_annual,
      esct_annual,
      total_employer_contribution_annual,
      total_people_cost_annual,
    };
  });

  const total_gross_wages_annual = people_rows.reduce(
    (sum, row) => sum + row.gross_wages_annual,
    0
  );

  const total_entitlements_annual = people_rows.reduce(
    (sum, row) => sum + row.entitlements_annual,
    0
  );

  const total_employer_kiwisaver_annual = people_rows.reduce(
    (sum, row) => sum + row.employer_kiwisaver_annual,
    0
  );

  const total_esct_annual = people_rows.reduce(
    (sum, row) => sum + row.esct_annual,
    0
  );

  const total_employer_contribution_annual = people_rows.reduce(
    (sum, row) => sum + row.total_employer_contribution_annual,
    0
  );

  const total_people_cost_annual = people_rows.reduce(
    (sum, row) => sum + row.total_people_cost_annual,
    0
  );

  const total_productive_output = people_rows.reduce(
    (sum, row) => sum + row.productive_hours,
    0
  );

  const total_asset_cost_annual = 0;
  const total_business_overheads = 0;
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
    people_rows,
    total_gross_wages_annual,
    total_entitlements_annual,
    total_employer_kiwisaver_annual,
    total_esct_annual,
    total_employer_contribution_annual,
    total_people_cost_annual,
    total_productive_output,
    total_asset_cost_annual,
    total_business_overheads,
    total_business_cost_annual,
    total_cost_burden,
    required_revenue,
    required_recovery_rate,
  };
}