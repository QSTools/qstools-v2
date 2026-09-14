"use client";

// Business Modelling Scenario Redesign - storage layer, built
// 2026-09-13 per BUSINESS_MODELLING_SCENARIO_REDESIGN_DECISION_LOCK_2026-09-12.txt.
// Deliberately a SEPARATE storage key from the old system
// (businessModellingStorage.js, qs_tools_business_modelling_state_v1) -
// the old system stays untouched as a safety net until this one is
// verified working, per the decision lock.
//
// Baseline: full HISTORY kept, never deleted - each locked snapshot is
// a real, dated entry, exactly one marked is_current. This serves two
// purposes at once (user decision 2026-09-13): re-locking is
// suggested/revertible (need old ones to revert TO), and separately
// enables real period-over-period trend comparison (same underlying
// "store dated snapshots" need flagged in CFO_REQUIREMENTS_GAP_2026-09-12.txt).
//
// Upside: ONE scenario at a time (user decision 2026-09-13, simpler).
//
// Downside: NOT stored at all - always calculated live from whichever
// Baseline is current, against real breakeven_revenue. Storing it would
// be storing a derived value, risking drift from the real number.

const STORAGE_KEY = "qs_tools_business_modelling_scenario_state_v1";

function getIsoNow() {
  return new Date().toISOString();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseBaselineSnapshot(entry = {}) {
  return {
    baseline_id: entry.baseline_id || "",
    label: entry.label || "",
    locked_at: entry.locked_at || "",
    is_current: entry.is_current === true,
    snapshot: {
      total_net_profit: toNumberOrNull(entry.snapshot?.total_net_profit),
      total_revenue: toNumberOrNull(entry.snapshot?.total_revenue),
      breakeven_revenue: toNumberOrNull(entry.snapshot?.breakeven_revenue),
      group_breakdown: Array.isArray(entry.snapshot?.group_breakdown)
        ? entry.snapshot.group_breakdown
        : [],
    },
  };
}

function normaliseBaselineHistory(history) {
  if (!Array.isArray(history)) return [];
  const normalised = history.map(normaliseBaselineSnapshot).filter((b) => b.baseline_id);

  // Guard: exactly one is_current, ever. If zero or multiple, the most
  // recently locked one wins - never silently leave the app with no
  // current baseline or an ambiguous one.
  const current_ones = normalised.filter((b) => b.is_current);
  if (current_ones.length !== 1 && normalised.length > 0) {
    const most_recent = [...normalised].sort((a, b) => (b.locked_at || "").localeCompare(a.locked_at || ""))[0];
    return normalised.map((b) => ({ ...b, is_current: b.baseline_id === most_recent.baseline_id }));
  }

  return normalised;
}

function normaliseUpsideScenario(upside) {
  if (!upside || typeof upside !== "object") return null;
  return {
    rate_target_by_group_id:
      upside.rate_target_by_group_id && typeof upside.rate_target_by_group_id === "object"
        ? upside.rate_target_by_group_id
        : {},
    materials_markup_percent: toNumberOrNull(upside.materials_markup_percent),
    saved_at: upside.saved_at || "",
  };
}

const DEFAULT_STATE = {
  baseline_history: [],
  upside_scenario: null,
  created_at: "",
  updated_at: "",
};

export function getDefaultBusinessModellingScenarioState() {
  const now = getIsoNow();
  return { ...DEFAULT_STATE, created_at: now, updated_at: now };
}

export function buildBusinessModellingScenarioState(overrides = {}) {
  const now = getIsoNow();
  const base = getDefaultBusinessModellingScenarioState();

  return {
    ...base,
    ...overrides,
    baseline_history: normaliseBaselineHistory(overrides.baseline_history ?? base.baseline_history),
    upside_scenario: normaliseUpsideScenario(overrides.upside_scenario ?? base.upside_scenario),
    created_at: overrides.created_at || base.created_at,
    updated_at: overrides.updated_at || now,
  };
}

function parseStoredState(raw) {
  if (!raw) return getDefaultBusinessModellingScenarioState();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return buildBusinessModellingScenarioState(parsed);
    }
  } catch {
    // Ignore invalid JSON and fall through to defaults.
  }
  return getDefaultBusinessModellingScenarioState();
}

export function loadBusinessModellingScenarioState() {
  if (typeof window === "undefined") return getDefaultBusinessModellingScenarioState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredState(raw);
  } catch {
    return getDefaultBusinessModellingScenarioState();
  }
}

export function saveBusinessModellingScenarioState(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildBusinessModellingScenarioState(state)));
  } catch {
    // Fail silently if storage is unavailable.
  }
}