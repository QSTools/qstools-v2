'use client';

import { useEffect, useMemo, useState } from 'react';
import useRecoverySummary from './useRecoverySummary';
import useLabour from './useLabour';
import useCostAllocation from './useCostAllocation';
import { useRateBuilderLabourRates } from './rate-builder/useRateBuilderLabourRates';
import { loadRateBuilderCalculators } from '@/lib/storage/rateBuilderStorage';
import { calculateBusinessOutcome } from '@/lib/calculations/businessOutcomeCalculations';
import { selectBusinessOutcomeDisplay } from '@/lib/selectors/businessOutcomeSelectors';

export function useBusinessOutcome() {
  const recoverySummary = useRecoverySummary();
  const labour = useLabour();
  const costAllocation = useCostAllocation();
  const rateBuilderLabour = useRateBuilderLabourRates();

  const recovery = recoverySummary.output_contract || {};
  const labourContract = labour.output_contract || {};
  const allocationContract = costAllocation.output_contract || {};
  const weightedSummary = rateBuilderLabour.weighted_summary || {};

  const labourChargeOutRateForCalculator =
    Number(rateBuilderLabour?.current_charge_out_rate) || null;

  const [rateBuilderCalculators, setRateBuilderCalculators] = useState([]);

  useEffect(() => {
    setRateBuilderCalculators(loadRateBuilderCalculators([]));
  }, []);

  const operationalGroupCostRows = allocationContract.operational_group_cost_rows || [];

  const calculation = useMemo(() => {
    return calculateBusinessOutcome({
      totalLabourCost: recovery.total_people_cost_annual ?? 0,
      totalAssetCost: recovery.total_asset_cost_annual ?? 0,
      totalBusinessOverheads: recovery.total_business_overheads ?? 0,

      labourRecoveryCost: recovery.labour_recovery_cost ?? 0,
      assetRecoveryCost: recovery.asset_recovery_cost ?? 0,
      overheadAbsorbedCost: recovery.overhead_absorbed_cost ?? 0,

      labourModelRecoveryCapacity: weightedSummary.summary_complete
        ? weightedSummary.weighted_modelled_labour_revenue ?? null
        : null,
      labourRateDataComplete: weightedSummary.summary_complete === true,
      labourMissingRateCount: weightedSummary.missing_rate_count ?? null,

      staffCoveragePercent: allocationContract.staff_coverage_percent ?? null,
      assetCoveragePercent: allocationContract.asset_coverage_percent ?? null,

      totalRevenue: recovery.total_revenue ?? 0,
      totalDirectCosts: recovery.total_direct_costs ?? 0,
      productiveLabourCost: labourContract.total_productive_labour_cost ?? 0,
      nonProductiveLabourCost: labourContract.total_non_productive_labour_cost ?? 0,
      productiveAssetCost: recovery.productive_asset_cost ?? 0,
      productiveAssetAssignedOverheadCost:
        recovery.productive_asset_assigned_overhead_cost_annual ?? 0,
      supportAssetCost: recovery.support_asset_cost ?? 0,
      supportAssetAssignedOverheadCost:
        recovery.support_asset_assigned_overhead_cost_annual ?? 0,
      netPositionReference: recovery.net_position ?? null,

      weightedSummaryRows: weightedSummary.weighted_summary_rows ?? [],

      rateBuilderCalculators,
      operationalGroupCostRows,
      labourChargeOutRateForCalculator,

      unassignedLabourCost: allocationContract.unassigned_labour_cost ?? null,
      unassignedAssetCost: allocationContract.unassigned_asset_cost ?? null,
    });
  }, [
    recovery,
    labourContract,
    allocationContract,
    weightedSummary,
    rateBuilderCalculators,
    operationalGroupCostRows,
    labourChargeOutRateForCalculator,
  ]);

  const output_contract = useMemo(() => {
    return selectBusinessOutcomeDisplay(calculation, {
      recoverySummaryTrustState: recovery.model_trust_state || 'blocked',
    });
  }, [calculation, recovery]);

  return output_contract;
}



