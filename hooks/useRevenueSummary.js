"use client";

import { useMemo } from "react";
import useCostSummary from "@/hooks/useCostSummary";
import useModelReadiness from "@/hooks/useModelReadiness";
import {
  DEFAULT_REVENUE_SUMMARY_STATE,
  useRevenueSummaryStorage,
} from "@/lib/storage/revenueSummaryStorage";
import { calculateRevenueSummary } from "@/lib/calculations/revenueSummaryCalculations";
import {
  buildRevenueSummaryStatus,
  buildRevenueSummaryCard,
  buildRevenueSummarySummary,
} from "@/lib/selectors/revenueSummarySelectors";

export default function useRevenueSummary() {
  // BUGFIX (2026-08-05): useCostSummary() was previously called with no
  // arguments, so its internal selectors received undefined for labour,
  // assets, general_overheads, opening_hours, and model_readiness, and
  // produced a zeroed-out total_cost_burden. That zero fed directly into
  // required_revenue, revenue_gap, profit_gap, actual_profit_model, and
  // labour_variance below (see calculateRevenueSummary), making Revenue
  // Summary's own displayed profit figures wrong. Wired here the same
  // way useBusinessSummary.js already correctly wires it, via
  // useModelReadiness. Found and confirmed live during the Business
  // Outcome dual-view rebuild (Stage 2), 2026-08-05.
  const model_readiness = useModelReadiness();

  const cost_summary = useCostSummary({
    labour: model_readiness.modules.labour,
    assets: model_readiness.modules.assets,
    general_overheads: model_readiness.modules.generalOverheads,
    opening_hours: model_readiness.modules.openingHours,
    model_readiness: model_readiness.status,
  });

  const {
    revenue_summary_state,
    set_revenue_summary_state,
    update_revenue_summary_field,
    reset_revenue_summary_state,
  } = useRevenueSummaryStorage();

  const safe_state = revenue_summary_state ?? DEFAULT_REVENUE_SUMMARY_STATE;
  const cost_summary_outputs =
    cost_summary?.output_contract ?? cost_summary?.outputs ?? {};

  const calculated = useMemo(() => {
    return calculateRevenueSummary({
      revenue_summary_state: safe_state,
      cost_summary: cost_summary_outputs,
    });
  }, [safe_state, cost_summary_outputs]);

  const status = useMemo(() => {
    return buildRevenueSummaryStatus({
      revenue_summary_state: safe_state,
      calculated,
    });
  }, [safe_state, calculated]);

  const card = useMemo(() => {
    return buildRevenueSummaryCard({
      revenue_summary_state: safe_state,
      calculated,
      update_revenue_summary_field,
      reset_revenue_summary_state,
      set_revenue_summary_state,
    });
  }, [
    safe_state,
    calculated,
    update_revenue_summary_field,
    reset_revenue_summary_state,
    set_revenue_summary_state,
  ]);

  const summary = useMemo(() => {
    return buildRevenueSummarySummary({ calculated });
  }, [calculated]);

  return {
    state: safe_state,
    calculated,
    status,
    card,
    summary,
    output_contract: calculated,
  };
}
