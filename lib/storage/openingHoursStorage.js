const OPENING_HOURS_STORAGE_KEY = "mirra_opening_hours_state_v4";

export const DEFAULT_OPENING_HOURS_STATE = {
  opening_hours_profile_id: "default_opening_hours_profile",
  opening_hours_profile_name: "Default Opening Hours",
  profile_version: 1,
  effective_from: "",
  is_active: true,

  standard_week_days: [
    {
      day_id: "monday",
      day_name: "Monday",
      is_open: true,
      open_time: "08:00",
      close_time: "17:00",
      break_minutes: 0,
    },
    {
      day_id: "tuesday",
      day_name: "Tuesday",
      is_open: true,
      open_time: "08:00",
      close_time: "17:00",
      break_minutes: 0,
    },
    {
      day_id: "wednesday",
      day_name: "Wednesday",
      is_open: true,
      open_time: "08:00",
      close_time: "17:00",
      break_minutes: 0,
    },
    {
      day_id: "thursday",
      day_name: "Thursday",
      is_open: true,
      open_time: "08:00",
      close_time: "17:00",
      break_minutes: 0,
    },
    {
      day_id: "friday",
      day_name: "Friday",
      is_open: true,
      open_time: "08:00",
      close_time: "17:00",
      break_minutes: 0,
    },
    {
      day_id: "saturday",
      day_name: "Saturday",
      is_open: false,
      open_time: "08:00",
      close_time: "17:00",
      break_minutes: 0,
    },
    {
      day_id: "sunday",
      day_name: "Sunday",
      is_open: false,
      open_time: "08:00",
      close_time: "17:00",
      break_minutes: 0,
    },
  ],

  seasonal_shutdown_weeks: 4,
  public_holiday_days: 0,
  additional_closed_days: [],
  calendar_notes: "",

  created_at: "",
  updated_at: "",
};

function can_use_local_storage() {
  return typeof window !== "undefined" && window.localStorage;
}

function normalise_state(state) {
  return {
    ...DEFAULT_OPENING_HOURS_STATE,
    ...(state || {}),
    standard_week_days:
      state?.standard_week_days ||
      DEFAULT_OPENING_HOURS_STATE.standard_week_days,
    additional_closed_days: state?.additional_closed_days || [],
  };
}

export function get_opening_hours_state() {
  if (!can_use_local_storage()) {
    return DEFAULT_OPENING_HOURS_STATE;
  }

  const stored = window.localStorage.getItem(OPENING_HOURS_STORAGE_KEY);

  if (!stored) {
    const initial_state = {
      ...DEFAULT_OPENING_HOURS_STATE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    window.localStorage.setItem(
      OPENING_HOURS_STORAGE_KEY,
      JSON.stringify(initial_state)
    );

    return initial_state;
  }

  try {
    return normalise_state(JSON.parse(stored));
  } catch {
    return DEFAULT_OPENING_HOURS_STATE;
  }
}

export function set_opening_hours_state(next_state) {
  if (!can_use_local_storage()) {
    return;
  }

  window.localStorage.setItem(
    OPENING_HOURS_STORAGE_KEY,
    JSON.stringify(normalise_state(next_state))
  );

  window.dispatchEvent(new Event("opening-hours-storage-updated"));
}

export function reset_opening_hours_state() {
  if (!can_use_local_storage()) {
    return;
  }

  const reset_state = {
    ...DEFAULT_OPENING_HOURS_STATE,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  window.localStorage.setItem(
    OPENING_HOURS_STORAGE_KEY,
    JSON.stringify(reset_state)
  );

  window.dispatchEvent(new Event("opening-hours-storage-updated"));
}