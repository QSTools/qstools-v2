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

    const calculations = calculateCostSummary({
      labour_data,
      employee_overhead_data,
      asset_data,
    });

    const status = buildCostSummaryStatus({
      labour_data,
      employee_overhead_data,
      asset_data,
      calculations,
    });

    const card = buildCostSummaryCard({
      labour_data,
      employee_overhead_data,
      asset_data,
      calculations,
    });

    return { status, card };
  }, [inputs.labour, inputs.employee_overheads, inputs.assets]);
}