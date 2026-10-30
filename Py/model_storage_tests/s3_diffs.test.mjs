// R3 slice 3 batch 1 test. READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\s3_diffs.test.mjs
// Checks: the per-key cache in modelStorage.js (a warm read touches no storage, equals a cold read, is cleared by a mode change, a baseline
// copy and clear_model_caches), the write-back comparison still treats volatile fields and first-visit defaults as no difference, and
// modelDiffs.js (baseline mode reads nothing, set/remove/replace a nudge, validation, only mirra_diffs_v1 is written, real keys and baseline
// entries stay byte-identical, generation and the baseline_changed flag, storage full leaves the layer as it was, unknown by_key entries
// survive a write, file stays under 600 lines). Exit code 0 only if every check passes.
import fs from "node:fs";
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
  constructor(capacity = Infinity) { this.map = new Map(); this.capacity = capacity; this.log = []; this.reads = 0; }
  used() { let n = 0; for (const [k, v] of this.map) n += k.length + v.length; return n; }
  getItem(k) { this.reads += 1; return this.map.has(k) ? this.map.get(k) : null; }
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
const L = await import(pathToFileURL(path.join(storage_dir, "modelBaselineLock.js")).href);
const D = await import(pathToFileURL(path.join(storage_dir, "modelDiffs.js")).href);

const GO = "qs_tools_general_overhead_state", PNL = "qs_tools_profit_and_loss_state", DEFAULT_KEY = "qs_tools_fixed_asset_register_state_v1";
const go_value = (stamp = "2026-01-01T00:00:00.000Z", profile = "p1") => JSON.stringify({
  overhead_profile_id: profile, vehicle_running_cost_annual: 38700, custom_overhead_items: [{ id: "c1", amount: 10 }],
  created_at: "2026-01-01T00:00:00.000Z", updated_at: stamp,
});
const pnl_value = () => JSON.stringify({ revenue: 1000 });
const real_data = () => ({ [GO]: go_value(), [PNL]: pnl_value() });
const ready = () => ({ loaded: true, overall_status: "ready", blocking_count: 0, warning_count: 0, checked_at: "2026-10-30T00:00:00.000Z" });

function fresh(capacity = Infinity, data = real_data()) {
  const s = new FakeStorage(capacity);
  for (const [k, v] of Object.entries(data)) s.map.set(k, v);
  globalThis.window = { localStorage: s };
  h.clear_model_caches();
  h.reset_model_stats();
  return s;
}
function lock_and_enter_model(s) {
  const r = L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
  const m = h.set_mode("model");
  return r.ok === true && m.ok === true;
}
const real_only = (s) => new Map([...s.map].filter(([k]) => !k.startsWith("mirra_")));
const baseline_only = (s) => new Map([...s.map].filter(([k]) => k.startsWith("mirra_baseline_v1")));
const same_map = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// 1. Baseline mode: nothing is read, nothing is cached
let s = fresh();
s.reads = 0; s.log.length = 0;
h.set_mode("baseline");
s.reads = 0; s.log.length = 0;
let n = D.get_overhead_nudges();
check("baseline mode: get_overhead_nudges is empty and reads no storage beyond the (cached) mode key", Object.keys(n).length === 0 && s.reads <= 1, "reads " + s.reads);
s.reads = 0;
D.get_overhead_nudges(); D.get_overhead_nudges();
check("baseline mode: repeated calls read no storage at all", s.reads === 0, "reads " + s.reads);
let r = D.set_overhead_nudge("office_admin", 5);
check("set_overhead_nudge refused in baseline mode, nothing written", r.ok === false && r.reason === "not_model_mode" && s.log.length === 0, JSON.stringify(r));

// 2. Model mode needs a locked baseline; set before lock is refused
s = fresh();
check("set_overhead_nudge refused with no baseline (mode is baseline), nothing written", D.set_overhead_nudge("office_admin", 5).ok === false && s.log.length === 0);

// 3. per-key cache in Model mode
s = fresh();
check("setup: lock and Model mode", lock_and_enter_model(s));
const baseline_before = baseline_only(s), real_before = real_only(s);
const cold = h.getItem(GO);
check("cold read returns the baseline entry byte for byte", cold === go_value());
s.reads = 0;
const warm = h.getItem(GO);
check("warm read equals the cold read", warm === cold);
check("warm read touches no storage (cache hit)", s.reads === 0, "reads " + s.reads);
s.reads = 0;
for (let i = 0; i < 200; i += 1) h.getItem(GO);
check("200 more reads of one key touch no storage", s.reads === 0, "reads " + s.reads);
check("a modelled key the baseline holds as absent reads null, and that is cached too", h.getItem(DEFAULT_KEY) === null && (() => { s.reads = 0; h.getItem(DEFAULT_KEY); return s.reads === 0; })());
check("unregistered key is still read-through (not cached)", (() => { s.map.set("other_key", "x"); s.reads = 0; const v = h.getItem("other_key"); return v === "x" && s.reads === 1; })());

// 4. write-back comparison with the cache
s.log.length = 0; h.reset_model_stats();
h.setItem(GO, go_value("2027-02-02T00:00:00.000Z"));
check("write-back differing only in updated_at is a no-op (counted noop, nothing written)", s.log.length === 0 && h.get_model_stats().noop_writes === 1 && h.get_model_stats().dropped_writes === 0);
h.setItem(GO, go_value("2027-03-03T00:00:00.000Z", "regenerated-profile-id"));
check("write-back with a regenerated overhead_profile_id is a no-op", s.log.length === 0 && h.get_model_stats().noop_writes === 2 && h.get_model_stats().dropped_writes === 0);
h.setItem(GO, JSON.stringify({ ...JSON.parse(go_value()), vehicle_running_cost_annual: 40000 }));
check("a real change is still discarded and counted (slice 3 stores only the nudge), nothing written", s.log.length === 0 && h.get_model_stats().dropped_writes === 1 && h.get_model_stats().dropped[0].reason === "difference_not_stored_yet");
h.reset_model_stats();
h.setItem(DEFAULT_KEY, JSON.stringify({ assets: [], updated_at: "x" }));
check("F6: a module default written to a key the baseline holds as absent is dropped as baseline_absent, never created", s.log.length === 0 && h.get_model_stats().dropped[0].reason === "baseline_absent" && !s.map.has(DEFAULT_KEY));
s.map.delete("other_key");
check("cache did not change any real key or baseline entry", same_map(real_only(s), real_before) && same_map(baseline_only(s), baseline_before));

// 5. cache is cleared when told to
s.map.set("mirra_baseline_v1_m15", go_value("2030-01-01T00:00:00.000Z", "changed-elsewhere").replace("38700", "39999"));
check("before clearing, the cached value is still served", h.getItem(GO) === go_value());
h.clear_model_caches();
check("after clear_model_caches the new baseline value is read", h.getItem(GO).includes("39999"));

// 6. take_baseline_snapshot and set_mode clear the cache
s = fresh();
lock_and_enter_model(s);
h.getItem(GO);
h.set_mode("baseline");
s.map.set(GO, go_value("2026-05-05T00:00:00.000Z").replace("38700", "41000"));
L.unlock_baseline({ confirmed: true });
const relock = L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
h.set_mode("model");
check("after unlock, edit, relock and Model mode the baseline read shows the corrected value (cache cleared)", relock.ok === true && h.getItem(GO).includes("41000"));

// 7. nudges in Model mode
s = fresh();
lock_and_enter_model(s);
const baseline_snap = baseline_only(s), real_snap = real_only(s);
s.log.length = 0;
r = D.set_overhead_nudge("office_admin", 5);
check("set a +5 nudge", r.ok === true && r.nudges.office_admin.pct === 5 && r.nudges.office_admin.flag === "", JSON.stringify(r));
check("the only key written is mirra_diffs_v1", s.log.length === 1 && s.log[0][1] === "mirra_diffs_v1", JSON.stringify(s.log));
check("real keys and baseline entries are byte-identical after the nudge", same_map(real_only(s), real_snap) && same_map(baseline_only(s), baseline_snap));
let stored = JSON.parse(s.getItem("mirra_diffs_v1"));
check("stored shape: version 1, generation 1, one record with path, kind pct, value, empty flag", stored.version === 1 && stored.generation === 1 && JSON.stringify(stored.by_key[GO]) === JSON.stringify([{ path: "category:office_admin", kind: "pct", value: 5, flag: "" }]), JSON.stringify(stored));
s.reads = 0;
const again = D.get_overhead_nudges();
const again2 = D.get_overhead_nudges();
check("a warm get_overhead_nudges touches no storage and returns the same object", s.reads === 0 && again === again2);
r = D.set_overhead_nudge("office_admin", 7.5);
stored = JSON.parse(s.getItem("mirra_diffs_v1"));
check("setting the same category again replaces, never duplicates", stored.by_key[GO].length === 1 && stored.by_key[GO][0].value === 7.5 && D.get_overhead_nudges().office_admin.pct === 7.5);
D.set_overhead_nudge("facilities_premises", -10);
stored = JSON.parse(s.getItem("mirra_diffs_v1"));
check("two categories stack side by side, sorted by path", stored.by_key[GO].map((x) => x.path).join() === "category:facilities_premises,category:office_admin");
check("both nudges are served", D.get_overhead_nudges().facilities_premises.pct === -10 && D.get_overhead_nudges().office_admin.pct === 7.5);
r = D.set_overhead_nudge("office_admin", 0);
check("setting 0 removes that category's nudge", r.ok === true && D.get_overhead_nudges().office_admin === undefined && D.get_overhead_nudges().facilities_premises.pct === -10);
D.set_overhead_nudge("facilities_premises", 0);
stored = JSON.parse(s.getItem("mirra_diffs_v1"));
check("removing the last nudge leaves an empty by_key (an empty layer)", Object.keys(stored.by_key).length === 0 && Object.keys(D.get_overhead_nudges()).length === 0);

// 8. validation writes nothing
s.log.length = 0;
const bad = [["office_admin", 1001], ["office_admin", -100.01], ["office_admin", NaN], ["office_admin", "abc"], ["office_admin", ""], ["office_admin", null], ["office_admin", undefined], ["", 5], [null, 5], ["x".repeat(81), 5]];
check("invalid category or percentage is refused, nothing written", bad.every(([c, p]) => { const x = D.set_overhead_nudge(c, p); return x.ok === false && typeof x.message === "string" && x.message.length > 0; }) && s.log.length === 0);
check("limits are allowed: -100 and 1000", D.set_overhead_nudge("a_cat", -100).ok === true && D.set_overhead_nudge("b_cat", 1000).ok === true);
check("percentage is rounded to 2 decimals", D.set_overhead_nudge("c_cat", 1.239).ok === true && D.get_overhead_nudges().c_cat.pct === 1.24);

// 9. an external change is seen after the caches are cleared
s.map.set("mirra_diffs_v1", JSON.stringify({ version: 1, generation: 1, by_key: { [GO]: [{ path: "category:travel", kind: "pct", value: 3, flag: "" }] } }));
check("before clearing, the cached nudges are served", D.get_overhead_nudges().travel === undefined);
h.clear_model_caches();
check("clear_model_caches also clears the nudge cache (another tab's change is seen)", D.get_overhead_nudges().travel.pct === 3);

// 10. unknown by_key entries survive a write
s.map.set("mirra_diffs_v1", JSON.stringify({ version: 1, generation: 1, by_key: { [PNL]: [{ path: "x", kind: "set", value: 1 }], [GO]: [] } }));
h.clear_model_caches();
D.set_overhead_nudge("travel", 2);
stored = JSON.parse(s.getItem("mirra_diffs_v1"));
check("an entry for another key survives a nudge write (no field dropping)", Array.isArray(stored.by_key[PNL]) && stored.by_key[PNL][0].kind === "set" && stored.by_key[GO].length === 1);

// 11. generation and the baseline_changed flag
s = fresh();
lock_and_enter_model(s);
D.set_overhead_nudge("travel", 4);
h.set_mode("baseline");
L.unlock_baseline({ confirmed: true });
s.map.set(GO, go_value("2026-06-06T00:00:00.000Z").replace("38700", "50000"));
L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
h.set_mode("model");
check("baseline relocked (generation 2): the nudge is kept and flagged baseline_changed", D.get_overhead_nudges().travel.pct === 4 && D.get_overhead_nudges().travel.flag === "baseline_changed", JSON.stringify(D.get_overhead_nudges()));
D.set_overhead_nudge("travel", 4);
check("changing the layer re-stamps the generation and clears the flag", JSON.parse(s.getItem("mirra_diffs_v1")).generation === 2 && D.get_overhead_nudges().travel.flag === "");

// 12. storage full leaves the layer exactly as it was
s = fresh();
lock_and_enter_model(s);
D.set_overhead_nudge("travel", 4);
const diffs_before = s.getItem("mirra_diffs_v1");
s.capacity = s.used();
r = D.set_overhead_nudge("office_admin", 9);
check("storage full: refused with the stopgap message and the layer is unchanged", r.ok === false && r.reason === "storage_full" && r.message === h.MODEL_STORAGE_FULL_MESSAGE && s.getItem("mirra_diffs_v1") === diffs_before);
check("storage full: the cache still serves the old layer", D.get_overhead_nudges().travel.pct === 4 && D.get_overhead_nudges().office_admin === undefined);

// 13. set_mode(model) still creates the empty layer, and an empty layer reads as no nudges
s = fresh();
lock_and_enter_model(s);
check("entering Model mode creates mirra_diffs_v1 empty, and it reads as no nudges", JSON.stringify(JSON.parse(s.getItem("mirra_diffs_v1"))) === JSON.stringify({ version: 1, by_key: {} }) && Object.keys(D.get_overhead_nudges()).length === 0);

// 13b. subscribers
s = fresh();
lock_and_enter_model(s);
let heard = 0;
const stop = D.subscribe_to_diffs(() => { heard += 1; });
D.set_overhead_nudge("travel", 3);
check("a subscriber is told once after a successful write", heard === 1);
D.set_overhead_nudge("travel", 1001);
check("a refused write tells nobody", heard === 1);
D.subscribe_to_diffs(() => { throw new Error("broken subscriber"); });
check("a broken subscriber does not fail the write or stop the others", D.set_overhead_nudge("travel", 4).ok === true && heard === 2);
stop();
D.set_overhead_nudge("travel", 5);
check("after unsubscribing the callback is not called again", heard === 2);
check("a subscriber that reads on the call sees the new value", (() => { let seen = null; D.subscribe_to_diffs(() => { seen = D.get_overhead_nudges().travel.pct; }); D.set_overhead_nudge("travel", 6); return seen === 6; })());

// 14. size
const lines = fs.readFileSync(path.join(storage_dir, "modelDiffs.js"), "utf8").split("\n").length;
check("modelDiffs.js stays under 600 lines (" + lines + ")", lines < 600);
const store_lines = fs.readFileSync(path.join(storage_dir, "modelStorage.js"), "utf8").split("\n").length;
console.log("INFO: modelStorage.js is " + store_lines + " lines (it was 414 before slice 3)");

console.log("\n" + pass + " of " + (pass + fail) + " passed");
process.exit(fail === 0 ? 0 : 1);
