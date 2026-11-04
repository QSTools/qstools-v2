// R3 slice 4 batch C3b (Business Modelling brief, Addendum 30 item 1b, Addendum 31). The one-line Rate Builder note for a group that holds a scenario hire.
// A scenario hire has its own scratch staff type, and a scratch type never has a saved charge-out rate, so Rate Builder (correctly) shows that group's labour as
// incomplete. The note says why, in place of silence and in place of an invented rate. PURE: no storage, no React. ASCII only.

import { SCRATCH_STAFF_TYPE_PREFIX } from "./scenarioAdds.js";

// Wording approved by the owner 2026-10-30 (Addendum 30 item 1b).
export const SCENARIO_HIRE_NOTE = "This group includes a scenario hire with no charge-out rate, so labour is shown as incomplete.";

// rows: the labour_breakdown.rows of one group (each has staff_type_id). True when any row is a scenario hire's own scratch staff type.
export function has_scenario_hire(rows) {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => typeof row?.staff_type_id === "string" && row.staff_type_id.startsWith(SCRATCH_STAFF_TYPE_PREFIX));
}
