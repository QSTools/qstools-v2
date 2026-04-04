import {
  selectCostSummaryLabour,
  buildCostSummaryStatus,
  buildCostSummaryCard,
} from "@/lib/selectors/costSummarySelectors";

import { calculateCostSummary } from "@/lib/calculations/costSummaryCalculations";

export default function useCostSummary(inputs = {}) {
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

  return {
    status,
    card,
    calculations,
  };
}