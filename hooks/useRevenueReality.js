"use client";

import { useMemo } from "react";

import useBusinessSetup from "@/hooks/useBusinessSetup";
import useBusinessSummary from "@/hooks/useBusinessSummary";
import useRevenueCogs from "@/hooks/useRevenueCogs";
import useLabour from "@/hooks/useLabour";
import { calculateRevenueReality } from "@/lib/calculations/revenueRealityCalculations";
import {
  buildRevenueRealityCard,
  buildRevenueRealityStatus,
} from "@/lib/selectors/revenueRealitySelectors";

export default function useRevenueReality() {
  const business_setup = useBusinessSetup();
  const revenue_cogs = useRevenueCogs();
  const business_summary = useBusinessSummary();
  const labour = useLabour();

  const business_setup_output_contract = business_setup.output_contract ?? {};
  const revenue_cogs_output_contract = revenue_cogs.output_contract ?? {};
  const business_summary_output_contract =
    business_summary.output_contract ?? {};
  const labour_output_contract = labour.output_contract ?? {};

  return useMemo(() => {
    const total_labour_cost_annual =
      business_summary_output_contract.total_people_cost_annual ??
      labour_output_contract.total_labour_cost_annual ??
      0;

    const business_type =
      business_setup_output_contract.business_type ??
      business_summary_output_contract.business_type ??
      revenue_cogs_output_contract.business_type ??
      "labour_based";

    const calculations = calculateRevenueReality({
      total_revenue: revenue_cogs_output_contract.total_revenue ?? 0,
      total_direct_costs:
        revenue_cogs_output_contract.total_direct_costs ?? 0,
      margin_pool: revenue_cogs_output_contract.margin_pool ?? 0,
      gross_margin_percent:
        revenue_cogs_output_contract.gross_margin_percent ?? 0,
      total_labour_cost_annual,
      business_type,
      is_product_based:
        business_setup_output_contract.is_product_based ??
        business_summary_output_contract.is_product_based ??
        false,
      is_labour_based:
        business_setup_output_contract.is_labour_based ??
        business_summary_output_contract.is_labour_based ??
        true,
    });

    const status = buildRevenueRealityStatus(calculations);
    const card = buildRevenueRealityCard(calculations);

    return {
      status,
      card,
      output_contract: {
        total_revenue: calculations.total_revenue,
        total_direct_costs: calculations.total_direct_costs,
        material_margin: calculations.material_margin,
        material_margin_percent: calculations.material_margin_percent,
        total_labour_cost_annual:
          calculations.total_labour_cost_annual,
        stress_tested_margin_after_labour:
          calculations.stress_tested_margin_after_labour,
        stress_tested_margin_percent:
          calculations.stress_tested_margin_percent,
        labour_consumption_percent:
          calculations.labour_consumption_percent,
        labour_shortfall_against_margin:
          calculations.labour_shortfall_against_margin,
        revenue_reality_ready: calculations.revenue_reality_ready,
        revenue_reality_warnings:
          calculations.revenue_reality_warnings,
        business_type: calculations.business_type,
        is_hours_based: calculations.is_hours_based,
        is_product_based: calculations.is_product_based,
        revenue_reality_status:
          calculations.revenue_reality_status,
      },
    };
  }, [
    business_setup_output_contract,
    revenue_cogs_output_contract,
    business_summary_output_contract,
    labour_output_contract,
  ]);
}
