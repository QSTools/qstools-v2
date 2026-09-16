"use client";

import { useMemo, useState } from "react";

import useBusinessSummary from "@/hooks/useBusinessSummary";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import {
  buildLiveLeverHeadline,
  buildBreakevenSummary,
  buildGroupLeverRows,
  buildMaterialsLeverRow,
  buildProportionalSuggestions,
  resolveLeverOverrides,
} from "@/lib/selectors/businessModellingLeverSelectors";
import useBusinessModellingLegacyScenario from "@/hooks/useBusinessModellingLegacyScenario";

// Orchestrator hook. Split 2026-09-16 - the legacy baseline/upside/
// downside system (fed from useBusinessSummary) now lives in
// useBusinessModellingLegacyScenario.js. This file's job is: fetch
// per_source once, run the live-lever system on it, and merge that
// with whatever the legacy hook returns - same flattened return shape
// as before the split, nothing renamed or removed.
export default function useBusinessModelling() {
  const business_summary = useBusinessSummary();
  const per_source_raw = useBusinessOutcomePerSourceRevenue();
  const per_source = selectBusinessOutcomePerSourceRevenue(per_source_raw);

  const legacy = useBusinessModellingLegacyScenario(business_summary);

  const [rate_target_by_group_id, set_rate_target_by_group_id] = useState({});
  const [materials_markup_percent, set_materials_markup_percent] = useState(null);

  function updateLeverTargetRate(group_id, value) {
    set_rate_target_by_group_id((previous) => ({
      ...previous,
      [group_id]: value,
    }));
  }

  function updateMaterialsMarkupPercent(value) {
    set_materials_markup_percent(value);
  }

  const live_headline = useMemo(
    () => buildLiveLeverHeadline(per_source, rate_target_by_group_id, materials_markup_percent),
    [per_source, rate_target_by_group_id, materials_markup_percent]
  );
  const breakeven_summary = useMemo(() => buildBreakevenSummary(per_source), [per_source]);
  const lever_rows = useMemo(
    () => buildGroupLeverRows(per_source, rate_target_by_group_id),
    [per_source, rate_target_by_group_id]
  );
  const materials_lever_row = useMemo(
    () => buildMaterialsLeverRow(per_source, materials_markup_percent),
    [per_source, materials_markup_percent]
  );

  const proportional_suggestions = useMemo(
    () => buildProportionalSuggestions(per_source),
    [per_source]
  );

  function applyProportionalSuggestions() {
    if (!proportional_suggestions?.available || proportional_suggestions.targets.length === 0) {
      return;
    }
    const next = {};
    proportional_suggestions.targets.forEach((t) => {
      if (t.suggested_target_rate !== null) {
        next[t.group_id] = t.suggested_target_rate;
      }
    });
    set_rate_target_by_group_id(next);
  }

  // REAL ENGINE RERUN (2026-09-17) - resolves the existing lever inputs
  // into the override shape the real hook needs, then calls
  // useBusinessOutcomePerSourceRevenue a SECOND time with those
  // overrides. This produces a genuinely modelled per_source, built by
  // rerunning the same real calculation chain every live page uses -
  // not a separate independent formula. Falls back to real data for
  // anything without an override (same guarantee the hook itself
  // provides). Not yet wired into any display - this proves the
  // mechanism works end-to-end against real data before deciding how
  // to show it.
  const lever_overrides_resolution = useMemo(
    () => resolveLeverOverrides(per_source, rate_target_by_group_id, materials_markup_percent),
    [per_source, rate_target_by_group_id, materials_markup_percent]
  );

  const modelled_per_source_raw = useBusinessOutcomePerSourceRevenue({
    overrides: lever_overrides_resolution.overrides,
  });
  const modelled_per_source = selectBusinessOutcomePerSourceRevenue(modelled_per_source_raw);

  return {
    ...legacy,
    live_headline,
    breakeven_summary,
    lever_rows,
    rate_target_by_group_id,
    updateLeverTargetRate,
    materials_lever_row,
    materials_markup_percent,
    updateMaterialsMarkupPercent,
    proportional_suggestions,
    applyProportionalSuggestions,
    // Added 2026-09-13 for the Baseline/Upside/Downside scenario
    // redesign - was computed internally but never exposed, needed so
    // useBusinessModellingScenario can build a real Baseline snapshot
    // without duplicating the expensive live-cascade calculation.
    per_source,
    // Added 2026-09-17 - the real engine rerun, fed the current lever
    // inputs via resolveLeverOverrides. unsupported_lever_group_ids
    // lists working units whose current target rate could not be
    // mapped unambiguously (mixed labour+asset, or multiple labour
    // types) - not silently ignored, surfaced so the UI can eventually
    // tell the user why.
    modelled_per_source,
    unsupported_lever_group_ids: lever_overrides_resolution.unsupported_group_ids,
  };
}




