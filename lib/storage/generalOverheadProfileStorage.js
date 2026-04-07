const GENERAL_OVERHEAD_PROFILE_STORAGE_KEY = "qs_tools_saved_overheads";

function get_profile_list() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(GENERAL_OVERHEAD_PROFILE_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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

export function save_overhead_profile(overhead_record) {
  const saved_overheads = get_profile_list();

  const next_saved = [
    overhead_record,
    ...saved_overheads.filter(
      (item) => item.overhead_profile_id !== overhead_record.overhead_profile_id
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