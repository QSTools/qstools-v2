/**
 * QS Tools — Live Snapshot Export Helper Test
 * v1.0
 *
 * Purpose:
 * Validate that lib/audit/buildLiveAuditSnapshotExport.js returns the
 * app-state JSON contract required by the Python audit snapshot builder.
 */

import { pathToFileURL } from "url";
import path from "path";

const projectRoot = process.cwd();

const helperPath = path.join(
  projectRoot,
  "lib",
  "audit",
  "buildLiveAuditSnapshotExport.js"
);

const helperUrl = pathToFileURL(helperPath).href;

const {
  buildLiveAuditSnapshotExport,
  stringifyLiveAuditSnapshotExport,
} = await import(helperUrl);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function check(name, expected, actual) {
  const passed = JSON.stringify(expected) === JSON.stringify(actual);

  return {
    name,
    expected,
    actual,
    passed,
  };
}

const snapshot = buildLiveAuditSnapshotExport({
  snapshotName: "Controlled Live Snapshot Export Test",
  snapshotDate: "2026-05-25",
  pnlData: {
    pnl_baseline_cost: 95000,
    pnl_labour_cost: 60000,
    pnl_asset_cost: 12000,
    pnl_general_overheads: 23000,
    pnl_depreciation: 0,
    pnl_interest: 0,
  },
  costSummaryData: {
    total_people_cost_annual: 60000,
    total_asset_cost_annual: 12000,
    total_business_overheads: 23000,
    total_cost_burden: 95000,
  },
  explainedVariance: {
    labour_model_variance: 0,
    asset_model_variance: 0,
    asset_finance_variance: 0,
    depreciation_exclusion_variance: 0,
    employee_overhead_mapping_variance: 0,
    general_overhead_mapping_variance: 0,
    cost_of_sales_mapping_variance: 0,
    timing_variance: 0,
    rounding_variance: 0,
    unmapped_variance: 0,
  },
  notes: "Controlled helper export test.",
});

const stringified = stringifyLiveAuditSnapshotExport(snapshot);

const checks = [
  check("snapshot is object", true, isObject(snapshot)),
  check("snapshot_name", "Controlled Live Snapshot Export Test", snapshot.snapshot_name),
  check("snapshot_source", "qs_tools_app_export", snapshot.snapshot_source),
  check("snapshot_date", "2026-05-25", snapshot.snapshot_date),

  check("pnl exists", true, isObject(snapshot.pnl)),
  check("pnl_baseline_cost", 95000, snapshot.pnl.pnl_baseline_cost),
  check("pnl_labour_cost", 60000, snapshot.pnl.pnl_labour_cost),
  check("pnl_asset_cost", 12000, snapshot.pnl.pnl_asset_cost),
  check("pnl_general_overheads", 23000, snapshot.pnl.pnl_general_overheads),

  check("cost_summary exists", true, isObject(snapshot.cost_summary)),
  check(
    "total_people_cost_annual",
    60000,
    snapshot.cost_summary.total_people_cost_annual
  ),
  check(
    "total_asset_cost_annual",
    12000,
    snapshot.cost_summary.total_asset_cost_annual
  ),
  check(
    "total_business_overheads",
    23000,
    snapshot.cost_summary.total_business_overheads
  ),
  check("total_cost_burden", 95000, snapshot.cost_summary.total_cost_burden),

  check("explained_variance exists", true, isObject(snapshot.explained_variance)),
  check(
    "labour_model_variance",
    0,
    snapshot.explained_variance.labour_model_variance
  ),
  check(
    "asset_finance_variance",
    0,
    snapshot.explained_variance.asset_finance_variance
  ),

  check("notes", "Controlled helper export test.", snapshot.notes),
  check("stringified is string", "string", typeof stringified),
];

const passedChecks = checks.filter((item) => item.passed).length;
const failedChecks = checks.length - passedChecks;
const status = failedChecks === 0 ? "validated" : "failed_validation";

const report = {
  status,
  total_checks: checks.length,
  passed_checks: passedChecks,
  failed_checks: failedChecks,
  checks,
  snapshot,
};

console.log(JSON.stringify(report, null, 2));

if (status !== "validated") {
  process.exit(1);
}