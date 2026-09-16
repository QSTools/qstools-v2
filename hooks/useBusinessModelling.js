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
  };
}




