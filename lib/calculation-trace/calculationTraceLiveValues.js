"use client";

// Mirra v6.0 - Calculation Trace - Live Values
// Mirrors exactly the composition useBusinessSummary.js does internally
// (useModelReadiness -> useRevenueCogs / useCostSummary -> calculateBusinessSummary),
// so the trace page can never disagree with the real Business Summary page.
// This is Option A from the v6.0 kickoff session: fully self-contained, no
// change to any shipped hook. It does its own separate mount of the module
// chain - the same double-mount pattern useBusinessSummary itself already
// uses for useProfitAndLoss, so this is a proven-tolerated pattern, not a
// new risk class.

import useModelReadiness from "@/hooks/useModelReadiness";
import useRevenueCogs from "@/hooks/useRevenueCogs";
import useCostSummary from "@/hooks/useCostSummary";
import useCostAllocation from "@/hooks/useCostAllocation";
import { calculateBusinessSummary } from "@/lib/calculations/businessSummaryCalculations";
import {
  build_labour_source_options,
  extract_labour_output,
} from "@/lib/selectors/rate-builder/rateBuilderLabourSourceSelectors";
import { build_cost_allocation_output_contract } from "@/lib/selectors/rate-builder/rateBuilderLabourModelSelectors";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import useAssets from "@/hooks/useAssets";
import { calculateEbitByUnit } from "@/lib/calculations/businessOutcomeEbitCalculations";

export function useCalculationTraceLiveValues() {
  const model_readiness = useModelReadiness();
  const revenue_cogs = useRevenueCogs();
  const cost_allocation_result = useCostAllocation();

  const cost_summary = useCostSummary({
    labour: model_readiness.modules.labour,
    assets: model_readiness.modules.assets,
    general_overheads: model_readiness.modules.generalOverheads,
    opening_hours: model_readiness.modules.openingHours,
    model_readiness: model_readiness.status,
  });

  const revenue_cogs_output_contract = revenue_cogs.output_contract ?? {};
  const cost_summary_output_contract = cost_summary.output_contract ?? {};

  const business_summary_output_contract = calculateBusinessSummary({
    total_revenue: revenue_cogs_output_contract.total_revenue ?? 0,
    total_direct_costs: revenue_cogs_output_contract.total_direct_costs ?? 0,
    margin_pool: revenue_cogs_output_contract.margin_pool ?? 0,
    gross_margin_percent: revenue_cogs_output_contract.gross_margin_percent ?? 0,
    total_cost_burden: cost_summary_output_contract.total_cost_burden ?? 0,
    total_people_cost_annual: cost_summary_output_contract.total_people_cost_annual ?? 0,
    total_asset_cost_annual: cost_summary_output_contract.total_asset_cost_annual ?? 0,
    total_business_overheads: cost_summary_output_contract.total_business_overheads ?? 0,
    total_recovery_hours: cost_summary_output_contract.total_recovery_hours ?? 0,
    total_productive_output: cost_summary_output_contract.total_productive_output ?? 0,
    units_sold_annual: revenue_cogs_output_contract.units_sold_annual ?? 0,
    business_type: revenue_cogs_output_contract.business_type ?? "labour_based",
    required_recovery_rate: cost_summary_output_contract.required_recovery_rate ?? 0,
  });

  // Rate Builder slice (session 11): mirrors useRateBuilderLabourRates.js's
  // own composition (extract_labour_output + build_cost_allocation_output_contract
  // -> build_labour_source_options), reusing the same model_readiness.modules.labour
  // and cost_allocation_result mounts above rather than a second hook mount.
  const rate_builder_labour_output = extract_labour_output(model_readiness.modules.labour);
  const rate_builder_cost_allocation_output_contract = build_cost_allocation_output_contract(
    cost_allocation_result
  );
  const rate_builder_labour_source_options = build_labour_source_options(
    rate_builder_labour_output,
    rate_builder_cost_allocation_output_contract
  );

  // Business Outcome slice (session 12): mirrors useBusinessModelling.js's
  // own naive `per_source` call (useBusinessOutcomePerSourceRevenue with NO
  // overrides) - a second, independent mount of this hook, same proven-
  // tolerated double-mount pattern already used for Business Summary and
  // Rate Builder above. Deliberately NOT modelled_per_source / real_capacity
  // / View B - see pilot-map/businessOutcomeTraceNodes.js header.
  const business_outcome_per_source_raw = useBusinessOutcomePerSourceRevenue();
  const business_outcome_per_source = selectBusinessOutcomePerSourceRevenue(business_outcome_per_source_raw);

  // EBIT / EBITDA slice (2026-10-26): the SAME calculation and inputs the
  // Business Outcome page gives its EBIT summary card (View A, every active
  // asset), so the trace and the screen cannot disagree.
  const { active_assets: ebit_all_assets } = useAssets();
  // F-11: the General Overheads instance the EBIT slice reads (the Business Modelling slice that shared it was retired in R3 batch 6).
  const modelling_general_overheads = useGeneralOverheads();
  const business_outcome_ebit = calculateEbitByUnit({
    real_capacity: business_outcome_per_source?.real_capacity,
    materials: business_outcome_per_source?.materials,
    unassigned: business_outcome_per_source?.unassigned,
    all_assets: ebit_all_assets,
    overhead_interest_annual: Number(modelling_general_overheads?.output_contract?.interest_in_overheads_annual) || 0,
  });

  return {
    labour: model_readiness.modules.labour?.output_contract ?? {},
    assets: model_readiness.modules.assets?.output_contract ?? {},
    general_overheads: model_readiness.modules.generalOverheads?.output_contract ?? {},
    revenue_cogs: revenue_cogs_output_contract,
    cost_summary: cost_summary_output_contract,
    cost_allocation: cost_allocation_result.output_contract ?? {},
    business_summary: business_summary_output_contract,
    rate_builder: {
      labour_source_options: rate_builder_labour_source_options,
    },
    business_outcome: business_outcome_per_source,
    business_outcome_ebit,
    is_hydrated: model_readiness.modules.labour?.status?.is_hydrated !== false,
  };
}