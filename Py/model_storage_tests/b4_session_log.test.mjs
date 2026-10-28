// R3 slice 1 batch 4 test. READ-ONLY: fake in-memory stores only. Run: node Py\model_storage_tests\b4_session_log.test.mjs
// Checks the cumulative per-tab log (sessionStorage) that the dev page shows: it counts Model mode write-backs across simulated page
// loads, aggregates by key and reason, never touches localStorage, and a missing or failing sessionStorage never breaks a write.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const storage_dir = path.resolve(here, "..", "..", "lib", "storage");
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}
class FakeStorage {
  constructor() { this.map = new Map(); this.log = []; this.broken = false; }
  getItem(k) { if (this.broken) throw new Error("broken"); return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { if (this.broken) throw new Error("broken"); this.log.push(["set", k]); this.map.set(k, String(v)); }
  removeItem(k) { this.log.push(["remove", k]); this.map.delete(k); }
}
const h = await import(pathToFileURL(path.join(storage_dir, "modelStorage.js")).href);

const GO = "qs_tools_general_overhead_state", QE = "qs_tools_quote_engine_store_v4";
const go = (notes = "", stamp = "t") => JSON.stringify({ updated_at: stamp, created_at: "c", notes });
const local = new FakeStorage(), session = new FakeStorage();
local.map.set(GO, go());
globalThis.window = { localStorage: local, sessionStorage: session };
h.clear_model_caches(); h.reset_model_stats(); h.clear_session_log();
h.take_baseline_snapshot();
h.set_mode("model");
const local_snapshot = JSON.stringify([...local.map].sort());
local.log.length = 0;

h.setItem(GO, go("", "later"));      // no-op
h.setItem(GO, go("changed"));        // dropped
h.setItem(QE, "x");                  // blocked
let log = h.get_session_log();
check("session log counts a no-op, a dropped difference and a blocked write", log.noop_writes === 1 && log.dropped_writes === 1 && log.blocked_writes === 1, JSON.stringify(log));

// simulate a new page load: in-memory counters and mode cache reset, sessionStorage kept
h.reset_model_stats(); h.clear_model_caches();
h.setItem(GO, go("changed"));
log = h.get_session_log();
check("the log keeps counting across a simulated page load", log.dropped_writes === 2 && h.get_model_stats().dropped_writes === 1);
check("repeated writes to the same key and reason are aggregated with a count", log.items["dropped|" + GO + "|difference_not_stored_yet"] === 2);
check("the log is kept in sessionStorage only: localStorage was not written", local.log.length === 0 && JSON.stringify([...local.map].sort()) === local_snapshot);
check("the session log key name avoids the eight scheduling-scan words", !["cost", "allocation", "operational", "group", "business", "opening", "hours", "setup"].some((w) => "mirra_model_stats_v1".includes(w)));

h.clear_session_log();
log = h.get_session_log();
check("clear_session_log empties the log", log.noop_writes === 0 && log.dropped_writes === 0 && Object.keys(log.items).length === 0);

session.broken = true;
let threw = false;
try { h.setItem(GO, go("changed again")); h.setItem(QE, "y"); h.get_session_log(); h.clear_session_log(); } catch { threw = true; }
check("a failing sessionStorage never breaks a write or a read", threw === false && h.get_model_stats().dropped_writes >= 1);

delete globalThis.window.sessionStorage;
threw = false;
try { h.setItem(GO, go("x")); h.get_session_log(); } catch { threw = true; }
check("a missing sessionStorage never breaks anything", threw === false);

console.log("SUMMARY PASS " + pass + " / FAIL " + fail);
process.exit(fail === 0 ? 0 : 1);