import { calculateEmployeeOverheadModule } from "@/lib/calculations/employeeOverheadCalculations";

function sort_by_staff_name(a, b) {
  const name_a = String(a?.staff_name || "").toLowerCase();
  const name_b = String(b?.staff_name || "").toLowerCase();
  return name_a.localeCompare(name_b);
}

export function buildEmployeeOverheadStatus({
  labour_profiles = [],
  selected_staff_id = "",
  active_profile = null,
}) {
  const active_labour_profiles = Array.isArray(labour_profiles)
    ? labour_profiles.filter((profile) => profile && profile.is_active)
    : [];

  const warnings = [];

  if (active_labour_profiles.length === 0) {
    warnings.push("No active Labour profiles");
  }

  if (!selected_staff_id) {
    warnings.push("No selected staff");
  }

  if (selected_staff_id && !active_profile) {
    warnings.push("No overheads saved yet");
  }

  return {
    active_staff_available: active_labour_profiles.length,
    selected_staff_id,
    selected_staff_found: Boolean(selected_staff_id),
    has_linked_overhead_profile: Boolean(active_profile),
    warnings,
  };
}

export function buildEmployeeOverheadStaffOptions(labour_profiles = []) {
  const active_labour_profiles = Array.isArray(labour_profiles)
    ? labour_profiles.filter((profile) => profile && profile.is_active)
    : [];

  return active_labour_profiles
    .map((profile) => ({
      staff_id: profile.staff_id,
      staff_name: profile.staff_name || "Unnamed Staff",
      staff_role: profile.staff_role || "",
      is_active: Boolean(profile.is_active),
    }))
    .sort(sort_by_staff_name);
}

export function buildEmployeeOverheadCard({
  labour_profiles = [],
  employee_overhead_profiles = [],
  selected_staff_id = "",
}) {
  const staff_options = buildEmployeeOverheadStaffOptions(labour_profiles);

  const selected_staff =
    staff_options.find((staff) => staff.staff_id === selected_staff_id) || null;

  const active_profile =
    employee_overhead_profiles.find(
      (profile) => profile.staff_id === selected_staff_id && profile.is_active
    ) || null;

  const { calculated_profiles, total_employee_overheads_annual } =
    calculateEmployeeOverheadModule(employee_overhead_profiles);

  const selected_staff_total_annual = active_profile
    ? active_profile.employee_overheads_total_annual || 0
    : 0;

  return {
    staff_options,
    selected_staff,
    active_profile,
    selected_staff_total_annual,
    total_employee_overheads_annual,
    calculated_profiles,
  };
}

export function buildEmployeeOverheadOutputContract(
  employee_overhead_profiles = [],
  labour_profiles = []
) {
  const active_labour_staff_ids = new Set(
    Array.isArray(labour_profiles)
      ? labour_profiles
          .filter((profile) => profile && profile.is_active)
          .map((profile) => profile.staff_id)
      : []
  );

  const active_profiles = Array.isArray(employee_overhead_profiles)
    ? employee_overhead_profiles.filter(
        (profile) =>
          profile &&
          profile.is_active &&
          active_labour_staff_ids.has(profile.staff_id)
      )
    : [];

  const per_staff = active_profiles.map((profile) => ({
    staff_id: profile.staff_id,
    employee_overheads_total_annual:
      Number(profile.employee_overheads_total_annual) || 0,
  }));

  const total_employee_overheads_annual = per_staff.reduce(
    (sum, row) => sum + row.employee_overheads_total_annual,
    0
  );

  return {
    per_staff,
    total_employee_overheads_annual,
  };
}