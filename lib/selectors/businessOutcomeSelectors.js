/**
 * Business Outcome Display Selectors
 *
 * Shapes calculation output for UI display.
 */

function shapeAssetGroupRows(rows) {
  return (rows ?? []).map((row) => ({
    groupId: row.groupId,
    groupName: row.groupName,
    calculatorName: row.calculatorName,
    hasCalculator: row.hasCalculator,
    cost: row.totalGroupCost,
    charged: row.totalCharged,
    profitOrLoss: row.profitOrLoss,
    percentOfRevenue: row.percentOfRevenue,
    isProfitable: row.totalCharged !== null ? row.profitOrLoss >= 0 : null,
    reason: row.reason,
    detail: row.detail,
  }));
}

function shapeLabourGroupRows(rows, totalRevenue) {
  return (rows ?? []).map((row) => {
    const labourDetail = row.detail?.labour ?? null;
    const cost = labourDetail?.cost ?? row.totalGroupCost;
    const charged = labourDetail?.charged ?? null;
    const profitOrLoss = labourDetail?.profitOrLoss ?? null;
    const percentOfRevenue =
      charged !== null && totalRevenue > 0 ? (charged / totalRevenue) * 100 : null;

    return {
      groupId: row.groupId,
      groupName: row.groupName,
      cost,
      charged,
      profitOrLoss,
      percentOfRevenue,
      isProfitable: charged !== null ? profitOrLoss >= 0 : null,
      reason: charged === null ? (row.reason || 'Labour charge-out rate not available') : null,
      rate: labourDetail?.rate ?? null,
      assignments: labourDetail?.assignments ?? [],
    };
  });
}

function sumGroupTotals(rows) {
  const priced = rows.filter((row) => row.charged !== null);

  return {
    allPriced: priced.length === rows.length,
    totals: priced.reduce(
      (acc, row) => ({
        cost: acc.cost + (row.cost ?? 0),
        charged: acc.charged + (row.charged ?? 0),
        profitOrLoss: acc.profitOrLoss + (row.profitOrLoss ?? 0),
      }),
      { cost: 0, charged: 0, profitOrLoss: 0 }
    ),
  };
}

export function selectBusinessOutcomeDisplay(calculation, trustStates) {
  const {
    labour,
    asset,
    overhead,
    primaryPressureSource,
    structureConfidence,
    waterfall,
    labourSplit,
    assetSplit,
  } = calculation;

  // ============ TRUST STATE LOGIC ============

  const isTrusted = trustStates.recoverySummaryTrustState !== 'blocked';

  const businessOutcomeModelTrustState = isTrusted ? 'model_recovery_pressure' : 'blocked';
  const businessOutcomeStatus = 'modeled_only';

  // ============ PRESSURE ROW DATA ============

  const labourFlag =
    labour.status === 'rate_builder_incomplete'
      ? 'Rate Builder incomplete'
      : labour.status === 'pressure'
      ? 'Under-recovery'
      : 'On target';

  const labourModelCapacityNote =
    labour.status === 'rate_builder_incomplete'
      ? labour.missingRateCount
        ? `${labour.missingRateCount} staff type(s) missing a saved rate`
        : 'Rate Builder data incomplete'
      : null;

  const pressureRows = [
    {
      stream: 'Labour',
      cost: labour.cost,
      modelCapacity: labour.modelRecoveryCapacity,
      recoveryTarget: labour.recoveryTarget,
      gap: labour.gap,
      status: labour.status,
      flag: labourFlag,
      modelCapacityNote: labourModelCapacityNote,
    },
    {
      stream: 'Assets',
      cost: asset.cost,
      modelCapacity: null,
      recoveryTarget: asset.recoveryTarget,
      gap: null,
      status: asset.status,
      flag: asset.flagMessage,
      modelCapacityNote: 'No utilization data',
    },
    {
      stream: 'Overheads',
      cost: overhead.cost,
      modelCapacity: overhead.recoveryTarget,
      recoveryTarget: overhead.recoveryTarget,
      gap: overhead.gap,
      status: overhead.status,
      flag: overhead.status === 'unrecovered' ? 'Strategy gap' : 'Covered',
    },
  ];

  // ============ WATERFALL ROW DATA ============

  let waterfallRows = [];

  if (waterfall.available) {
    const labourShortfallIsSurplus = waterfall.productiveLabourShortfall < 0;
    const labourShortfallLabel = labourShortfallIsSurplus
      ? 'Productive Labour Surplus (adds to profit)'
      : 'Productive Labour Shortfall';
    const labourShortfallDisplayValue = -waterfall.productiveLabourShortfall;

    waterfallRows = [
      { id: 'revenue', label: 'Revenue', value: waterfall.revenue, indent: 0, isTotal: false },
      { id: 'labour_charged', label: 'Productive Labour Charged', value: -waterfall.productiveLabourCharged, indent: 1, isTotal: false },
      { id: 'cog', label: 'COG (Materials)', value: -waterfall.totalDirectCosts, indent: 1, isTotal: false },
      { id: 'margin', label: 'Margin', value: waterfall.margin, indent: 0, isTotal: true },
      { id: 'labour_shortfall', label: labourShortfallLabel, value: labourShortfallDisplayValue, indent: 1, isTotal: false, isSurplus: labourShortfallIsSurplus },
      { id: 'non_prod_labour', label: 'Non-Productive Labour Cost', value: -waterfall.nonProductiveLabourCost, indent: 1, isTotal: false },
      { id: 'non_prod_asset', label: 'Non-Productive Asset Cost', value: -waterfall.nonProductiveAssetCost, indent: 1, isTotal: false },
      { id: 'prod_asset', label: 'Productive Asset Cost', value: -waterfall.productiveAssetCost, indent: 1, isTotal: false },
      { id: 'overheads', label: 'General Overheads (unassigned)', value: -waterfall.generalOverheads, indent: 1, isTotal: false },
      { id: 'net_profit', label: 'Net Profit', value: waterfall.netProfit, indent: 0, isTotal: true },
    ];
  }

  // ============ LABOUR SPLIT ============

  const labourSplitRows = shapeLabourGroupRows(labourSplit?.rows, labourSplit?.totalRevenue ?? 0);
  const labourSplitSummary = sumGroupTotals(labourSplitRows);

  const labourReconciliation = labourSplit?.reconciliation ?? null;

  const labourReconciliationRows = labourReconciliation
    ? [
        {
          id: 'labour_only',
          label: 'Labour-only groups (above)',
          cost: labourReconciliation.labourOnlyGroupsCost,
          charged: labourReconciliation.labourOnlyGroupsCharged,
        },
        {
          id: 'labour_in_asset_groups',
          label: 'Labour inside Asset-backed groups',
          note: 'see Assets',
          cost: labourReconciliation.labourInAssetGroupsCost,
          charged: labourReconciliation.labourInAssetGroupsChargedComplete ? labourReconciliation.labourInAssetGroupsCharged : null,
        },
        {
          id: 'non_productive',
          label: 'Non-Productive Labour',
          note: 'never charged',
          cost: labourReconciliation.nonProductiveLabourCost,
          charged: 0,
        },
        {
          id: 'unassigned',
          label: 'Unassigned Labour',
          note: labourReconciliation.unassignedLabourCost > 0 ? 'coverage gap' : 'fully covered',
          cost: labourReconciliation.unassignedLabourCost,
          charged: 0,
        },
        {
          id: 'total',
          label: 'Total Labour',
          cost: labourReconciliation.totalLabourAccounted,
          charged: labourReconciliation.totalLabourChargedBottomUp,
          isTotal: true,
        },
      ]
    : [];

  const labourChargeOutRateApplied =
    labourSplitRows.find((row) => row.rate !== null)?.rate ?? null;

  // ============ ASSET SPLIT ============

  const assetSplitRows = shapeAssetGroupRows(assetSplit?.rows);
  const assetSplitSummary = sumGroupTotals(assetSplitRows);

  const assetReconciliation = assetSplit?.reconciliation ?? null;

  const assetReconciliationRows = assetReconciliation
    ? [
        { id: 'asset_groups', label: 'Assigned to Cost Allocation groups', value: assetReconciliation.assetGroupsCost },
        { id: 'non_productive', label: 'Non-Productive Asset Cost', note: 'no charge-out mechanism', value: assetReconciliation.nonProductiveAssetCost },
        { id: 'unassigned', label: 'Unassigned Asset Cost', note: assetReconciliation.unassignedAssetCost > 0 ? 'coverage gap' : 'fully covered', value: assetReconciliation.unassignedAssetCost },
        { id: 'total', label: 'Total Asset Cost', value: assetReconciliation.totalAssetAccounted, isTotal: true },
      ]
    : [];

  // ============ WARNINGS ============

  const warnings = [];

  if (labour.status === 'rate_builder_incomplete') {
    warnings.push({
      id: 'labour_rate_builder_incomplete',
      severity: 'info',
      message: labour.missingRateCount
        ? `Rate Builder is missing a saved charge-out rate for ${labour.missingRateCount} staff type(s) - labour model capacity and the reconstructed waterfall cannot be calculated until all rates are saved`
        : 'Rate Builder data is incomplete - labour model capacity and the reconstructed waterfall cannot be calculated',
    });
  } else if (labour.status === 'pressure') {
    warnings.push({
      id: 'labour_under_recovery',
      severity: 'warning',
      message: `Labour gap: $${Math.abs(labour.gap).toFixed(0)} - recovery target exceeds Rate Builder model capacity`,
    });
  }

  if (overhead.status === 'unrecovered') {
    warnings.push({
      id: 'overhead_strategy_gap',
      severity: 'warning',
      message: `Overhead gap: $${overhead.gap.toFixed(0)} - not fully absorbed by recovery strategy`,
    });
  }

  if (structureConfidence.staffCoveragePercent === null || structureConfidence.assetCoveragePercent === null) {
    warnings.push({
      id: 'structure_confidence_missing',
      severity: 'info',
      message: 'Structure coverage data not wired yet - pending verification',
    });
  } else if (structureConfidence.staffCoveragePercent < 100 || structureConfidence.assetCoveragePercent < 100) {
    warnings.push({
      id: 'structure_incomplete',
      severity: 'info',
      message: `Structure coverage: Labour ${structureConfidence.staffCoveragePercent}%, Assets ${structureConfidence.assetCoveragePercent}% - delivery risk from unallocated cost`,
    });
  }

  if (waterfall.available && waterfall.netProfitReconciles === false) {
    warnings.push({
      id: 'waterfall_reconciliation_failed',
      severity: 'warning',
      message: `Reconstructed Net Profit ($${waterfall.netProfit?.toFixed(0)}) does not match Recovery Summary's net position ($${waterfall.netPositionReference?.toFixed(0)}) - variance $${waterfall.netProfitVariance?.toFixed(0)}. Do not trust this waterfall until the discrepancy is resolved.`,
    });
  }

  if (labourReconciliation && labourReconciliation.reconciles === false) {
    warnings.push({
      id: 'labour_reconciliation_failed',
      severity: 'warning',
      message: `Labour cost reconciliation does not match: accounted $${labourReconciliation.totalLabourAccounted.toFixed(0)} vs actual $${labourReconciliation.totalLabourCost.toFixed(0)} - variance $${labourReconciliation.variance.toFixed(0)}. Do not trust the Labour Split breakdown until this is resolved.`,
    });
  }

  if (labourReconciliation && labourReconciliation.labourChargedReconciles === false) {
    warnings.push({
      id: 'labour_charged_reconciliation_failed',
      severity: 'warning',
      message: `Total Labour Charged (built bottom-up from groups: $${labourReconciliation.totalLabourChargedBottomUp?.toFixed(0)}) does not match Rate Builder's own Model Capacity figure ($${labourReconciliation.labourModelRecoveryCapacity?.toFixed(0)}) - variance $${labourReconciliation.labourChargedVariance?.toFixed(0)}. These two figures are calculated independently and should always agree.`,
    });
  }

  if (assetReconciliation && assetReconciliation.reconciles === false) {
    warnings.push({
      id: 'asset_reconciliation_failed',
      severity: 'warning',
      message: `Asset cost reconciliation does not match: Cost Allocation groups + non-productive + unassigned = $${assetReconciliation.totalAssetAccounted.toFixed(0)} vs Recovery Summary's total asset cost $${assetReconciliation.totalAssetCost.toFixed(0)} - variance $${assetReconciliation.variance.toFixed(0)}. Do not trust the Asset Split totals until this is traced.`,
    });
  }

  if (assetSplit?.unassignedAssetCost !== null && assetSplit?.unassignedAssetCost > 0) {
    warnings.push({
      id: 'unassigned_asset_cost',
      severity: 'warning',
      message: `$${assetSplit.unassignedAssetCost.toFixed(0)} of asset cost is not assigned to any Cost Allocation group - it is invisible to the Asset Split view above until assigned.`,
    });
  }

  // ============ OUTPUT CONTRACT ============

  return {
    pressureRows,
    primaryPressureSource,
    structureConfidence,
    waterfallRows,
    waterfallAvailable: waterfall.available,
    waterfallUnavailableReason: waterfall.unavailableReason,
    waterfallReconciles: waterfall.netProfitReconciles,

    labourSplitRows,
    labourSplitTotals: labourSplitSummary.totals,
    labourSplitAllPriced: labourSplitSummary.allPriced,
    labourChargeOutRateApplied,
    labourReconciliationRows,
    labourReconciles: labourReconciliation?.reconciles ?? null,
    labourChargedReconciles: labourReconciliation?.labourChargedReconciles ?? null,

    assetSplitRows,
    assetSplitTotals: assetSplitSummary.totals,
    assetSplitAllPriced: assetSplitSummary.allPriced,
    assetReconciliationRows,
    assetReconciles: assetReconciliation?.reconciles ?? null,

    warnings,
    warningCount: warnings.length,

    business_outcome_status: businessOutcomeStatus,
    business_outcome_model_trust_state: businessOutcomeModelTrustState,
    business_outcome_note:
      'This page shows where recovery pressure exists and how net profit is actually generated, based on model capacity and strategy - not actual performance.',

    isReady: businessOutcomeModelTrustState !== 'blocked',
  };
}
