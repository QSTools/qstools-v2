"use client";

import { useMemo } from "react";
import useBusinessSummary from "@/hooks/useBusinessSummary";
import { calculateRecoverySummary } from "@/lib/calculations/recoverySummaryCalculations";
import {
  buildRecoverySummaryCard,
  buildRecoverySummaryStatus,
} from "@/lib/selectors/recoverySummarySelectors";
import { useRecoverySummaryStorage } from "@/lib/storage/recoverySummaryStorage";

export default function useRecoverySummary(inputs = {}) {
  const business_summary = useBusinessSummary();
  const {
    recovery_state,
    update_recovery_field,
    reset_recovery_state,
  } = useRecoverySummaryStorage();

  const business_summary_outputs =
    inputs.business_summary ??
    business_summary.output_contract ??
    {};

  const calculated = useMemo(() => {
    return calculateRecoverySummary({
      ...business_summary_outputs,
      recovery_model: recovery_state.recovery_model,
      labour_share_percent: recovery_state.labour_share_percent,
      asset_share_percent: recovery_state.asset_share_percent,
      overhead_share_percent: recovery_state.overhead_share_percent,
    });
  }, [business_summary_outputs, recovery_state]);

  const status = useMemo(() => {
    return buildRecoverySummaryStatus({
      calculated,
    });
  }, [calculated]);

  const card = useMemo(() => {
    return buildRecoverySummaryCard({
      calculated,
      recovery_state,
      update_recovery_field,
      reset_recovery_state,
    });
  }, [calculated, recovery_state, update_recovery_field, reset_recovery_state]);

  const output_contract = useMemo(() => {
    return {
      recovery_summary_ready: status.recovery_summary_ready,
      recovery_summary_status: status.recovery_summary_status,
      recovery_summary_warnings: status.recovery_summary_warnings,

      business_type: calculated.business_type,
      activity_driver_type: calculated.activity_driver_type,
      activity_driver_label: calculated.activity_driver_label,
      activity_driver_value: calculated.activity_driver_value,
      required_recovery_per_driver: calculated.required_recovery_per_driver,
      current_margin_per_driver: calculated.current_margin_per_driver,
      recovery_gap_per_driver: calculated.recovery_gap_per_driver,
      recovery_plan_target_per_driver:
        calculated.recovery_plan_target_per_driver,
      recovery_plan_split: calculated.recovery_plan_split,
      component_required_recovery: calculated.component_required_recovery,
      recovery_model: calculated.recovery_model,
      active_recovery_model: calculated.active_recovery_model,
      labour_share_percent: calculated.labour_share_percent,
      asset_share_percent: calculated.asset_share_percent,
      overhead_share_percent: calculated.overhead_share_percent,
      labour_recovery_cost: calculated.labour_recovery_cost,
      asset_recovery_cost: calculated.asset_recovery_cost,
      overhead_absorbed_cost: calculated.overhead_absorbed_cost,
      required_revenue: calculated.required_revenue,
      required_recovery_rate: calculated.required_recovery_rate,
      required_labour_recovery_rate: calculated.required_labour_recovery_rate,
      required_asset_recovery: calculated.required_asset_recovery,
      margin_pool: calculated.margin_pool,
      total_cost_burden: calculated.total_cost_burden,
      net_position: calculated.net_position,
      model_trust_state: calculated.model_trust_state,

      // Backwards-compatible outputs still consumed by existing downstream code.
      total_productive_output: calculated.total_productive_output,
      warnings: calculated.warnings,
      share_not_balanced: calculated.share_not_balanced,
      no_productive_output: calculated.no_productive_output,
      asset_recovery_without_assets: calculated.asset_recovery_without_assets,
      labour_recovery_without_labour: calculated.labour_recovery_without_labour,
    };
  }, [calculated, status]);

  return {
    status,
    card,
    output_contract,
  };
}
