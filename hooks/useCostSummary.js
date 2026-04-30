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

    const asset_data =
      inputs.assets?.output_contract ?? {
        total_asset_cost_annual: 0,
        active_assets: [],
      };

    const general_overhead_data =
      inputs.general_overheads?.output_contract ?? {
        total_general_overheads: 0,
        overhead_rows: [],
      };

    const model_readiness = inputs.model_readiness ?? {};

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
      total_gross_wages_annual: calculations.total_gross_wages_annual ?? 0,
      total_entitlements_annual: calculations.total_entitlements_annual ?? 0,
      total_employer_kiwisaver_annual:
        calculations.total_employer_kiwisaver_annual ?? 0,
      total_esct_annual: calculations.total_esct_annual ?? 0,
      total_acc_levy_annual: calculations.total_acc_levy_annual ?? 0,
      total_employer_contribution_annual:
        calculations.total_employer_contribution_annual ?? 0,
      total_people_cost_annual: calculations.total_people_cost_annual ?? 0,
      total_productive_output: calculations.total_productive_output ?? 0,
      total_asset_cost_annual: calculations.total_asset_cost_annual ?? 0,
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
