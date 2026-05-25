/**
 * QS Tools — Live Snapshot Download Helper Test
 * v1.0
 *
 * Purpose:
 * Validate that lib/audit/downloadLiveAuditSnapshot.js imports correctly
 * and behaves safely outside the browser.
 *
 * This test does not attempt an actual browser download.
 */

import { pathToFileURL } from "url";
import path from "path";

const projectRoot = process.cwd();

const helperPath = path.join(
  projectRoot,
  "lib",
  "audit",
  "downloadLiveAuditSnapshot.js"
);

const helperUrl = pathToFileURL(helperPath).href;

const importedModule = await import(helperUrl);

const { downloadLiveAuditSnapshot, downloadTextFile } = importedModule;

function check(name, expected, actual) {
  const passed = JSON.stringify(expected) === JSON.stringify(actual);

  return {
    name,
    expected,
    actual,
    passed,
  };
}

const serverSafeDownloadResult = downloadTextFile({
  fileName: "test.json",
  text: "{}",
});

const checks = [
  check("downloadLiveAuditSnapshot export type", "function", typeof downloadLiveAuditSnapshot),
  check("downloadTextFile export type", "function", typeof downloadTextFile),
  check("server-safe success false", false, serverSafeDownloadResult.success),
  check(
    "server-safe error",
    "downloadTextFile can only run in the browser.",
    serverSafeDownloadResult.error
  ),
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
};

console.log(JSON.stringify(report, null, 2));

if (status !== "validated") {
  process.exit(1);
}
