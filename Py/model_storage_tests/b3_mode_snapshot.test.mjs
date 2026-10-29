// R3 slice 1 batch 3 test. READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\b3_mode_snapshot.test.mjs
// Checks: Model mode off = pass-through; mode switch refused without a baseline; all-or-nothing baseline snapshot (byte for byte,
// quota failure rolls back); Model mode reads the baseline and never the real key; Model mode writes reach NO storage key
// (volatile-only write-backs are no-ops, real differences are discarded and counted, unmodelled and unregistered keys are blocked).
// Exit code 0 only if every check passes.
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
  constructor(capacity = Infinity) { this.map = new Map(); this.capacity = capacity; this.log = []; }
  used() { let n = 0; for (const [k, v] of this.map) n += k.length + v.length; return n; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) {
    const value = String(v);
    const old = this.map.has(k) ? k.length + this.map.get(k).length : 0;
    if (this.used() - old + k.length + value.length > this.capacity) {
      const e = new Error("quota exceeded"); e.name = "QuotaExceededError"; throw e;
    }
    this.log.push(["set", k]); this.map.set(k, value);
  }
  removeItem(k) { this.log.push(["remove", k]); this.map.delete(k); }
}

const h = await import(pathToFileURL(path.join(storage_dir, "modelStorage.js")).href);
const reg = await import(pathToFileURL(path.join(storage_dir, "modelStorageRegistry.js")).href);

const GO = "qs_tools_general_overhead_state", PNL = "qs_tools_profit_and_loss_state", AST = "qs_tools_asset_state";
const QE = "qs_tools_quote_engine_store_v4", OTHER = "some_unregistered_key";
const go_value = (notes = "", stamp = "2026-01-01T00:00:00.000Z") => JSON.stringify({
  overhead_profile_id: "p1", vehicle_running_cost_annual: 38700, custom_overhead_items: [{ id: "c1", amount: 10 }],
  created_at: "2026-01-01T00:00:00.000Z", updated_at: stamp, notes,
});
const pnl_value = (pad = "") => JSON.stringify({ revenue: 1000, pad });

function fresh(capacity = Infinity, data = {}) {
  const s = new FakeStorage(capacity);
  for (const [k, v] of Object.entries(data)) s.map.set(k, v);
  globalThis.window = { localStorage: s };
  h.clear_model_caches();
  h.reset_model_stats();
  return s;
}
const entries_of = (s, prefix) => [...s.map].filter(([k]) => k.startsWith(prefix)).sort(([a], [b]) => (a < b ? -1 : 1));
const same_map = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const real_data = () => ({ [GO]: go_value(), [PNL]: pnl_value(), [QE]: "{\"quote\":1}", [OTHER]: "plain" });

// 1. mode off = pass-through, and no mirra key is ever created by plain use
let s = fresh(Infinity, real_data());
h.setItem(GO, "v"); h.setItem("zzz", "q"); h.removeItem("zzz");
check("mode off: get returns the stored value, set stores it, remove removes it", h.getItem(GO) === "v" && s.getItem("zzz") === null);
check("mode off: no mirra_ key is created and the mode key is not written", [...s.map.keys()].every((k) => !k.startsWith("mirra_")) && s.log.every(([, k]) => !k.startsWith("mirra_")));
check("mode off: get_mode is baseline", h.get_mode() === "baseline");

// 2. switch refused without a baseline
s = fresh(Infinity, real_data());
let r = h.set_mode("model");
check("set_mode(model) is refused with no baseline", r.ok === false && r.reason === "no_baseline" && /baseline/i.test(r.message));
check("a refused switch writes nothing and the mode stays baseline", s.log.length === 0 && h.get_mode() === "baseline");
check("set_mode with a bad value is refused", h.set_mode("sideways").ok === false);

// 3. snapshot: byte for byte, only baseline keys written, real data untouched
s = fresh(Infinity, real_data());
const before_real = new Map(s.map);
r = h.take_baseline_snapshot();
check("snapshot succeeds", r.ok === true, JSON.stringify(r));
check("snapshot copied the 2 present modelled keys and 26 absent", r.entries === 2 && r.absent === 26, JSON.stringify(r));
check("each baseline entry equals its source key byte for byte", s.getItem("mirra_baseline_v1_m15") === before_real.get(GO) && s.getItem("mirra_baseline_v1_m21") === before_real.get(PNL));
const meta = JSON.parse(s.getItem("mirra_baseline_v1"));
check("meta lists present and absent codes covering all 28, registry_version 1, locked false", meta.codes.length === 2 && meta.absent_codes.length === 26 && meta.registry_version === 1 && meta.locked === false && meta.version === 1);
check("every storage write of the snapshot is a baseline key (no real key written)", s.log.every(([, k]) => k.startsWith("mirra_baseline_v1")));
check("real keys are byte-identical after the snapshot", same_map(new Map([...s.map].filter(([k]) => !k.startsWith("mirra_"))), before_real));
check("has_complete_baseline is true after a snapshot", h.has_complete_baseline() === true);

// 4. switch to model mode
r = h.set_mode("model");
check("set_mode(model) is refused on an unlocked baseline (slice 2)", r.ok === false && r.reason === "baseline_not_locked", JSON.stringify(r));
r = h.take_baseline_snapshot({ locked: true, source: "lock", generation: 1 });
check("a locking snapshot succeeds and the meta says locked (slice 2)", r.ok === true && JSON.parse(s.getItem("mirra_baseline_v1")).locked === true);
r = h.set_mode("model");
check("set_mode(model) succeeds with a locked baseline", r.ok === true && h.get_mode() === "model");
check("the mode key records model", JSON.parse(s.getItem("mirra_mode_v1")).mode === "model");
check("empty differences and scenarios keys are created", s.getItem("mirra_diffs_v1") === JSON.stringify({ version: 1, by_key: {} }) && s.getItem("mirra_scenarios_v1") === JSON.stringify({ version: 1, items: [] }));
r = h.take_baseline_snapshot();
check("snapshot is refused while Model mode is on", r.ok === false && r.reason === "model_mode_active");

// 5. Model mode reads the baseline, never the real key
s.map.set(GO, go_value("edited later in real data")); s.map.set(AST, "{\"a\":1}");
check("model read of a modelled key returns the BASELINE, not the later real value", h.getItem(GO) === before_real.get(GO));
check("model read of a modelled key absent from the baseline is null even if the real key exists", h.getItem(AST) === null);
check("model read of an unmodelled key passes through to the real key", h.getItem(QE) === "{\"quote\":1}");
check("model read of an unregistered key passes through", h.getItem(OTHER) === "plain");

// 6. Model mode writes reach no storage key
const snapshot_before_writes = new Map(s.map);
s.log.length = 0; h.reset_model_stats();
h.setItem(GO, go_value("", "2099-12-31T00:00:00.000Z"));
check("volatile-only write-back (new updated_at) is a no-op", h.get_model_stats().noop_writes === 1 && h.get_model_stats().dropped_writes === 0);
h.setItem(GO, go_value("a real change"));
check("a real difference is discarded and counted", h.get_model_stats().dropped_writes === 1 && h.get_model_stats().dropped[0].key === GO);
h.setItem(QE, "x"); h.setItem(OTHER, "y");
check("writes to an unmodelled and an unregistered key are blocked and counted", h.get_model_stats().blocked_writes === 2);
h.setItem(AST, "{}");
check("a write to a modelled key absent from the baseline is dropped, not created", h.get_model_stats().dropped_writes === 2 && h.get_model_stats().dropped[1].reason === "baseline_absent");
h.removeItem(GO);
check("a remove in Model mode is discarded and counted", h.get_model_stats().dropped_writes === 3);
check("NO storage write or remove happened during Model mode writes", s.log.length === 0, JSON.stringify(s.log));
check("storage is byte-identical after the Model mode writes (real, baseline, diffs, scenarios)", same_map(s.map, snapshot_before_writes));
check("window.__mirra_model_stats mirrors the counters", globalThis.window.__mirra_model_stats && globalThis.window.__mirra_model_stats.dropped_writes === 3);

// 7. back to baseline mode: real values are read again
r = h.set_mode("baseline");
check("set_mode(baseline) succeeds and real values are read again", r.ok === true && h.getItem(GO) === go_value("edited later in real data"));

// 8. quota: all-or-nothing rollback
s = fresh(Infinity, real_data());
h.take_baseline_snapshot();
const baseline_before = entries_of(s, "mirra_");
const pad = "x".repeat(3000);
s.map.set(GO, go_value(pad)); s.map.set(PNL, pnl_value(pad));
s.capacity = s.used() + 3200;
s.log.length = 0;
r = h.take_baseline_snapshot();
check("a copy that runs out of room stops with the plain message", r.ok === false && r.reason === "storage_full" && r.message === "This business is too large for Model mode until the database arrives", JSON.stringify(r));
check("the failed copy left every baseline key exactly as before (no partial baseline)", JSON.stringify(entries_of(s, "mirra_")) === JSON.stringify(baseline_before));
check("the failed copy did write something first (so the rollback was really exercised)", s.log.some(([op, k]) => op === "set" && k === "mirra_baseline_v1_m15"));
check("the previous baseline is still complete", h.has_complete_baseline() === true);

// 9. a later copy picks up changes, drops stale entries
s = fresh(Infinity, real_data());
h.take_baseline_snapshot();
s.map.delete(PNL); s.map.set(GO, go_value("changed"));
r = h.take_baseline_snapshot();
check("second copy: updated entry, removed stale entry, absent list updated", r.ok === true && s.getItem("mirra_baseline_v1_m15") === go_value("changed") && s.getItem("mirra_baseline_v1_m21") === null && JSON.parse(s.getItem("mirra_baseline_v1")).absent_codes.includes("m21"));

// 10. a baseline with a missing entry is not complete
s = fresh(Infinity, real_data());
h.take_baseline_snapshot();
s.map.delete("mirra_baseline_v1_m15");
check("has_complete_baseline is false if a listed entry is missing", h.has_complete_baseline() === false);
check("set_mode(model) is refused on an incomplete baseline", h.set_mode("model").ok === false);

console.log("SUMMARY PASS " + pass + " / FAIL " + fail);
process.exit(fail === 0 ? 0 : 1);