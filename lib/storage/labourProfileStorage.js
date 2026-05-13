import { buildLabourState } from "@/lib/storage/labourStorage";

const STORAGE_KEY = "qs_tools_labour_profiles_v1";

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
      const data = buildLabourState(profile?.data ?? {});
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
        data: buildLabourState({
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
    data: buildLabourState({
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
    data: buildLabourState({
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

export default getStoredLabourProfiles;