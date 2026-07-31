/**
 * Business Outcome - Recovery Pressure Map + Reconstructed Waterfall
 * + Operating Group Split (shared by Labour and Assets) v7
 *
 * Every headline figure on this page must be independently
 * re-derivable and checked against a second, independently-sourced
 * calculation of the same thing. If two sources disagree, that is
 * surfaced explicitly - the page never silently displays a number it
 * cannot verify against itself.
 */

import { calculateOperatingGroupSplit } from './businessOutcomeAssetSplitCalculations';

export function calculateBusinessOutcome({
  totalLabourCost,
  totalAssetCost,
  totalBusinessOverheads,
  labourRecoveryCost,
  assetRecoveryCost,
  overheadAbsorbedCost,
  labourModelRecoveryCapacity,
  labourRateDataComplete,
  labourMissingRateCount,
  staffCoveragePercent,
  assetCoveragePercent,

  totalRevenue,
  totalDirectCosts,
  productiveLabourCost,
  nonProductiveLabourCost,
  productiveAssetCost,
  productiveAssetAssignedOverheadCost,
  supportAssetCost,
  supportAssetAssignedOverheadCost,
  netPositionReference,

  weightedSummaryRows,

  rateBuilderCalculators,
  operationalGroupCostRows,
  labourChargeOutRateForCalculator,

  unassignedLabourCost,
  unassignedAssetCost,
}) {
  // ============ LABOUR CALCULATION (pressure map) ============

  const hasLabourCapacity =
    labourRateDataComplete === true &&
    labourModelRecoveryCapacity !== null &&
    labourModelRecoveryCapacity !== undefined;

  const labourRecoveryGap = hasLabourCapacity
    ? labourRecoveryCost - labourModelRecoveryCapacity
    : null;

  const labourPressureStatus = !hasLabourCapacity
    ? 'rate_builder_incomplete'
    : labourRecoveryGap > 0
    ? 'pressure'
    : 'sufficient';

  // ============ ASSET CALCULATION (pressure map) ============

  const assetPressureStatus = 'asset_recovery_pressure';

  // ============ OVERHEAD CALCULATION (pressure map) ============

  const overheadStrategyGap = totalBusinessOverheads - overheadAbsorbedCost;
  const overheadStatus = overheadStrategyGap > 0 ? 'unrecovered' : 'covered';

  // ============ PRIMARY PRESSURE SOURCE ============

  const primaryPressureSource =
    labourPressureStatus === 'pressure' && overheadStatus === 'unrecovered'
      ? 'combined_labour_overhead'
      : labourPressureStatus === 'pressure'
      ? 'labour'
      : overheadStatus === 'unrecovered'
      ? 'overhead'
      : hasLabourCapacity
      ? 'none_identified'
      : 'unknown_pending_rate_builder_data';

  // ============ STRUCTURE CONFIDENCE ============

  const hasStructureInputs =
    staffCoveragePercent !== null &&
    staffCoveragePercent !== undefined &&
    assetCoveragePercent !== null &&
    assetCoveragePercent !== undefined;

  const structureConfidenceNote = !hasStructureInputs
    ? 'Structure coverage data not available - pending verification'
    : staffCoveragePercent < 100 || assetCoveragePercent < 100
    ? 'Delivery risk: Not all labour/assets assigned to groups'
    : 'Structure coverage complete';

  // ============ RECONSTRUCTED WATERFALL ============

  const productiveLabourCharged = hasLabourCapacity
    ? labourModelRecoveryCapacity
    : null;

  const productiveLabourShortfall = hasLabourCapacity
    ? productiveLabourCost - labourModelRecoveryCapacity
    : null;

  const nonProductiveAssetCostTotal =
    (supportAssetCost ?? 0) + (supportAssetAssignedOverheadCost ?? 0);

  const productiveAssetCostTotal =
    (productiveAssetCost ?? 0) + (productiveAssetAssignedOverheadCost ?? 0);

  const margin = hasLabourCapacity
    ? totalRevenue - productiveLabourCharged - totalDirectCosts
    : null;

  const netProfit = hasLabourCapacity
    ? margin -
      productiveLabourShortfall -
      (nonProductiveLabourCost ?? 0) -
      nonProductiveAssetCostTotal -
      productiveAssetCostTotal -
      totalBusinessOverheads
    : null;

  const netProfitVariance =
    netProfit !== null && netPositionReference !== null && netPositionReference !== undefined
      ? netProfit - netPositionReference
      : null;

  const netProfitReconciles =
    netProfitVariance === null ? null : Math.abs(netProfitVariance) < 1;

  const waterfall = {
    available: hasLabourCapacity,
    revenue: totalRevenue,
    productiveLabourCharged,
    totalDirectCosts,
    margin,
    productiveLabourShortfall,
    nonProductiveLabourCost: nonProductiveLabourCost ?? 0,
    nonProductiveAssetCost: nonProductiveAssetCostTotal,
    productiveAssetCost: productiveAssetCostTotal,
    generalOverheads: totalBusinessOverheads,
    netProfit,
    netPositionReference,
    netProfitVariance,
    netProfitReconciles,
    unavailableReason: !hasLabourCapacity
      ? 'Labour model capacity not available - Rate Builder incomplete'
      : null,
  };

  // ============ OPERATING GROUP SPLIT (shared source) ============

  const groupSplit = calculateOperatingGroupSplit({
    calculators: Array.isArray(rateBuilderCalculators) ? rateBuilderCalculators : [],
    operationalGroupCostRows: Array.isArray(operationalGroupCostRows) ? operationalGroupCostRows : [],
    totalRevenue,
    labourChargeOutRate: labourChargeOutRateForCalculator ?? null,
    weightedSummaryRows: Array.isArray(weightedSummaryRows) ? weightedSummaryRows : [],
  });

  const labourGroupRows = groupSplit.rows.filter((row) => row.hasLabour && !row.hasAsset);
  const assetGroupRows = groupSplit.rows.filter((row) => row.hasAsset);

  // ============ FULL LABOUR RECONCILIATION (Cost + Charged) ============

  const safeGroups = Array.isArray(operationalGroupCostRows) ? operationalGroupCostRows : [];

  const labourOnlyGroupsCost = labourGroupRows.reduce(
    (sum, row) => sum + (row.detail?.labour?.cost ?? 0),
    0
  );

  const labourOnlyGroupsCharged = labourGroupRows.reduce(
    (sum, row) => sum + (row.detail?.labour?.charged ?? 0),
    0
  );

  const labourInAssetGroupsCost = safeGroups
    .filter((group) => Number(group?.assigned_asset_burden) > 0)
    .reduce((sum, group) => sum + Number(group?.assigned_labour_cost || 0), 0);

  const labourInAssetGroupsCharged = assetGroupRows.reduce(
    (sum, row) => sum + (row.detail?.labour?.charged ?? 0),
    0
  );
  const labourInAssetGroupsChargedComplete = assetGroupRows.every(
    (row) => row.detail?.labour?.charged !== null && row.detail?.labour?.charged !== undefined
  );

  const safeNonProductiveLabourCost = nonProductiveLabourCost ?? 0;
  const safeUnassignedLabourCost = unassignedLabourCost ?? 0;

  const totalLabourAccounted =
    labourOnlyGroupsCost +
    labourInAssetGroupsCost +
    safeNonProductiveLabourCost +
    safeUnassignedLabourCost;

  const labourReconciliationVariance = totalLabourAccounted - (totalLabourCost ?? 0);
  const labourReconciles = Math.abs(labourReconciliationVariance) < 1;

  const totalLabourChargedBottomUp = labourInAssetGroupsChargedComplete
    ? labourOnlyGroupsCharged + labourInAssetGroupsCharged
    : null;

  const labourChargedVariance =
    totalLabourChargedBottomUp !== null && hasLabourCapacity
      ? totalLabourChargedBottomUp - labourModelRecoveryCapacity
      : null;

  const labourChargedReconciles =
    labourChargedVariance === null ? null : Math.abs(labourChargedVariance) < 1;

  // ============ FULL ASSET COST RECONCILIATION ============
  //
  // Cost Allocation operating groups only ever cover PRODUCTIVE assets
  // (support/non-productive assets have no charge-out mechanism and
  // are never assigned to a group at all - same structural gap Labour
  // already accounts for via Non-Productive Labour). Fixed: added
  // nonProductiveAssetCostTotal as its own reconciliation line,
  // matching the Labour pattern exactly.

  const assetGroupsCost = safeGroups.reduce(
    (sum, group) => sum + Number(group?.assigned_asset_burden || 0),
    0
  );

  const safeUnassignedAssetCost = unassignedAssetCost ?? 0;

  const totalAssetAccounted =
    assetGroupsCost + nonProductiveAssetCostTotal + safeUnassignedAssetCost;

  const assetReconciliationVariance = totalAssetAccounted - (totalAssetCost ?? 0);
  const assetReconciles = Math.abs(assetReconciliationVariance) < 1;

  return {
    labour: {
      cost: totalLabourCost,
      modelRecoveryCapacity: hasLabourCapacity ? labourModelRecoveryCapacity : null,
      recoveryTarget: labourRecoveryCost,
      gap: labourRecoveryGap,
      status: labourPressureStatus,
      missingRateCount: labourMissingRateCount,
    },
    asset: {
      cost: totalAssetCost,
      recoveryTarget: assetRecoveryCost,
      modelCapacityAvailable: false,
      status: assetPressureStatus,
      flagMessage: 'Asset utilization data not available - cannot calculate model capacity',
    },
    overhead: {
      cost: totalBusinessOverheads,
      recoveryTarget: overheadAbsorbedCost,
      gap: overheadStrategyGap,
      status: overheadStatus,
    },
    primaryPressureSource,
    structureConfidence: {
      staffCoveragePercent: hasStructureInputs ? staffCoveragePercent : null,
      assetCoveragePercent: hasStructureInputs ? assetCoveragePercent : null,
      note: structureConfidenceNote,
    },
    waterfall,
    labourSplit: {
      rows: labourGroupRows,
      totalRevenue,
      unassignedLabourCost: unassignedLabourCost ?? null,
      reconciliation: {
        labourOnlyGroupsCost,
        labourOnlyGroupsCharged,
        labourInAssetGroupsCost,
        labourInAssetGroupsCharged,
        labourInAssetGroupsChargedComplete,
        nonProductiveLabourCost: safeNonProductiveLabourCost,
        unassignedLabourCost: safeUnassignedLabourCost,
        totalLabourCost: totalLabourCost ?? 0,
        totalLabourAccounted,
        variance: labourReconciliationVariance,
        reconciles: labourReconciles,
        totalLabourChargedBottomUp,
        labourModelRecoveryCapacity: hasLabourCapacity ? labourModelRecoveryCapacity : null,
        labourChargedVariance,
        labourChargedReconciles,
      },
    },
    assetSplit: {
      rows: assetGroupRows,
      totalRevenue,
      unassignedAssetCost: unassignedAssetCost ?? null,
      reconciliation: {
        assetGroupsCost,
        nonProductiveAssetCost: nonProductiveAssetCostTotal,
        unassignedAssetCost: safeUnassignedAssetCost,
        totalAssetCost: totalAssetCost ?? 0,
        totalAssetAccounted,
        variance: assetReconciliationVariance,
        reconciles: assetReconciles,
      },
    },
  };
}
