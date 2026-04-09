"use client";

import { useMemo } from "react";
import useCostSummary from "@/hooks/useCostSummary";
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
  const cost_summary = useCostSummary();

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