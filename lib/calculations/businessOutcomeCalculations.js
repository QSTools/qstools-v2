/**
 * Business Outcome - Recovery Pressure Map + Reconstructed Waterfall
 * + Operating Group Split (shared by Labour and Assets) v8
 *
 * Every headline figure on this page must be independently
 * re-derivable and checked against a second, independently-sourced
 * calculation of the same thing. If two sources disagree, that is
 * surfaced explicitly - the page never silently displays a number it
 * cannot verify against itself.
 *
 * S18 6.4 - Non-Productive Labour/Asset cost now also reconciles at
 * group level, not just the whole-business flat total. The flat
 * totals (nonProductiveLabourCost from Labour, nonProductiveAssetCost
 * from Recovery Summary) and the new per-group sums (from Cost
 * Allocation's operational_group_cost_rows) are independently sourced
 * - if they disagree, that means something non-productive exists but
 * is not assigned to any group, which is a genuine, useful signal
 * (and the exact gap S18 6.5's warning will act on next).
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

  // Groups whose profitOrLoss is known and negative - surfaced separately
  // from the aggregate utilization-data-missing message below, since
  // they are two different findings and neither should hide the other.
  const assetGroupsAtLoss = assetGroupRows.filter(
    (row) => row.profitOrLoss !== null && row.profitOrLoss !== undefined && row.profitOrLoss < 0
  );

  // S18 6.4 - Non-Productive Labour/Asset by group. Deliberately NOT
  // folded into labourGroupRows/assetGroupRows above (those filters
  // are unchanged, still productive-only) - a group with ONLY
  // non-productive cost and no productive labour/assets (e.g.
  // "Management" with just an Owner/Director) would otherwise never
  // appear in either existing view. Built straight from groupSplit.rows
  // so every group is considered, not just the ones with productive cost.
  const nonProductiveLabourGroupRows = groupSplit.rows
    .filter((row) => row.nonProductiveLabourCost > 0)
    .map((row) => ({
      groupId: row.groupId,
      groupName: row.groupName,
      cost: row.nonProductiveLabourCost,
    }));

  const nonProductiveAssetGroupRows = groupSplit.rows
    .filter((row) => row.nonProductiveAssetCost > 0)
    .map((row) => ({
      groupId: row.groupId,
      groupName: row.groupName,
      cost: row.nonProductiveAssetCost,
    }));

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

  // S18 6.4 - second, independent check: does the sum of Non-Productive
  // Labour actually assigned to groups (Cost Allocation-sourced) match
  // the flat whole-business Non-Productive Labour total (Labour-module-
  // sourced)? A variance here means non-productive labour exists that
  // has NOT been assigned to any group - the exact condition S18 6.5's
  // warning will act on. This does not change totalLabourAccounted or
  // labourReconciles above, which remain the authoritative whole-
  // business reconciliation exactly as before.
  const nonProductiveLabourGroupedTotal = nonProductiveLabourGroupRows.reduce(
    (sum, row) => sum + row.cost,
    0
  );

  const nonProductiveLabourGroupedVariance =
    nonProductiveLabourGroupedTotal - safeNonProductiveLabourCost;

  const nonProductiveLabourGroupedReconciles =
    Math.abs(nonProductiveLabourGroupedVariance) < 1;

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

  // S18 6.4 - same second, independent check as labour above, applied
  // to non-productive assets.
  const nonProductiveAssetGroupedTotal = nonProductiveAssetGroupRows.reduce(
    (sum, row) => sum + row.cost,
    0
  );

  const nonProductiveAssetGroupedVariance =
    nonProductiveAssetGroupedTotal - nonProductiveAssetCostTotal;

  const nonProductiveAssetGroupedReconciles =
    Math.abs(nonProductiveAssetGroupedVariance) < 1;

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
      flagMessage:
        assetGroupsAtLoss.length > 0
          ? "Asset utilization data not available - cannot calculate model capacity. " + assetGroupsAtLoss.length + " of " + assetGroupRows.length + " asset-backed group" + (assetGroupsAtLoss.length === 1 ? "" : "s") + " currently at a loss."
          : 'Asset utilization data not available - cannot calculate model capacity',
      assetGroupsAtLoss: assetGroupsAtLoss.map((row) => ({ groupName: row.groupName, profitOrLoss: row.profitOrLoss })),
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

        // S18 6.4 - additive. Existing fields above are all unchanged.
        nonProductiveLabourByGroup: nonProductiveLabourGroupRows,
        nonProductiveLabourGroupedTotal,
        nonProductiveLabourGroupedVariance,
        nonProductiveLabourGroupedReconciles,
      },
    },
    // S18 6.4 - new top-level section, mirrors labourSplit/assetSplit
    // shape for consistency.
    nonProductiveLabourSplit: {
      rows: nonProductiveLabourGroupRows,
      totalNonProductiveLabourCost: safeNonProductiveLabourCost,
      groupedTotal: nonProductiveLabourGroupedTotal,
      variance: nonProductiveLabourGroupedVariance,
      reconciles: nonProductiveLabourGroupedReconciles,
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

        // S18 6.4 - additive. Existing fields above are all unchanged.
        nonProductiveAssetByGroup: nonProductiveAssetGroupRows,
        nonProductiveAssetGroupedTotal,
        nonProductiveAssetGroupedVariance,
        nonProductiveAssetGroupedReconciles,
      },
    },
    // S18 6.4 - new top-level section, mirrors labourSplit/assetSplit
    // shape for consistency.
    nonProductiveAssetSplit: {
      rows: nonProductiveAssetGroupRows,
      totalNonProductiveAssetCost: nonProductiveAssetCostTotal,
      groupedTotal: nonProductiveAssetGroupedTotal,
      variance: nonProductiveAssetGroupedVariance,
      reconciles: nonProductiveAssetGroupedReconciles,
    },
  };
}
