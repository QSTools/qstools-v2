const STORAGE_KEY = "qs_employee_overhead_profiles_v1";

function safe_parse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function get_now_iso() {
  return new Date().toISOString();
}

function generate_id(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loadEmployeeOverheadProfiles() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safe_parse(raw, []);

  return Array.isArray(parsed) ? parsed : [];
}

export function saveEmployeeOverheadProfiles(profiles = []) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function createBlankEmployeeOverheadProfile({
  staff_id = "",
  profile_version = 1,
} = {}) {
  const now = get_now_iso();

  return {
    employee_overhead_profile_id: generate_id("eop"),
    staff_id,
    training_cost_annual: 0,
    ppe_cost_annual: 0,
    staff_transport_allowance_annual: 0,
    phone_allowance_annual: 0,
    custom_assignment_rows: [],
    employee_overheads_total_annual: 0,
    profile_version,
    effective_from: now,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function createStaffCustomAssignmentRow({
  staff_id = "",
  template = null,
}) {
  const now = get_now_iso();

  return {
    staff_overhead_item_id: generate_id("soi"),
    staff_id,
    overhead_source_type: "custom",
    overhead_key: template?.custom_overhead_template_id || generate_id("custom"),
    overhead_name: template?.custom_overhead_name || "",
    amount_annual: Number(template?.default_amount_annual) || 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function createGenericAssignmentRow({
  staff_id = "",
  overhead_key = "",
  overhead_name = "",
  amount_annual = 0,
}) {
  const now = get_now_iso();

  return {
    staff_overhead_item_id: generate_id("soi"),
    staff_id,
    overhead_source_type: "generic",
    overhead_key,
    overhead_name,
    amount_annual: Number(amount_annual) || 0,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function getActiveEmployeeOverheadProfileByStaffId(staff_id) {
  const profiles = loadEmployeeOverheadProfiles();

  return (
    profiles.find((profile) => profile.staff_id === staff_id && profile.is_active) ||
    null
  );
}

export function upsertActiveEmployeeOverheadProfile(next_profile) {
  const profiles = loadEmployeeOverheadProfiles();

  const current_active = profiles.find(
    (profile) =>
      profile.staff_id === next_profile.staff_id && profile.is_active === true
  );

  const next_profiles = profiles.map((profile) => {
    if (
      current_active &&
      profile.employee_overhead_profile_id ===
        current_active.employee_overhead_profile_id
    ) {
      return {
        ...profile,
        is_active: false,
        updated_at: get_now_iso(),
      };
    }

    return profile;
  });

  next_profiles.push({
    ...next_profile,
    employee_overhead_profile_id:
      next_profile.employee_overhead_profile_id || generate_id("eop"),
    is_active: true,
    created_at: next_profile.created_at || get_now_iso(),
    updated_at: get_now_iso(),
  });

  saveEmployeeOverheadProfiles(next_profiles);
  return next_profiles;
}

export function deleteEmployeeOverheadProfilesByStaffId(staff_id) {
  if (!staff_id) {
    return loadEmployeeOverheadProfiles();
  }

  const profiles = loadEmployeeOverheadProfiles();

  const next_profiles = profiles.filter(
    (profile) => profile.staff_id !== staff_id
  );

  saveEmployeeOverheadProfiles(next_profiles);
  return next_profiles;
}