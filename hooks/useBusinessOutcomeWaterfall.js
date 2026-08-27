"use client";

import { useEffect, useMemo, useState } from "react";

import useBusinessSummary from "@/hooks/useBusinessSummary";
import useLabour from "@/hooks/useLabour";
import useModelReadiness from "@/hooks/useModelReadiness";
import useCostAllocation from "@/hooks/useCostAllocation";
import { useRateBuilderLabourRates } from "@/hooks/rate-builder/useRateBuilderLabourRates";
import { loadRateBuilderCalculators } from "@/lib/storage/rateBuilderStorage";
import { calculateBusinessOutcome } from "@/lib/calculations/businessOutcomeCalculations";

// Business Outcome net-profit waterfall (S23), sourced entirely from
// v5.0-approved and S24-reactivated inputs - Business Summary, Cost
// Summary (via Business Summary), Labour, Assets (via Model Readiness),
// Cost Allocation, and Rate Builder. Deliberately does NOT use Recovery
// Summary - see S25_BUSINESS_OUTCOME_WATERFALL_SOURCE_CONFIRMATION_v5_1
// for the field-by-field trace confirming every input here has a real,
// non-legacy source. Reuses the existing calculateBusinessOutcome() and
// calculateOperatingGroupSplit() calculation logic as-is (pure functions,
// confirmed clean of Recovery Summary) - only the INPUTS differ from the
// legacy hooks/useBusinessOutcome.js, not the math.
//
// Deliberately omits the legacy "recovery pressure" table (labourRecoveryCost,
// assetRecoveryCost, overheadAbsorbedCost, staffCoveragePercent,
// assetCoveragePercent) - those depend on Recovery Summary's user-selected
// recovery strategy concept, which is not reactivated and not wanted here.

export default function useBusinessOutcomeWaterfall() {
  const business_summary = useBusinessSummary();
  const labour = useLabour();
  const model_readiness = useModelReadiness();
  const cost_allocation = useCostAllocation();
  const rate_builder_labour = useRateBuilderLabourRates();

  const [rate_builder_calculators, set_rate_builder_calculators] = useState([]);

  useEffect(() => {
    set_rate_builder_calculators(loadRateBuilderCalculators([]));
  }, []);

  const bs = business_summary.output_contract ?? {};
  const labour_contract = labour.output_contract ?? {};
  const assets_contract = model_readiness.modules?.assets?.output_contract ?? {};
  const allocation_contract = cost_allocation.output_contract ?? {};
  const weighted_summary = rate_builder_labour.weighted_summary ?? {};

  const labour_charge_out_rate_for_calculator =
    Number(rate_builder_labour?.current_charge_out_rate) || null;

  const operational_group_cost_rows =
    allocation_contract.operational_group_cost_rows ?? [];

  const calculation = useMemo(() => {
    return calculateBusinessOutcome({
      totalLabourCost: bs.total_people_cost_annual ?? 0,
      totalAssetCost: bs.total_asset_cost_annual ?? 0,
      totalBusinessOverheads: bs.total_business_overheads ?? 0,

      // Pressure-table-only fields - intentionally not sourced (see
      // header note). Passed as null/0 so calculateBusinessOutcome()
      // still runs, but the pressure table itself is never rendered.
      labourRecoveryCost: 0,
      assetRecoveryCost: 0,
      overheadAbsorbedCost: 0,
      staffCoveragePercent: null,
      assetCoveragePercent: null,

      labourModelRecoveryCapacity: weighted_summary.summary_complete
        ? weighted_summary.weighted_modelled_labour_revenue ?? null
        : null,
      labourRateDataComplete: weighted_summary.summary_complete === true,
      labourMissingRateCount: weighted_summary.missing_rate_count ?? null,

      totalRevenue: bs.total_revenue ?? 0,
      totalDirectCosts: bs.total_direct_costs ?? 0,
      productiveLabourCost: labour_contract.total_productive_labour_cost ?? 0,
      nonProductiveLabourCost:
        labour_contract.total_non_productive_labour_cost ?? 0,

      productiveAssetCost: assets_contract.productive_asset_cost ?? 0,
      productiveAssetAssignedOverheadCost:
        assets_contract.productive_asset_assigned_overhead_cost_annual ?? 0,
      supportAssetCost: assets_contract.support_asset_cost ?? 0,
      supportAssetAssignedOverheadCost:
        assets_contract.support_asset_assigned_overhead_cost_annual ?? 0,

      netPositionReference: bs.net_position ?? null,

      weightedSummaryRows: weighted_summary.weighted_summary_rows ?? [],

      rateBuilderCalculators: rate_builder_calculators,
      operationalGroupCostRows: operational_group_cost_rows,
      labourChargeOutRateForCalculator: labour_charge_out_rate_for_calculator,

      unassignedLabourCost: allocation_contract.unassigned_labour_cost ?? null,
      unassignedAssetCost: allocation_contract.unassigned_asset_cost ?? null,
    });
  }, [
    bs,
    labour_contract,
    assets_contract,
    allocation_contract,
    weighted_summary,
    rate_builder_calculators,
    operational_group_cost_rows,
    labour_charge_out_rate_for_calculator,
  ]);

  return calculation;
}
