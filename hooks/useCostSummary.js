"use client";

import { useMemo } from "react";

import { calculateCostSummary } from "@/lib/calculations/costSummaryCalculations";
import { calculateRecoveryAnalysis } from "@/lib/calculations/recoveryAnalysisCalculations";
import {
  selectCostSummaryLabour,
  buildCostSummaryStatus,
  buildCostSummaryCard,
} from "@/lib/selectors/costSummarySelectors";
import { buildRecoveryAnalysisCard } from "@/lib/selectors/recoveryAnalysisSelectors";

export default function useCostSummary(inputs = {}) {
  return useMemo(() => {
    const labour_data = selectCostSummaryLabour(inputs.labour);

    const employee_overhead_data =
      inputs.employee_overheads?.output_contract ?? {
        per_staff: [],
        total_employee_overheads_annual: 0,
      };

    const asset_data =
      inputs.assets?.output_contract ?? {
        finance_cost_annual: 0,
        running_cost_annual: 0,
        total_asset_cost_annual: 0,
      };

    const general_overhead_data =
      inputs.general_overheads?.output_contract ?? {
        total_general_overheads: 0,
        overhead_rows: [],
      };

    const calculations = calculateCostSummary({
      labour_data,
      employee_overhead_data,
      asset_data,
      general_overhead_data,
    });

    const recovery_analysis = calculateRecoveryAnalysis({
      labour_data,
      cost_summary_calculations: calculations,
    });

    const status = buildCostSummaryStatus({
      labour_data,
      employee_overhead_data,
      asset_data,
      general_overhead_data,
      calculations,
    });

    const card = buildCostSummaryCard({
      labour_data,
      employee_overhead_data,
      asset_data,
      general_overhead_data,
      calculations,
    });

    const recovery_analysis_card = buildRecoveryAnalysisCard({
      recovery_analysis,
    });

    const output_contract = {
      total_gross_wages_annual: calculations.total_gross_wages_annual ?? 0,
      total_entitlements_annual: calculations.total_entitlements_annual ?? 0,
      total_employer_kiwisaver_annual:
        calculations.total_employer_kiwisaver_annual ?? 0,
      total_esct_annual: calculations.total_esct_annual ?? 0,
      total_employee_overheads_annual:
        calculations.total_employee_overheads_annual ?? 0,
      total_people_cost_annual: calculations.total_people_cost_annual ?? 0,
      total_productive_output: calculations.total_productive_output ?? 0,
      total_asset_cost_annual: calculations.total_asset_cost_annual ?? 0,
      total_business_overheads: calculations.total_business_overheads ?? 0,
      total_business_cost_annual: calculations.total_business_cost_annual ?? 0,
      total_cost_burden: calculations.total_cost_burden ?? 0,
      required_revenue: calculations.required_revenue ?? 0,
      required_recovery_rate: calculations.required_recovery_rate ?? 0,
    };

    return {
      status,
      card,
      recovery_analysis: recovery_analysis_card,
      output_contract,
    };
  }, [
    inputs.labour,
    inputs.employee_overheads,
    inputs.assets,
    inputs.general_overheads,
  ]);
}