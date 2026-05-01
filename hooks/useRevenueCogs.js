"use client";

import { useMemo } from "react";

import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import { calculateRevenueCogs } from "@/lib/calculations/revenueCogsCalculations";
import {
  buildRevenueCogsCard,
  buildRevenueCogsStatus,
} from "@/lib/selectors/revenueCogsSelectors";

export default function useRevenueCogs() {
  const profit_and_loss = useProfitAndLoss();
  const pnl_output_contract = profit_and_loss.output_contract ?? {};

  return useMemo(() => {
    const calculations = calculateRevenueCogs({
      total_revenue: pnl_output_contract.total_revenue ?? 0,
      total_direct_costs: pnl_output_contract.total_direct_costs ?? 0,
      revenue_lines: pnl_output_contract.revenue_lines ?? [],
      direct_cost_category_totals:
        pnl_output_contract.direct_cost_category_totals ?? [],
    });

    const status = buildRevenueCogsStatus(calculations);
    const card = buildRevenueCogsCard(calculations);

    const output_contract = {
      total_revenue: calculations.total_revenue,
      total_direct_costs: calculations.total_direct_costs,
      margin_pool: calculations.margin_pool,
      gross_margin_percent: calculations.gross_margin_percent,
      revenue_cogs_ready: status.revenue_cogs_ready,
      revenue_cogs_warnings: status.revenue_cogs_warnings,
      direct_cost_category_totals: calculations.direct_cost_category_totals,
    };

    return {
      status,
      card,
      output_contract,
    };
  }, [pnl_output_contract]);
}
