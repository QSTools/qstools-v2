import { buildLiveLeverHeadline } from "@/lib/selectors/businessModellingLeverSelectors";

// Business Modelling Scenario Redesign - calculations, built 2026-09-13
// per BUSINESS_MODELLING_SCENARIO_REDESIGN_DECISION_LOCK_2026-09-12.txt.

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round_currency(value) {
  const n = to_number(value);
  return n === null ? null : Math.round(n * 100) / 100;
}

/**
 * buildBaselineSnapshotFromLive
 *
 * Builds a genuine, unmodified Baseline snapshot - calls
 * buildLiveLeverHeadline with EMPTY levers ({}, null), deliberately
 * ignoring whatever scenario the user might currently have set in the
 * UI, so Baseline always reflects real current reality, not a
 * half-edited scenario. This is the ONLY place Baseline data gets
 * built - the lock action calls this, nothing else does.
 */
export function buildBaselineSnapshotFromLive(per_source) {
  const live_headline = buildLiveLeverHeadline(per_source, {}, null);

  if (!live_headline?.available) {
    return { available: false };
  }

  const breakeven_revenue = to_number(per_source?.reconciliation?.total_true_cost);

  const group_breakdown = (live_headline.all_sources || []).map((s) => ({
    key: s.key,
    name: s.name,
    net_profit: round_currency(s.net_profit),
  }));

  return {
    available: true,
    total_net_profit: round_currency(live_headline.total_net_profit),
    total_revenue: round_currency(live_headline.total_modelled_revenue),
    breakeven_revenue,
    group_breakdown,
  };
}

/**
 * calculateDownsideAsBreakeven
 *
 * Downside is NEVER stored - always calculated live from whichever
 * Baseline is current. Per the decision lock: if Baseline is
 * profitable, Downside sits BELOW it (room to fall before breakeven);
 * if Baseline is a loss, Downside sits ABOVE it (climb needed to reach
 * breakeven). Returns the distance either way, always as a positive
 * number, with direction so the UI can phrase it correctly.
 */
/**
 * buildUpsideHeadline
 *
 * Computes the SAVED Upside scenario's own result - deliberately using
 * upside_scenario's stored levers, NOT whatever the live-lever card's
 * editable rate boxes currently show (which could be mid-edit on
 * something unrelated to this saved scenario). A saved Upside always
 * displays its own true result.
 */
export function buildUpsideHeadline(per_source, upside_scenario) {
  if (!upside_scenario) {
    return { available: false };
  }

  const live_headline = buildLiveLeverHeadline(
    per_source,
    upside_scenario.rate_target_by_group_id || {},
    upside_scenario.materials_markup_percent
  );

  if (!live_headline?.available) {
    return { available: false };
  }

  return {
    available: true,
    total_net_profit: round_currency(live_headline.total_net_profit),
    total_revenue: round_currency(live_headline.total_modelled_revenue),
  };
}

export function calculateDownsideAsBreakeven(baseline_snapshot) {
  // FIX (found live 2026-09-14): was checking baseline_snapshot.available,
  // a flag that does NOT survive the storage round-trip -
  // normaliseBaselineSnapshot (fixedAssetRegisterStorage-style storage
  // pattern) explicitly rebuilds the snapshot object listing only its
  // 4 real data fields, silently dropping "available" in the process -
  // the exact "middle layer drops the field" bug class this whole
  // project has hit repeatedly. Fixed by checking the ACTUAL required
  // data directly instead of a flag that has to be kept in sync across
  // a storage boundary - more robust, can't drift out of sync again.
  const baseline_net_profit = to_number(baseline_snapshot?.total_net_profit);
  const breakeven_revenue = to_number(baseline_snapshot?.breakeven_revenue);

  if (baseline_net_profit === null || breakeven_revenue === null) {
    return { available: false };
  }

  const direction = baseline_net_profit >= 0 ? "below" : "above";
  const distance = Math.abs(baseline_net_profit);

  return {
    available: true,
    revenue: breakeven_revenue,
    net_profit: 0,
    direction,
    distance_from_baseline: round_currency(distance),
  };
}