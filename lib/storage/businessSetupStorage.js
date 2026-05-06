"use client";

const STORAGE_KEY = "qs_tools_business_setup_v1";

function getIsoNow() {
  return new Date().toISOString();
}

const DEFAULT_BUSINESS_SETUP_STATE = {
  business_name: "",
  business_type: "labour_based",
  setup_completed: false,
  created_at: "",
  updated_at: "",
};

export function getDefaultBusinessSetupState() {
  const now = getIsoNow();

  return {
    ...DEFAULT_BUSINESS_SETUP_STATE,
    created_at: now,
    updated_at: now,
  };
}

export function buildBusinessSetupState(overrides = {}) {
  const now = getIsoNow();
  const base = getDefaultBusinessSetupState();

  const business_name =
    typeof overrides.business_name === "string"
      ? overrides.business_name
      : base.business_name;

  const business_type =
    overrides.business_type === "product_based" ||
    overrides.business_type === "labour_based"
      ? overrides.business_type
      : base.business_type;

  const setup_completed =
    typeof overrides.setup_completed === "boolean"
      ? overrides.setup_completed
      : Boolean(business_name.trim()) && Boolean(business_type);

  return {
    ...base,
    ...overrides,
    business_name,
    business_type,
    setup_completed,
    created_at: overrides.created_at || base.created_at,
    updated_at: overrides.updated_at || now,
  };
}

function parseStoredState(raw) {
  if (!raw) {
    return getDefaultBusinessSetupState();
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object") {
      return buildBusinessSetupState(parsed);
    }
  } catch {
    // Ignore invalid JSON and fall through to defaults.
  }

  return getDefaultBusinessSetupState();
}

export function loadBusinessSetupState() {
  if (typeof window === "undefined") {
    return getDefaultBusinessSetupState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredState(raw);
  } catch {
    return getDefaultBusinessSetupState();
  }
}

export function saveBusinessSetupState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(buildBusinessSetupState(state))
    );
  } catch {
    // Fail silently if storage is unavailable.
  }
}

export function clearBusinessSetupState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fail silently if storage is unavailable.
  }
}