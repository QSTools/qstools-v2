"use client";

const STORAGE_KEY = "qs_tools_revenue_cogs_state_v2";

function getIsoNow() {
  return new Date().toISOString();
}

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normaliseUnitType(value) {
  const allowed = new Set(["each", "m2", "m3", "lm", "tonne", "hour", "custom"]);
  return allowed.has(value) ? value : "each";
}

function normaliseCommercialDriverMode(value) {
  const allowed = new Set(["hours_based", "unit_based", "mixed_unit_based"]);
  return allowed.has(value) ? value : "hours_based";
}

function createDefaultUnitDriverRow(index = 0) {
  return {
    id: `unit-driver-${index + 1}`,
    unit_label: index === 0 ? "Primary unit" : `Unit ${index + 1}`,
    unit_type: "each",
    revenue_share_percent: index === 0 ? 100 : 0,
    average_sale_rate_per_unit: 0,
  };
}

function normaliseUnitDriverRow(row = {}, index = 0) {
  const fallback = createDefaultUnitDriverRow(index);

  return {
    ...fallback,
    ...row,
    id: row.id || row.unit_driver_id || fallback.id,
    unit_label: row.unit_label || row.label || fallback.unit_label,
    unit_type: normaliseUnitType(row.unit_type),
    revenue_share_percent: toNumber(row.revenue_share_percent),
    average_sale_rate_per_unit: toNumber(row.average_sale_rate_per_unit),
  };
}

function normaliseUnitDriverRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [createDefaultUnitDriverRow(0)];
  }

  return rows.map(normaliseUnitDriverRow);
}

const DEFAULT_REVENUE_COGS_STATE = {
  commercial_driver_mode: "hours_based",
  units_sold_annual: 0,
  unit_driver_rows: [createDefaultUnitDriverRow(0)],
  created_at: "",
  updated_at: "",
};

export function getDefaultRevenueCogsState() {
  const now = getIsoNow();

  return {
    ...DEFAULT_REVENUE_COGS_STATE,
    unit_driver_rows: normaliseUnitDriverRows(
      DEFAULT_REVENUE_COGS_STATE.unit_driver_rows
    ),
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
    commercial_driver_mode: normaliseCommercialDriverMode(
      overrides.commercial_driver_mode ?? base.commercial_driver_mode
    ),
    units_sold_annual:
      toNumber(overrides.units_sold_annual ?? base.units_sold_annual) || 0,
    unit_driver_rows: normaliseUnitDriverRows(
      overrides.unit_driver_rows ?? base.unit_driver_rows
    ),
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