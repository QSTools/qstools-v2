"use client";

import { useMemo } from "react";
import {
  selectCostSummaryStatus,
  selectCostSummaryCard,
} from "@/lib/selectors/costSummarySelectors";

export function useCostSummary({
  labour_profiles = [],
  employee_overheads = [],
  assets = [],
  general_overheads = null,
  cost_allocation = null,
}) {
  const status = useMemo(() => {
    return selectCostSummaryStatus({
      labour_profiles,
      employee_overheads,
      assets,
      general_overheads,
      cost_allocation,
    });
  }, [
    labour_profiles,
    employee_overheads,
    assets,
    general_overheads,
    cost_allocation,
  ]);

  const card = useMemo(() => {
    return selectCostSummaryCard({
      labour_profiles,
      employee_overheads,
      assets,
      general_overheads,
      cost_allocation,
    });
  }, [
    labour_profiles,
    employee_overheads,
    assets,
    general_overheads,
    cost_allocation,
  ]);

  return {
    status,
    card,
  };
}

export default useCostSummary;