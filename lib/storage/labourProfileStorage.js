import { buildLabourState, DEFAULT_STAFF_TYPES } from "@/lib/storage/labourStorage";

const STORAGE_KEY = "qs_tools_labour_profiles_v1";
const STAFF_TYPES_STORAGE_KEY = "qs_tools_labour_staff_types_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function getNowIso() {
  return new Date().toISOString();
}

function getNextProfileVersion(profile = {}) {
  const current_version = Number(profile.profile_version || 0);
  return current_version > 0 ? current_version + 1 : 1;
}

function normaliseLabourProfileData(data = {}) {
  return buildLabourState({
    ...data,
    contributes_to_recovery_hours:
      data.contributes_to_recovery_hours !== false,
  });
}

export function getLabourProfileStorageKey() {
  return STORAGE_KEY;
}

export function generateStaffId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `staff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getStoredLabourProfiles() {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.map((profile) => {
      const now = getNowIso();
      const data = normaliseLabourProfileData(profile?.data ?? {});
      const staff_id = profile?.staff_id || data.staff_id || generateStaffId();

      return {
        ...profile,
        profile_id: profile?.profile_id || staff_id,
        staff_id,
        profile_version: Number(profile?.profile_version || 1),
        effective_from: profile?.effective_from || data.effective_from || profile?.created_at || now,
        is_active: profile?.is_active !== false,
        created_at: profile?.created_at || now,
        updated_at: profile?.updated_at || profile?.created_at || now,
        change_reason: profile?.change_reason || data.change_reason || "",
        notes: profile?.notes || data.notes || "",
        data: normaliseLabourProfileData({
          ...data,
          staff_id,
          effective_from:
            data.effective_from ||
            profile?.effective_from ||
            profile?.created_at ||
            now,
          change_reason: data.change_reason || profile?.change_reason || "",
          notes: data.notes || profile?.notes || "",
        }),
      };
    });
  } catch {
    return [];
  }
}

export function setStoredLabourProfiles(profiles = []) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function createLabourProfileRecord(state = {}) {
  const now = getNowIso();
  const staff_id = state.staff_id || generateStaffId();
  const effective_from = state.effective_from || now;
  const change_reason = state.change_reason || "";
  const notes = state.notes || "";

  return {
    profile_id: staff_id,
    staff_id,
    profile_version: 1,
    effective_from,
    is_active: true,
    created_at: now,
    updated_at: now,
    change_reason,
    notes,
    data: normaliseLabourProfileData({
      ...state,
      staff_id,
      effective_from,
      change_reason,
      notes,
    }),
  };
}

export function updateLabourProfileRecord(profile = {}, next_state = {}) {
  const now = getNowIso();
  const staff_id = profile.staff_id || next_state.staff_id || generateStaffId();
  const effective_from =
    next_state.effective_from || profile.effective_from || profile.created_at || now;
  const change_reason = next_state.change_reason || profile.change_reason || "";
  const notes = next_state.notes || profile.notes || "";

  return {
    ...profile,
    profile_id: profile.profile_id || staff_id,
    staff_id,
    profile_version: getNextProfileVersion(profile),
    effective_from,
    is_active: profile.is_active !== false,
    created_at: profile.created_at || now,
    updated_at: now,
    change_reason,
    notes,
    data: normaliseLabourProfileData({
      ...next_state,
      staff_id,
      effective_from,
      change_reason,
      notes,
    }),
  };
}

export function deleteLabourProfileRecord(profiles = [], profile_id = "") {
  return profiles.filter((profile) => profile.profile_id !== profile_id);
}

export function findLabourProfileById(profiles = [], profile_id = "") {
  return profiles.find((profile) => profile.profile_id === profile_id) || null;
}

export function generateStaffTypeId(staff_type_name = "") {
  const clean_name = String(staff_type_name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!clean_name) {
    return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Check for collision with system types
  const system_type = DEFAULT_STAFF_TYPES.find(
    (t) =>
      t.staff_type_name.toLowerCase() === String(staff_type_name).toLowerCase()
  );
  if (system_type) {
    return system_type.staff_type_id;
  }

  return `custom_${clean_name}`;
}

export function getStoredStaffTypes() {
  if (!isBrowser()) return DEFAULT_STAFF_TYPES;

  try {
    const raw = window.localStorage.getItem(STAFF_TYPES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (Array.isArray(parsed) && parsed.length > 0) {
      // Return stored types, ensuring defaults are included
      const custom_types = parsed.filter((t) => t?.is_system_type !== true);
      return [...DEFAULT_STAFF_TYPES, ...custom_types];
    }

    return DEFAULT_STAFF_TYPES;
  } catch {
    return DEFAULT_STAFF_TYPES;
  }
}

export function setStoredStaffTypes(staff_types = []) {
  if (!isBrowser()) return;

  // Store only custom types (not system types)
  const custom_types = staff_types.filter((t) => t?.is_system_type !== true);
  window.localStorage.setItem(STAFF_TYPES_STORAGE_KEY, JSON.stringify(custom_types));
}

export function createStaffType(staff_type_name = "") {
  const clean_name = String(staff_type_name || "").trim();

  if (!clean_name) {
    return null;
  }

  const now = getNowIso();
  const staff_type_id = generateStaffTypeId(clean_name);

  // Check if it already exists
  const existing = getStoredStaffTypes().find(
    (t) => t.staff_type_id === staff_type_id
  );
  if (existing) {
    return existing;
  }

  return {
    staff_type_id,
    staff_type_name: clean_name,
    is_system_type: false,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function addStaffType(staff_type_name = "") {
  const new_type = createStaffType(staff_type_name);
  if (!new_type) {
    return null;
  }

  const current_types = getStoredStaffTypes();
  const updated_types = [...current_types, new_type];
  setStoredStaffTypes(updated_types);

  return new_type;
}

export default getStoredLabourProfiles;
