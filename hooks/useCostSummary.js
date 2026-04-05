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

    const calculations = calculateCostSummary({
      labour_data,
    });

    const status = buildCostSummaryStatus({
      labour_data,
      calculations,
    });

    const card = buildCostSummaryCard({
      labour_data,
      calculations,
    });

    return { status, card };
  }, [inputs.labour]);
}