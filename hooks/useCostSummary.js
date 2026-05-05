"use client";

import { useMemo } from "react";

import { calculateCostSummary } from "@/lib/calculations/costSummaryCalculations";
import {
  selectCostSummaryLabour,
  buildCostSummaryStatus,
  buildCostSummaryCard,
} from "@/lib/selectors/costSummarySelectors";

export default function useCostSummary(inputs = {}) {
  return useMemo(() => {
    const labour_data = selectCostSummaryLabour(inputs.labour);

    const asset_output_contract = inputs.assets?.output_contract ?? {};
    const asset_data = {
      total_asset_cost_annual:
        asset_output_contract.total_asset_cost_annual ?? 0,
      total_asset_interest_annual:
        asset_output_contract.total_asset_interest_annual ?? 0,
    };

    const general_overheads_output_contract =
      inputs.general_overheads?.output_contract ?? {};
    const general_overhead_data = {
      total_general_overheads:
        general_overheads_output_contract.total_general_overheads ?? 0,
    };

    const model_readiness_input = inputs.model_readiness ?? {};
    const model_readiness = {
      model_ready: model_readiness_input.model_ready === true,
      model_readiness_status:
        model_readiness_input.model_readiness_status ?? "blocked",
      blocking_modules: model_readiness_input.blocking_modules ?? [],
      warning_modules: model_readiness_input.warning_modules ?? [],
      blocking_checks: model_readiness_input.blocking_checks ?? [],
      warning_checks: model_readiness_input.warning_checks ?? [],
    };

    const calculations = calculateCostSummary({
      labour_data,
      asset_data,
      general_overhead_data,
    });

    const status = buildCostSummaryStatus({
      labour_data,
      asset_data,
      general_overhead_data,
      calculations,
      model_readiness,
    });

    const card = buildCostSummaryCard({
      labour_data,
      asset_data,
      general_overhead_data,
      calculations,
      model_readiness,
    });

    const output_contract = {
      total_people_cost_annual: calculations.total_people_cost_annual ?? 0,
      total_productive_output: calculations.total_productive_output ?? 0,
      total_available_hours_before_productivity: labour_data.total_available_hours_before_productivity ?? 0,
      weighted_productivity_percent: labour_data.weighted_productivity_percent ?? 0,
      total_asset_cost_annual: calculations.total_asset_cost_annual ?? 0,
      total_asset_interest_annual:
        calculations.total_asset_interest_annual ?? 0,
      total_business_overheads: calculations.total_business_overheads ?? 0,
      total_business_cost_annual: calculations.total_business_cost_annual ?? 0,
      total_cost_burden: calculations.total_cost_burden ?? 0,
      required_revenue: calculations.required_revenue ?? 0,
      required_recovery_rate: calculations.required_recovery_rate ?? 0,
      model_ready: model_readiness.model_ready === true,
      model_readiness_status: model_readiness.model_readiness_status ?? "blocked",
      blocking_modules: model_readiness.blocking_modules ?? [],
      warning_modules: model_readiness.warning_modules ?? [],
      blocking_checks: model_readiness.blocking_checks ?? [],
      warning_checks: model_readiness.warning_checks ?? [],
    };

    return {
      status,
      card,
      output_contract,
    };
  }, [
    inputs.labour,
    inputs.assets,
    inputs.general_overheads,
    inputs.model_readiness,
  ]);
}
