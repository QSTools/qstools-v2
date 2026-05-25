/**
 * QS Tools — Download Live Audit Snapshot
 * v1.0
 *
 * Purpose:
 * Browser-side helper to download a QS Tools live audit snapshot JSON file.
 *
 * This is intentionally separate from buildLiveAuditSnapshotExport.js.
 * The builder creates the contract.
 * This helper downloads it from the browser.
 */

import {
  buildLiveAuditSnapshotExport,
  stringifyLiveAuditSnapshotExport,
} from "./buildLiveAuditSnapshotExport.js";

function buildDownloadFileName(snapshotDate) {
  const safeDate =
    typeof snapshotDate === "string" && snapshotDate.trim()
      ? snapshotDate.trim()
      : new Date().toISOString().slice(0, 10);

  return `qs-tools-live-audit-snapshot-${safeDate}.json`;
}

export function downloadTextFile({ fileName, text, mimeType = "application/json" }) {
  if (typeof window === "undefined") {
    return {
      success: false,
      error: "downloadTextFile can only run in the browser.",
    };
  }

  const blob = new Blob([text], { type: mimeType });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);

  return {
    success: true,
    fileName,
  };
}

export function downloadLiveAuditSnapshot({
  snapshotName = "Current QS Tools Audit Snapshot",
  snapshotSource = "qs_tools_app_export",
  snapshotDate = new Date().toISOString().slice(0, 10),
  pnlData = {},
  costSummaryData = {},
  explainedVariance = {},
  notes = "Built from QS Tools app-state export.",
} = {}) {
  const snapshot = buildLiveAuditSnapshotExport({
    snapshotName,
    snapshotSource,
    snapshotDate,
    pnlData,
    costSummaryData,
    explainedVariance,
    notes,
  });

  const text = stringifyLiveAuditSnapshotExport(snapshot);
  const fileName = buildDownloadFileName(snapshot.snapshot_date);

  const result = downloadTextFile({
    fileName,
    text,
    mimeType: "application/json",
  });

  return {
    ...result,
    snapshot,
  };
}