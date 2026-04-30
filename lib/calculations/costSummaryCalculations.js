function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateCostSummary({
  labour_data = {},
  asset_data = {},
  general_overhead_data = {},
}) {
  const active_staff = Array.isArray(labour_data.active_staff)
    ? labour_data.active_staff
    : [];

  const people_rows = active_staff.map((staff) => {
    const gross_wages_annual = to_number(staff.gross_wages_annual);
    const entitlements_annual = to_number(staff.entitlements_annual);
    const employer_kiwisaver_annual = to_number(staff.employer_kiwisaver_gross);
    const esct_annual = to_number(staff.esct_amount);
    const acc_levy_annual = to_number(staff.acc_work_levy_annual);

    const total_people_cost_annual = to_number(staff.total_labour_cost_annual);

    return {
      staff_id: staff.staff_id ?? "",
      staff_name: staff.staff_name ?? "Unnamed Staff",
      staff_role: staff.staff_role ?? "",
      labour_class: staff.labour_class ?? "",
      productive_hours: to_number(staff.productive_hours),

      gross_wages_annual,
      entitlements_annual,
      employer_kiwisaver_annual,
      esct_annual,
      acc_levy_annual,
      total_people_cost_annual,
    };
  });

  const total_gross_wages_annual = to_number(
    labour_data.total_gross_wages_annual
  );
  const total_entitlements_annual = to_number(
    labour_data.total_entitlements_annual
  );
  const total_employer_kiwisaver_annual = to_number(
    labour_data.total_employer_kiwisaver_annual
  );
  const total_esct_annual = to_number(labour_data.total_esct_annual);
  const total_acc_levy_annual = to_number(labour_data.total_acc_levy_annual);
  const total_employer_contribution_annual = to_number(
    labour_data.total_employer_contribution_annual
  );
  const total_people_cost_annual = to_number(
    labour_data.total_labour_cost_annual
  );
  const total_productive_output = to_number(
    labour_data.total_productive_output
  );

  const total_asset_cost_annual = to_number(asset_data.total_asset_cost_annual);
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
    people_rows,

    total_gross_wages_annual,
    total_entitlements_annual,
    total_employer_kiwisaver_annual,
    total_esct_annual,
    total_acc_levy_annual,
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
