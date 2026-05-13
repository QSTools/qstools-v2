const GENERAL_OVERHEAD_PROFILE_STORAGE_KEY = "qs_tools_saved_overheads";

function get_timestamp() {
  return new Date().toISOString();
}

function get_next_profile_version(existing_profile = {}) {
  const current_version = Number(existing_profile.profile_version || 0);
  return current_version > 0 ? current_version + 1 : 1;
}

function get_profile_list() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      GENERAL_OVERHEAD_PROFILE_STORAGE_KEY
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((profile) => {
      const now = get_timestamp();

      return {
        ...profile,
        profile_version: Number(profile.profile_version || 1),
        effective_from:
          profile.effective_from || profile.created_at || now,
        is_active: profile.is_active !== false,
        created_at: profile.created_at || now,
        updated_at: profile.updated_at || profile.created_at || now,
        change_reason: profile.change_reason || "",
        notes: profile.notes || "",
      };
    });
  } catch {
    return [];
  }
}

function set_profile_list(saved_overheads) {
  if (typeof window === "undefined") {
    return saved_overheads;
  }

  window.localStorage.setItem(
    GENERAL_OVERHEAD_PROFILE_STORAGE_KEY,
    JSON.stringify(saved_overheads)
  );

  return saved_overheads;
}

export function load_saved_overheads() {
  return get_profile_list();
}

export function save_overhead_profile(overhead_record = {}) {
  const saved_overheads = get_profile_list();
  const now = get_timestamp();

  const existing_profile = saved_overheads.find(
    (item) => item.overhead_profile_id === overhead_record.overhead_profile_id
  );

  const next_record = {
    ...overhead_record,
    profile_version: existing_profile
      ? get_next_profile_version(existing_profile)
      : Number(overhead_record.profile_version || 1),
    effective_from:
      overhead_record.effective_from ||
      existing_profile?.effective_from ||
      overhead_record.created_at ||
      now,
    is_active: overhead_record.is_active !== false,
    created_at:
      existing_profile?.created_at ||
      overhead_record.created_at ||
      now,
    updated_at: now,
    change_reason:
      overhead_record.change_reason ||
      existing_profile?.change_reason ||
      "",
    notes:
      overhead_record.notes ||
      existing_profile?.notes ||
      "",
  };

  const next_saved = [
    next_record,
    ...saved_overheads.filter(
      (item) => item.overhead_profile_id !== next_record.overhead_profile_id
    ),
  ];

  return set_profile_list(next_saved);
}

export function load_overhead_profile(overhead_profile_id) {
  return get_profile_list().find(
    (item) => item.overhead_profile_id === overhead_profile_id
  );
}

export function delete_overhead_profile(overhead_profile_id) {
  const next_saved = get_profile_list().filter(
    (item) => item.overhead_profile_id !== overhead_profile_id
  );

  return set_profile_list(next_saved);
}