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

    // ✅ FIX: use output_contract directly
    const employee_overhead_data =
      inputs.employee_overheads?.output_contract ?? {
        per_staff: [],
        total_employee_overheads_annual: 0,
      };

    const calculations = calculateCostSummary({
      labour_data,
      employee_overhead_data,
    });

    const status = buildCostSummaryStatus({
      labour_data,
      employee_overhead_data,
      calculations,
    });

    const card = buildCostSummaryCard({
      labour_data,
      employee_overhead_data,
      calculations,
    });

    return { status, card };
  }, [inputs.labour, inputs.employee_overheads]);
}