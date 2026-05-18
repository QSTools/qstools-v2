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

      total_recovery_hours:
        cost_summary_output_contract.total_recovery_hours ?? 0,

      total_productive_output:
        cost_summary_output_contract.total_productive_output ?? 0,

      units_sold_annual:
        revenue_cogs_output_contract.units_sold_annual ?? 0,

      business_type:
        revenue_cogs_output_contract.business_type ?? "labour_based",

      required_recovery_rate:
        cost_summary_output_contract.required_recovery_rate ?? 0,
    });

    const model_trust_state =
      cost_summary_output_contract.model_readiness_status ??
      (cost_summary_output_contract.model_ready === true
        ? "ready"
        : "blocked");

    const status = buildBusinessSummaryStatus({
      ...calculations,
      model_trust_state,
      revenue_cogs_ready:
        revenue_cogs_output_contract.revenue_cogs_ready === true,
      cost_summary_ready: cost_summary_output_contract.model_ready === true,
    });

    const display_details = {
      direct_cost_category_totals:
        revenue_cogs_output_contract.direct_cost_category_totals ?? [],

      total_people_cost_annual:
        cost_summary_output_contract.total_people_cost_annual ?? 0,

      total_asset_cost_annual:
        cost_summary_output_contract.total_asset_cost_annual ?? 0,

      total_business_overheads:
        cost_summary_output_contract.total_business_overheads ?? 0,

      cost_burden_breakdown:
        cost_summary_output_contract.cost_burden_breakdown ?? {
          people: {},
          assets: {},
          business_overheads: {},
        },
    };

    const card = buildBusinessSummaryCard({
      ...calculations,
      ...display_details,
    });

    const output_contract = {
      business_summary_ready: status.business_summary_ready,

      business_type: calculations.business_type,
      activity_driver_type: calculations.activity_driver_type,
      activity_driver_label: calculations.activity_driver_label,
      activity_driver_value: calculations.activity_driver_value,

      required_recovery_per_driver:
        calculations.required_recovery_per_driver,

      required_recovery_label: calculations.required_recovery_label,
      required_recovery_unit_label:
        calculations.required_recovery_unit_label,

      current_margin_per_driver: calculations.current_margin_per_driver,
      current_margin_label: calculations.current_margin_label,

      recovery_gap_per_driver: calculations.recovery_gap_per_driver,
      recovery_gap_label: calculations.recovery_gap_label,

      total_revenue: calculations.total_revenue,
      total_direct_costs: calculations.total_direct_costs,

      direct_cost_category_totals:
        display_details.direct_cost_category_totals,

      margin_pool: calculations.margin_pool,
      gross_margin_percent: calculations.gross_margin_percent,

      total_cost_burden: calculations.total_cost_burden,

      total_people_cost_annual:
        display_details.total_people_cost_annual,

      total_asset_cost_annual:
        display_details.total_asset_cost_annual,

      total_business_overheads:
        display_details.total_business_overheads,

      cost_burden_breakdown: display_details.cost_burden_breakdown,

      net_position: calculations.net_position,

      total_recovery_hours: calculations.total_recovery_hours,
      recovery_hours_used: calculations.recovery_hours_used,
      total_productive_output: calculations.total_productive_output,
      units_sold_annual: calculations.units_sold_annual,

      weighted_productivity_percent:
        cost_summary_output_contract.weighted_productivity_percent ?? 0,

      total_available_hours_before_productivity:
        cost_summary_output_contract.total_available_hours_before_productivity ??
        0,

      required_recovery_rate: calculations.required_recovery_rate,
      actual_recovery_rate: calculations.actual_recovery_rate,

      profit_or_deficit_per_recovery_hour:
        calculations.profit_or_deficit_per_recovery_hour,

      current_margin_per_productive_hour:
        calculations.current_margin_per_hour,

      recovery_gap_per_hour: calculations.hourly_gap,

      current_margin_per_hour: calculations.current_margin_per_hour,
      hourly_gap: calculations.hourly_gap,

      business_summary_status: status.business_summary_status,
      business_summary_warnings: status.business_summary_warnings,
      model_trust_state,

      revenue_cogs_ready:
        revenue_cogs_output_contract.revenue_cogs_ready === true,

      cost_summary_ready: cost_summary_output_contract.model_ready === true,
    };

    return {
      status,
      card,
      output_contract,
    };
  }, [revenue_cogs_output_contract, cost_summary_output_contract]);
}