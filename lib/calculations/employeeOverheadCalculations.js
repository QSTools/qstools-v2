function to_number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateEmployeeOverheadProfile(input = {}) {
  const training_cost_annual = to_number(input.training_cost_annual);
  const ppe_cost_annual = to_number(input.ppe_cost_annual);
  const staff_transport_allowance_annual = to_number(
    input.staff_transport_allowance_annual
  );
  const phone_allowance_annual = to_number(input.phone_allowance_annual);

  const custom_assignment_rows = Array.isArray(input.custom_assignment_rows)
    ? input.custom_assignment_rows
    : [];

  const active_custom_overheads_total_annual = custom_assignment_rows
    .filter((row) => row && row.is_active)
    .reduce((sum, row) => sum + to_number(row.amount_annual), 0);

  const employee_overheads_total_annual =
    training_cost_annual +
    ppe_cost_annual +
    staff_transport_allowance_annual +
    phone_allowance_annual +
    active_custom_overheads_total_annual;

  return {
    training_cost_annual,
    ppe_cost_annual,
    staff_transport_allowance_annual,
    phone_allowance_annual,
    active_custom_overheads_total_annual,
    employee_overheads_total_annual,
  };
}

export function calculateEmployeeOverheadModule(profiles = []) {
  const active_profiles = Array.isArray(profiles)
    ? profiles.filter((profile) => profile && profile.is_active)
    : [];

  const calculated_profiles = active_profiles.map((profile) => {
    const calculated = calculateEmployeeOverheadProfile(profile);

    return {
      ...profile,
      ...calculated,
    };
  });

  const total_employee_overheads_annual = calculated_profiles.reduce(
    (sum, profile) => sum + to_number(profile.employee_overheads_total_annual),
    0
  );

  return {
    calculated_profiles,
    total_employee_overheads_annual,
  };
}