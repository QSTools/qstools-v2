"use client";

import { useMemo } from "react";
import {
  DEFAULT_RECOVERY_SUMMARY_STATE,
  useRecoverySummaryStorage,
} from "@/lib/storage/recoverySummaryStorage";
import { calculateRecoverySummary } from "@/lib/calculations/recoverySummaryCalculations";
import {
  buildRecoverySummaryCard,
  buildRecoverySummaryStatus,
} from "@/lib/selectors/recoverySummarySelectors";

export default function useRecoverySummary(inputs = {}) {
  const {
    recovery_state,
    set_recovery_state,
    update_recovery_field,
    reset_recovery_state,
  } = useRecoverySummaryStorage();

  const cost_summary_outputs = useMemo(() => {
    const cost_summary = inputs.cost_summary ?? {};

    return {
      total_cost_burden: Number(cost_summary.total_cost_burden ?? 0),
      required_revenue: Number(cost_summary.required_revenue ?? 0),
      required_recovery_rate: Number(cost_summary.required_recovery_rate ?? 0),
      total_productive_output: Number(cost_summary.total_productive_output ?? 0),
      total_people_cost_annual: Number(cost_summary.total_people_cost_annual ?? 0),
      total_asset_cost_annual: Number(cost_summary.total_asset_cost_annual ?? 0),
      total_business_overheads: Number(cost_summary.total_business_overheads ?? 0),
    };
  }, [inputs.cost_summary]);

  const calculated = useMemo(() => {
    return calculateRecoverySummary({
      ...cost_summary_outputs,
      ...recovery_state,
    });
  }, [cost_summary_outputs, recovery_state]);

  const status = useMemo(() => {
    return buildRecoverySummaryStatus({
      calculated,
      recovery_state,
    });
  }, [calculated, recovery_state]);

  const card = useMemo(() => {
    return buildRecoverySummaryCard({
      calculated,
      recovery_state,
      update_recovery_field,
      reset_recovery_state,
      default_recovery_state: DEFAULT_RECOVERY_SUMMARY_STATE,
      set_recovery_state,
    });
  }, [
    calculated,
    recovery_state,
    update_recovery_field,
    reset_recovery_state,
    set_recovery_state,
  ]);

  const output_contract = useMemo(() => {
    return {
      active_recovery_model: calculated.active_recovery_model,
      labour_share_percent: calculated.labour_share_percent,
      asset_share_percent: calculated.asset_share_percent,
      overhead_share_percent: calculated.overhead_share_percent,
      labour_recovery_cost: calculated.labour_recovery_cost,
      asset_recovery_cost: calculated.asset_recovery_cost,
      overhead_absorbed_cost: calculated.overhead_absorbed_cost,
      required_labour_recovery_rate: calculated.required_labour_recovery_rate,
      required_asset_recovery: calculated.required_asset_recovery,
      total_cost_burden: calculated.total_cost_burden,
      total_productive_output: calculated.total_productive_output,
      warnings: calculated.warnings,
      share_not_balanced: calculated.share_not_balanced,
      no_productive_output: calculated.no_productive_output,
      asset_recovery_without_assets: calculated.asset_recovery_without_assets,
      labour_recovery_without_labour: calculated.labour_recovery_without_labour,
    };
  }, [calculated]);

  return {
    status,
    card,
    output_contract,
  };
}