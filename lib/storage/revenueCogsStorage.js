"use client";

const STORAGE_KEY = "qs_tools_revenue_cogs_state_v1";

function getIsoNow() {
  return new Date().toISOString();
}

const DEFAULT_REVENUE_COGS_STATE = {
  units_sold_annual: 0,
  created_at: "",
  updated_at: "",
};

export function getDefaultRevenueCogsState() {
  const now = getIsoNow();

  return {
    ...DEFAULT_REVENUE_COGS_STATE,
    created_at: now,
    updated_at: now,
  };
}

export function buildRevenueCogsState(overrides = {}) {
  const now = getIsoNow();
  const base = getDefaultRevenueCogsState();

  return {
    ...base,
    ...overrides,
    units_sold_annual: Number(overrides.units_sold_annual ?? base.units_sold_annual) || 0,
    created_at: overrides.created_at || base.created_at,
    updated_at: overrides.updated_at || now,
  };
}

function parseStoredState(raw) {
  if (!raw) {
    return getDefaultRevenueCogsState();
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object") {
      return buildRevenueCogsState(parsed);
    }
  } catch {
    // Ignore invalid JSON and fall through to defaults.
  }

  return getDefaultRevenueCogsState();
}

export function loadRevenueCogsState() {
  if (typeof window === "undefined") {
    return getDefaultRevenueCogsState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredState(raw);
  } catch {
    return getDefaultRevenueCogsState();
  }
}

export function saveRevenueCogsState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(buildRevenueCogsState(state))
    );
  } catch {
    // Fail silently if storage is unavailable.
  }
}