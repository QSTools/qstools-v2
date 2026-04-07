const STORAGE_KEY = "qs_tools_recovery_summary_profiles";

function parse_profiles(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed_value = JSON.parse(value);
    return Array.isArray(parsed_value) ? parsed_value : [];
  } catch (error) {
    return [];
  }
}

export function getRecoverySummaryProfiles() {
  if (typeof window === "undefined") {
    return [];
  }

  return parse_profiles(window.localStorage.getItem(STORAGE_KEY));
}

export function saveRecoverySummaryProfile(profile) {
  if (typeof window === "undefined") {
    return [];
  }

  const existing_profiles = getRecoverySummaryProfiles();
  const next_profiles = [...existing_profiles, profile];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next_profiles));

  return next_profiles;
}

export function deleteRecoverySummaryProfile(profile_id) {
  if (typeof window === "undefined") {
    return [];
  }

  const existing_profiles = getRecoverySummaryProfiles();
  const next_profiles = existing_profiles.filter(
    (profile) => profile?.recovery_profile_id !== profile_id
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next_profiles));

  return next_profiles;
}