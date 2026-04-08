"use client";

import { useMemo } from "react";
import { calculateRecoverySummary } from "@/lib/calculations/recoverySummaryCalculations";
import {
  buildRecoverySummaryCard,
  buildRecoverySummaryStatus,
} from "@/lib/selectors/recoverySummarySelectors";

export default function useRecoverySummary(inputs = {}) {
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

  const recovery_inputs = useMemo(() => {
    const labour = inputs.labour ?? {};
    const assets = inputs.assets ?? {};

    const productive_labour_cost_rate = Number(
      labour.output_contract?.productive_labour_cost_rate ?? 0
    );

    const productive_assets = Array.isArray(assets.output_contract?.assets)
      ? assets.output_contract.assets.filter(
          (asset) => asset.asset_type === "productive"
        )
      : [];

    const asset_base = productive_assets.reduce(
      (sum, asset) => sum + Number(asset.true_asset_cost_per_hour ?? 0),
      0
    );

    return {
      active_recovery_model:
        asset_base > 0 && productive_labour_cost_rate > 0
          ? "hybrid"
          : asset_base > 0
          ? "asset_driven"
          : "labour_only",

      labour_base: productive_labour_cost_rate,
      asset_base,
    };
  }, [inputs.labour, inputs.assets]);

  const calculated = useMemo(() => {
    return calculateRecoverySummary({
      ...cost_summary_outputs,
      ...recovery_inputs,
    });
  }, [cost_summary_outputs, recovery_inputs]);

  const status = useMemo(() => {
    return buildRecoverySummaryStatus({
      calculated,
    });
  }, [calculated]);

  const card = useMemo(() => {
    return buildRecoverySummaryCard({
      calculated,
    });
  }, [calculated]);

  const output_contract = useMemo(() => {
    return {
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