"use client";

import { useMemo } from "react";

import useRevenueCogs from "@/hooks/useRevenueCogs";
import useCostSummary from "@/hooks/useCostSummary";
import useModelReadiness from "@/hooks/useModelReadiness";
import { calculateBusinessSummary } from "@/lib/calculations/businessSummaryCalculations";
import {
  buildBusinessSummaryCard,
  buildBusinessSummaryStatus,
} from "@/lib/selectors/businessSummarySelectors";

export default function useBusinessSummary() {
  const revenue_cogs = useRevenueCogs();
  const model_readiness = useModelReadiness();
  const cost_summary = useCostSummary({
    labour: model_readiness.modules.labour,
    assets: model_readiness.modules.assets,
    general_overheads: model_readiness.modules.generalOverheads,
    model_readiness: model_readiness.status,
  });

  const revenue_cogs_output_contract = revenue_cogs.output_contract ?? {};
  const cost_summary_output_contract = cost_summary.output_contract ?? {};

  return useMemo(() => {
    const calculations = calculateBusinessSummary({
      total_revenue: revenue_cogs_output_contract.total_revenue ?? 0,
      total_direct_costs:
        revenue_cogs_output_contract.total_direct_costs ?? 0,
      margin_pool: revenue_cogs_output_contract.margin_pool ?? 0,
      gross_margin_percent:
        revenue_cogs_output_contract.gross_margin_percent ?? 0,
      total_cost_burden:
        cost_summary_output_contract.total_cost_burden ?? 0,
      total_productive_output:
        cost_summary_output_contract.total_productive_output ?? 0,
      required_recovery_rate:
        cost_summary_output_contract.required_recovery_rate ?? 0,
    });

    const status = buildBusinessSummaryStatus(calculations);
    const card = buildBusinessSummaryCard(calculations);

    const output_contract = {
      business_summary_ready: status.business_summary_ready,
      total_revenue: calculations.total_revenue,
      total_direct_costs: calculations.total_direct_costs,
      margin_pool: calculations.margin_pool,
      gross_margin_percent: calculations.gross_margin_percent,
      total_cost_burden: calculations.total_cost_burden,
      net_position: calculations.net_position,
      total_productive_output: calculations.total_productive_output,
      required_recovery_rate: calculations.required_recovery_rate,
      current_margin_per_productive_hour:
        calculations.current_margin_per_hour,
      recovery_gap_per_hour: calculations.hourly_gap,
      current_margin_per_hour: calculations.current_margin_per_hour,
      hourly_gap: calculations.hourly_gap,
      business_summary_status: status.business_summary_status,
      business_summary_warnings: status.business_summary_warnings,
    };

    return {
      status,
      card,
      output_contract,
    };
  }, [revenue_cogs_output_contract, cost_summary_output_contract]);
}
