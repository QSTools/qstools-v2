"use client";

const STORAGE_KEY = "qs_tools_business_modelling_state_v1";

function getIsoNow() {
  return new Date().toISOString();
}

const DEFAULT_BUSINESS_MODELLING_STATE = {
  baseline_snapshot: null,
  upside_scenario: null,
  downside_scenario: null,
  selected_model_type: "baseline",
  selected_model_id: "",
  created_at: "",
  updated_at: "",
};

export function getDefaultBusinessModellingState() {
  const now = getIsoNow();

  return {
    ...DEFAULT_BUSINESS_MODELLING_STATE,
    created_at: now,
    updated_at: now,
  };
}

export function buildBusinessModellingState(overrides = {}) {
  const now = getIsoNow();
  const base = getDefaultBusinessModellingState();

  return {
    ...base,
    ...overrides,
    created_at: overrides.created_at || base.created_at,
    updated_at: overrides.updated_at || now,
  };
}

function parseStoredState(raw) {
  if (!raw) {
    return getDefaultBusinessModellingState();
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return buildBusinessModellingState(parsed);
    }
  } catch {
    // Ignore invalid JSON and fall through to defaults.
  }

  return getDefaultBusinessModellingState();
}

export function loadBusinessModellingState() {
  if (typeof window === "undefined") {
    return getDefaultBusinessModellingState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredState(raw);
  } catch {
    return getDefaultBusinessModellingState();
  }
}

export function saveBusinessModellingState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Fail silently if storage is unavailable.
  }
}
