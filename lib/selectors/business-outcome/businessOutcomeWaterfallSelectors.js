// Business Outcome net-profit waterfall display selector (S23).
//
// Deliberately reads ONLY calculation.waterfall, .labourSplit, .assetSplit
// from calculateBusinessOutcome()'s output - never .labour / .asset /
// .overhead / .primaryPressureSource / .structureConfidence, which are
// pressure-table fields dependent on Recovery Summary data this hook does
// not provide (see useBusinessOutcomeWaterfall.js header note and
// S25_BUSINESS_OUTCOME_WATERFALL_SOURCE_CONFIRMATION_v5_1). Reading those
// fields here would silently show fabricated "sufficient"/"covered"
// statuses built from placeholder zeros.

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
      reason: charged === null ? row.reason || "Labour charge-out rate not available" : null,
    };
  });
}

function shapeAssetGroupRows(rows) {
  return (rows ?? []).map((row) => ({
    groupId: row.groupId,
    groupName: row.groupName,
    cost: row.totalGroupCost,
    charged: row.totalCharged,
    profitOrLoss: row.profitOrLoss,
    percentOfRevenue: row.percentOfRevenue,
    isProfitable: row.totalCharged !== null ? row.profitOrLoss >= 0 : null,
    reason: row.reason,
  }));
}

export function selectBusinessOutcomeWaterfall(calculation) {
  const { waterfall, labourSplit, assetSplit } = calculation;

  // ============ WATERFALL ROWS ============

  let waterfallRows = [];

  if (waterfall.available) {
    const labourShortfallIsSurplus = waterfall.productiveLabourShortfall < 0;
    const labourShortfallLabel = labourShortfallIsSurplus
      ? "Productive Labour Surplus (adds to profit)"
      : "Productive Labour Shortfall";
    const labourShortfallDisplayValue = -waterfall.productiveLabourShortfall;

    waterfallRows = [
      { id: "revenue", label: "Revenue", value: waterfall.revenue, indent: 0, isTotal: false },
      { id: "labour_charged", label: "Productive Labour Charged", value: -waterfall.productiveLabourCharged, indent: 1, isTotal: false },
      { id: "cog", label: "COG (Materials)", value: -waterfall.totalDirectCosts, indent: 1, isTotal: false },
      { id: "margin", label: "Margin", value: waterfall.margin, indent: 0, isTotal: true },
      { id: "labour_shortfall", label: labourShortfallLabel, value: labourShortfallDisplayValue, indent: 1, isTotal: false },
      { id: "non_prod_labour", label: "Non-Productive Labour Cost", value: -waterfall.nonProductiveLabourCost, indent: 1, isTotal: false },
      { id: "non_prod_asset", label: "Non-Productive Asset Cost", value: -waterfall.nonProductiveAssetCost, indent: 1, isTotal: false },
      { id: "prod_asset", label: "Productive Asset Cost", value: -waterfall.productiveAssetCost, indent: 1, isTotal: false },
      { id: "overheads", label: "General Overheads (unassigned)", value: -waterfall.generalOverheads, indent: 1, isTotal: false },
      { id: "net_profit", label: "Net Profit", value: waterfall.netProfit, indent: 0, isTotal: true },
    ];
  }

  // ============ RECONCILIATION (S23 Section 3 anchor) ============

  let reconciliation;
  if (!waterfall.available) {
    reconciliation = {
      status: "unavailable",
      message: waterfall.unavailableReason || "Waterfall not available.",
    };
  } else if (waterfall.netProfitReconciles) {
    reconciliation = {
      status: "ok",
      message: `Reconstructed Net Profit matches Business Summary's net position ($${waterfall.netPositionReference?.toFixed(0)}).`,
    };
  } else {
    reconciliation = {
      status: "warning",
      message: `Reconstructed Net Profit ($${waterfall.netProfit?.toFixed(0)}) does not match Business Summary's net position ($${waterfall.netPositionReference?.toFixed(0)}) - variance $${waterfall.netProfitVariance?.toFixed(0)}. Do not trust this waterfall until the discrepancy is resolved.`,
    };
  }

  // ============ LABOUR / ASSET SPLIT ============

  const labourSplitRows = shapeLabourGroupRows(labourSplit?.rows, labourSplit?.totalRevenue ?? 0);
  const labourSplitSummary = sumGroupTotals(labourSplitRows);

  const assetSplitRows = shapeAssetGroupRows(assetSplit?.rows);
  const assetSplitSummary = sumGroupTotals(assetSplitRows);

  // ============ WARNINGS (reconciliation-derived only) ============

  const warnings = [];

  if (reconciliation.status === "warning") {
    warnings.push({ id: "waterfall_reconciliation_failed", severity: "warning", message: reconciliation.message });
  }

  const labourReconciliation = labourSplit?.reconciliation;
  if (labourReconciliation && labourReconciliation.reconciles === false) {
    warnings.push({
      id: "labour_reconciliation_failed",
      severity: "warning",
      message: `Labour cost reconciliation does not match: accounted $${labourReconciliation.totalLabourAccounted.toFixed(0)} vs actual $${labourReconciliation.totalLabourCost.toFixed(0)} - variance $${labourReconciliation.variance.toFixed(0)}.`,
    });
  }

  const assetReconciliation = assetSplit?.reconciliation;
  if (assetReconciliation && assetReconciliation.reconciles === false) {
    warnings.push({
      id: "asset_reconciliation_failed",
      severity: "warning",
      message: `Asset cost reconciliation does not match: accounted $${assetReconciliation.totalAssetAccounted.toFixed(0)} vs actual $${assetReconciliation.totalAssetCost.toFixed(0)} - variance $${assetReconciliation.variance.toFixed(0)}.`,
    });
  }

  if (assetSplit?.unassignedAssetCost > 0) {
    warnings.push({
      id: "unassigned_asset_cost",
      severity: "info",
      message: `$${assetSplit.unassignedAssetCost.toFixed(0)} of asset cost is not assigned to any Cost Allocation group.`,
    });
  }

  return {
    waterfallAvailable: waterfall.available,
    waterfallRows,
    reconciliation,

    labourSplitRows,
    labourSplitTotals: labourSplitSummary.totals,
    labourSplitAllPriced: labourSplitSummary.allPriced,

    assetSplitRows,
    assetSplitTotals: assetSplitSummary.totals,
    assetSplitAllPriced: assetSplitSummary.allPriced,

    warnings,
    warningCount: warnings.length,

    // S23 Section 6 - mandatory, persistent disclosure
    utilisation_note:
      "Labour and asset figures assume full utilisation. Confirmed by live usage data in a future release.",
  };
}
