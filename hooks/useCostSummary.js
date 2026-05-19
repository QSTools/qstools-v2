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

    const labour_output_contract = inputs.labour?.output_contract ?? {};
    const asset_output_contract = inputs.assets?.output_contract ?? {};
    const general_overheads_output_contract =
      inputs.general_overheads?.output_contract ?? {};

    const asset_data = {
      total_asset_cost_annual:
        asset_output_contract.total_asset_cost_annual ?? 0,
      total_asset_interest_annual:
        asset_output_contract.total_asset_interest_annual ?? 0,
      asset_detail: {
        running_cost_annual:
          asset_output_contract.legacy_display?.running_cost_annual ??
          asset_output_contract.running_cost_annual ??
          0,
      },
    };

    const general_overhead_data = {
      total_general_overheads:
        general_overheads_output_contract.total_general_overheads ?? 0,
      overhead_detail: {
        category_totals: Array.isArray(
          general_overheads_output_contract.category_totals
        )
          ? general_overheads_output_contract.category_totals
          : [],
        overhead_rows: Array.isArray(
          general_overheads_output_contract.overhead_rows
        )
          ? general_overheads_output_contract.overhead_rows
          : [],
      },
    };

    const model_readiness_input = inputs.model_readiness ?? {};

    const model_readiness = {
      model_ready: model_readiness_input.model_ready === true,
      model_readiness_status:
        model_readiness_input.model_readiness_status ?? "blocked",
      blocking_modules: model_readiness_input.blocking_modules ?? [],
      warning_modules: model_readiness_input.warning_modules ?? [],
      blocking_checks: model_readiness_input.blocking_checks ?? [],
      warning_checks: model_readiness_input.warning_checks ?? [],
    };

    const calculations = calculateCostSummary({
      labour_data,
      asset_data,
      general_overhead_data,
    });

    const status = buildCostSummaryStatus({
      labour_data,
      asset_data,
      general_overhead_data,
      calculations,
      model_readiness,
    });

    const card = buildCostSummaryCard({
      labour_data,
      asset_data,
      general_overhead_data,
      calculations,
      model_readiness,
    });

    const output_contract = {
      total_people_cost_annual: calculations.total_people_cost_annual ?? 0,
      total_recovery_hours: calculations.total_recovery_hours ?? 0,
      total_productive_output: calculations.total_productive_output ?? 0,
      total_available_hours_before_productivity:
        labour_data.total_available_hours_before_productivity ?? 0,
      weighted_productivity_percent:
        labour_data.weighted_productivity_percent ?? 0,

      total_asset_cost_annual: calculations.total_asset_cost_annual ?? 0,
      total_asset_interest_annual:
        calculations.total_asset_interest_annual ?? 0,
      has_productive_asset_recovery_base:
        asset_output_contract.has_productive_asset_recovery_base === true,
      productive_asset_count:
        asset_output_contract.productive_asset_count ?? 0,
      support_asset_count:
        asset_output_contract.support_asset_count ?? 0,
      productive_asset_cost:
        asset_output_contract.productive_asset_cost ?? 0,
      support_asset_cost:
        asset_output_contract.support_asset_cost ?? 0,

      total_business_overheads: calculations.total_business_overheads ?? 0,
      total_business_cost_annual:
        calculations.total_business_cost_annual ?? 0,
      total_cost_burden: calculations.total_cost_burden ?? 0,

      required_revenue: calculations.required_revenue ?? 0,
      required_recovery_rate: calculations.required_recovery_rate ?? 0,

      model_ready: model_readiness.model_ready === true,
      model_readiness_status:
        model_readiness.model_readiness_status ?? "blocked",
      blocking_modules: model_readiness.blocking_modules ?? [],
      warning_modules: model_readiness.warning_modules ?? [],
      blocking_checks: model_readiness.blocking_checks ?? [],
      warning_checks: model_readiness.warning_checks ?? [],

      cost_burden_breakdown: {
        people: {
          total_people_cost_annual:
            calculations.total_people_cost_annual ?? 0,
          total_labour_cost_annual:
            labour_output_contract.total_labour_cost_annual ??
            calculations.total_people_cost_annual ??
            0,
          total_recovery_hours: calculations.total_recovery_hours ?? 0,
          total_productive_output:
            calculations.total_productive_output ?? 0,
          total_available_hours_before_productivity:
            labour_data.total_available_hours_before_productivity ?? 0,
          weighted_productivity_percent:
            labour_data.weighted_productivity_percent ?? 0,
          active_staff: Array.isArray(labour_output_contract.active_staff)
            ? labour_output_contract.active_staff
            : [],
          entitlement_totals:
            labour_output_contract.entitlement_totals ?? {},
          employer_contribution_totals:
            labour_output_contract.employer_contribution_totals ?? {},
        },

        assets: {
          total_asset_cost_annual:
            calculations.total_asset_cost_annual ?? 0,
          total_asset_interest_annual:
            calculations.total_asset_interest_annual ?? 0,
          finance_cost_annual:
            asset_output_contract.finance_cost_annual ?? 0,
          has_productive_asset_recovery_base:
            asset_output_contract.has_productive_asset_recovery_base === true,
          productive_asset_count:
            asset_output_contract.productive_asset_count ?? 0,
          support_asset_count:
            asset_output_contract.support_asset_count ?? 0,
          productive_asset_cost:
            asset_output_contract.productive_asset_cost ?? 0,
          support_asset_cost:
            asset_output_contract.support_asset_cost ?? 0,
          active_assets: Array.isArray(asset_output_contract.active_assets)
            ? asset_output_contract.active_assets
            : [],
          assets: Array.isArray(asset_output_contract.assets)
            ? asset_output_contract.assets
            : [],
        },

        business_overheads: {
          total_business_overheads:
            calculations.total_business_overheads ?? 0,
          total_general_overheads:
            general_overheads_output_contract.total_general_overheads ?? 0,
          category_totals: Array.isArray(
            general_overheads_output_contract.category_totals
          )
            ? general_overheads_output_contract.category_totals
            : [],
          overhead_rows: Array.isArray(
            general_overheads_output_contract.overhead_rows
          )
            ? general_overheads_output_contract.overhead_rows
            : [],
        },
      },
    };

    return {
      status,
      card,
      output_contract,
    };
  }, [
    inputs.labour,
    inputs.assets,
    inputs.general_overheads,
    inputs.model_readiness,
  ]);
}
