"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getDefaultBusinessModellingScenarioState,
  loadBusinessModellingScenarioState,
  saveBusinessModellingScenarioState,
  buildBusinessModellingScenarioState,
} from "@/lib/storage/businessModellingScenarioStorage";
import {
  buildBaselineSnapshotFromLive,
  calculateDownsideAsBreakeven,
} from "@/lib/calculations/businessModellingScenarioCalculations";

function create_uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `baseline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * useBusinessModellingScenario
 *
 * Built 2026-09-13 per BUSINESS_MODELLING_SCENARIO_REDESIGN_DECISION_LOCK_2026-09-12.txt.
 * Takes per_source as an INPUT (not computed here) - reuses whatever
 * the page/useBusinessModelling.js already computed, avoids running
 * the expensive live-cascade calculation twice on the same page.
 *
 * has_loaded guard applied from the start (not discovered as a bug
 * this time) - the exact race condition found live in useBalanceSheet.js
 * 2026-09-12 (save-before-load silently wiping real data on every
 * navigation).
 */
export default function useBusinessModellingScenario(per_source) {
  const [state, setState] = useState(() => getDefaultBusinessModellingScenarioState());
  const [has_loaded, set_has_loaded] = useState(false);

  useEffect(() => {
    const stored_state = loadBusinessModellingScenarioState();
    setState(stored_state);
    set_has_loaded(true);
  }, []);

  useEffect(() => {
    if (!has_loaded) return;
    saveBusinessModellingScenarioState(state);
  }, [state, has_loaded]);

  const current_baseline = useMemo(
    () => state.baseline_history.find((b) => b.is_current) || null,
    [state.baseline_history]
  );

  const downside = useMemo(
    () => calculateDownsideAsBreakeven(current_baseline?.snapshot),
    [current_baseline]
  );

  function lockNewBaseline(label) {
    const new_snapshot = buildBaselineSnapshotFromLive(per_source);
    if (!new_snapshot.available) return { success: false, error: "Live data not ready yet." };

    const new_entry = {
      baseline_id: create_uuid(),
      label: label || new Date().toLocaleDateString("en-NZ", { year: "numeric", month: "short" }),
      locked_at: new Date().toISOString(),
      is_current: true,
      snapshot: new_snapshot,
    };

    setState((previous) =>
      buildBusinessModellingScenarioState({
        ...previous,
        baseline_history: [
          ...previous.baseline_history.map((b) => ({ ...b, is_current: false })),
          new_entry,
        ],
      })
    );

    return { success: true };
  }

  function revertToBaseline(baseline_id) {
    setState((previous) =>
      buildBusinessModellingScenarioState({
        ...previous,
        baseline_history: previous.baseline_history.map((b) => ({
          ...b,
          is_current: b.baseline_id === baseline_id,
        })),
      })
    );
  }

  function saveUpsideScenario({ rate_target_by_group_id, materials_markup_percent }) {
    setState((previous) =>
      buildBusinessModellingScenarioState({
        ...previous,
        upside_scenario: {
          rate_target_by_group_id,
          materials_markup_percent,
          saved_at: new Date().toISOString(),
        },
      })
    );
  }

  function clearUpsideScenario() {
    setState((previous) =>
      buildBusinessModellingScenarioState({
        ...previous,
        upside_scenario: null,
      })
    );
  }

  return {
    baseline_history: state.baseline_history,
    current_baseline,
    downside,
    upside_scenario: state.upside_scenario,
    lockNewBaseline,
    revertToBaseline,
    saveUpsideScenario,
    clearUpsideScenario,
  };
}