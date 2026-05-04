"use client";

const STORAGE_KEY = "qs_tools_quote_engine_state_v1";

const DEFAULT_QUOTE_ENGINE_STATE = {
  quote_id: "",
  job_id: "",
  job_name: "",
  quote_name: "",
  quote_reference: "",
  quote_date: "",
  quote_status: "draft",
  quote_version: "1",
  quote_price_total: 0,
  material_cost_total: 0,
  material_sell_total: 0,
  material_markup_percent: 0,
  labour_sell_total: 0,
  labour_charge_out_rate: 0,
  base_labour_hours_allowed: 0,
  direct_cost_package_allowance_total: 0,
  direct_cost_package_cost_total: 0,
  created_at: "",
  updated_at: "",
};

function getIsoNow() {
  return new Date().toISOString();
}

export function getDefaultQuoteEngineState() {
  const now = getIsoNow();

  return {
    ...DEFAULT_QUOTE_ENGINE_STATE,
    created_at: now,
    updated_at: now,
  };
}

export function buildQuoteEngineState(overrides = {}) {
  const now = getIsoNow();

  return {
    ...getDefaultQuoteEngineState(),
    ...overrides,
    created_at: overrides.created_at || now,
    updated_at: overrides.updated_at || now,
  };
}

function parseStoredState(raw) {
  if (!raw) {
    return getDefaultQuoteEngineState();
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return buildQuoteEngineState(parsed);
    }
  } catch {
    // Ignore invalid JSON and fall through to defaults.
  }

  return getDefaultQuoteEngineState();
}

export function loadQuoteEngineState() {
  if (typeof window === "undefined") {
    return getDefaultQuoteEngineState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredState(raw);
  } catch {
    return getDefaultQuoteEngineState();
  }
}

export function saveQuoteEngineState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Fail silently if storage is unavailable.
  }
}
