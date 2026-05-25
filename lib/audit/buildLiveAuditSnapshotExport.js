/**
 * QS Tools — Live Audit Snapshot Export Helper
 * v1.0
 *
 * Purpose:
 * Build the app-state JSON contract required by:
 *
 * tools/audit/qs_build_live_snapshot.py
 *
 * This helper does not download or write files by itself.
 * It only normalises live app/calculation state into the audit export shape.
 */

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value) {
  return Number(toNumber(value).toFixed(2));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getValue(source, key, fallback = 0) {
  if (!source || typeof source !== "object") return fallback;
  return source[key] ?? fallback;
}

function buildPnlBlock(pnlData = {}) {
  const pnlLabourCost = roundMoney(
    getValue(pnlData, "pnl_labour_cost", getValue(pnlData, "labour_cost", 0))
  );

  const pnlAssetCost = roundMoney(
    getValue(pnlData, "pnl_asset_cost", getValue(pnlData, "asset_cost", 0))
  );

  const pnlGeneralOverheads = roundMoney(
    getValue(
      pnlData,
      "pnl_general_overheads",
      getValue(pnlData, "general_overheads", 0)
    )
  );

  const pnlDepreciation = roundMoney(
    getValue(pnlData, "pnl_depreciation", getValue(pnlData, "depreciation", 0))
  );

  const pnlInterest = roundMoney(
    getValue(pnlData, "pnl_interest", getValue(pnlData, "interest", 0))
  );

  const explicitBaseline = getValue(pnlData, "pnl_baseline_cost", null);

  const pnlBaselineCost =
    explicitBaseline !== null
      ? roundMoney(explicitBaseline)
      : roundMoney(
          pnlLabourCost +
            pnlAssetCost +
            pnlGeneralOverheads +
            pnlDepreciation +
            pnlInterest
        );

  return {
    pnl_baseline_cost: pnlBaselineCost,
    pnl_labour_cost: pnlLabourCost,
    pnl_asset_cost: pnlAssetCost,
    pnl_general_overheads: pnlGeneralOverheads,
    pnl_depreciation: pnlDepreciation,
    pnl_interest: pnlInterest,
  };
}

function buildCostSummaryBlock(costSummaryData = {}) {
  const totalPeopleCostAnnual = roundMoney(
    getValue(costSummaryData, "total_people_cost_annual", 0)
  );

  const totalAssetCostAnnual = roundMoney(
    getValue(costSummaryData, "total_asset_cost_annual", 0)
  );

  const totalBusinessOverheads = roundMoney(
    getValue(costSummaryData, "total_business_overheads", 0)
  );

  const explicitTotalCostBurden = getValue(
    costSummaryData,
    "total_cost_burden",
    null
  );

  const totalCostBurden =
    explicitTotalCostBurden !== null
      ? roundMoney(explicitTotalCostBurden)
      : roundMoney(
          totalPeopleCostAnnual +
            totalAssetCostAnnual +
            totalBusinessOverheads
        );

  return {
    total_people_cost_annual: totalPeopleCostAnnual,
    total_asset_cost_annual: totalAssetCostAnnual,
    total_business_overheads: totalBusinessOverheads,
    total_cost_burden: totalCostBurden,
  };
}

function buildExplainedVarianceBlock(explainedVariance = {}) {
  return {
    labour_model_variance: roundMoney(
      getValue(explainedVariance, "labour_model_variance", 0)
    ),
    asset_model_variance: roundMoney(
      getValue(explainedVariance, "asset_model_variance", 0)
    ),
    asset_finance_variance: roundMoney(
      getValue(explainedVariance, "asset_finance_variance", 0)
    ),
    depreciation_exclusion_variance: roundMoney(
      getValue(explainedVariance, "depreciation_exclusion_variance", 0)
    ),
    employee_overhead_mapping_variance: roundMoney(
      getValue(explainedVariance, "employee_overhead_mapping_variance", 0)
    ),
    general_overhead_mapping_variance: roundMoney(
      getValue(explainedVariance, "general_overhead_mapping_variance", 0)
    ),
    cost_of_sales_mapping_variance: roundMoney(
      getValue(explainedVariance, "cost_of_sales_mapping_variance", 0)
    ),
    timing_variance: roundMoney(
      getValue(explainedVariance, "timing_variance", 0)
    ),
    rounding_variance: roundMoney(
      getValue(explainedVariance, "rounding_variance", 0)
    ),
    unmapped_variance: roundMoney(
      getValue(explainedVariance, "unmapped_variance", 0)
    ),
  };
}

export function buildLiveAuditSnapshotExport({
  snapshotName = "Current QS Tools Audit Snapshot",
  snapshotSource = "qs_tools_app_export",
  snapshotDate = todayIsoDate(),
  pnlData = {},
  costSummaryData = {},
  explainedVariance = {},
  notes = "Built from QS Tools app-state export.",
} = {}) {
  return {
    snapshot_name: snapshotName,
    snapshot_source: snapshotSource,
    snapshot_date: snapshotDate,

    pnl: buildPnlBlock(pnlData),

    cost_summary: buildCostSummaryBlock(costSummaryData),

    explained_variance: buildExplainedVarianceBlock(explainedVariance),

    notes,
  };
}

export function stringifyLiveAuditSnapshotExport(payload) {
  return JSON.stringify(payload, null, 2);
}

export function buildLiveAuditSnapshotDownloadBlob(payload) {
  return new Blob([stringifyLiveAuditSnapshotExport(payload)], {
    type: "application/json",
  });
}