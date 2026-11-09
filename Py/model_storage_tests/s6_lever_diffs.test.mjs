// R3 slice 5 lever batch L1 test (Business Modelling brief, Addendum 53). READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\s6_lever_diffs.test.mjs
// Checks: modelLeverDiffs.js (baseline mode reads nothing and refuses writes, Model mode needs a locked baseline, set / update / remove a rate move and the
// materials markup move, the stored shape, only mirra_diffs_v1 is written, real keys and baseline entries stay byte identical, validation, the merge at the
// two Rate Builder reads by spreading, the baseline_changed flag per record, nudges and lever records survive each other's writes with every field
// (the field-dropping check, project rule 6b), unknown entries survive, storage full leaves the layer as it was, listeners are told, pure helpers,
// file sizes). Exit code 0 only if every check passes.
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
  constructor(capacity = Infinity) { this.map = new Map(); this.capacity = capacity; this.log = []; this.reads = 0; this.read_keys = []; }
  used() { let n = 0; for (const [k, v] of this.map) n += k.length + v.length; return n; }
  getItem(k) { this.reads += 1; this.read_keys.push(k); return this.map.has(k) ? this.map.get(k) : null; }
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
const V = await import(pathToFileURL(path.join(storage_dir, "modelLeverDiffs.js")).href);
const RS = await import(pathToFileURL(path.join(storage_dir, "rateBuilderLabourSourceRatesStorage.js")).href);
const MS = await import(pathToFileURL(path.join(storage_dir, "rateBuilderMaterialsMarkupStorage.js")).href);

const GO = "qs_tools_general_overhead_state", PNL = "qs_tools_profit_and_loss_state";
const RATE = "qstools_rate_builder_labour_source_rates_v1", MARKUP = "qstools_rate_builder_materials_markup_v1", DIFFS = "mirra_diffs_v1";
const NOW = "2026-11-09T01:00:00.000Z", LATER = "2026-11-09T02:00:00.000Z";
const go_value = () => JSON.stringify({
  overhead_profile_id: "p1", vehicle_running_cost_annual: 38700, custom_overhead_items: [{ id: "c1", amount: 10 }],
  created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z",
});
const rate_value = () => JSON.stringify({ S01: 90, S02: 100 });
const markup_value = () => JSON.stringify({ materials_markup_percent: 10 });
const real_data = () => ({ [GO]: go_value(), [PNL]: JSON.stringify({ revenue: 1000 }), [RATE]: rate_value(), [MARKUP]: markup_value() });
const ready = () => ({ loaded: true, overall_status: "ready", blocking_count: 0, warning_count: 0, checked_at: "2026-10-30T00:00:00.000Z" });

function fresh(capacity = Infinity, data = real_data()) {
  const s = new FakeStorage(capacity);
  for (const [k, v] of Object.entries(data)) s.map.set(k, v);
  globalThis.window = { localStorage: s };
  h.clear_model_caches();
  h.reset_model_stats();
  return s;
}
function lock_and_enter_model() {
  const r = L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
  const m = h.set_mode("model");
  return r.ok === true && m.ok === true;
}
const real_only = (s) => new Map([...s.map].filter(([k]) => !k.startsWith("mirra_")));
const baseline_only = (s) => new Map([...s.map].filter(([k]) => k.startsWith("mirra_baseline_v1")));
const same_map = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const stored = (s) => (s.map.has(DIFFS) ? JSON.parse(s.map.get(DIFFS)) : null);
const lock_stamp = (s) => JSON.parse(s.map.get("mirra_baseline_v1")).locked_at;
const only_diffs_written = (s) => s.log.every(([, k]) => k === DIFFS);

// 1. Baseline mode: nothing is read, nothing is written, the readers are unchanged
let s = fresh();
h.set_mode("baseline");
s.reads = 0; s.read_keys.length = 0; s.log.length = 0;
check("baseline: get_rate_deltas is empty and get_markup_delta is null", Object.keys(V.get_rate_deltas()).length === 0 && V.get_markup_delta() === null);
check("baseline: the getters read no mirra_diffs_v1 and no meta", !s.read_keys.includes(DIFFS) && !s.read_keys.includes("mirra_baseline_v1"), s.read_keys.join(","));
let r = V.set_rate_delta("S01", 5, NOW);
check("baseline: set_rate_delta refused (not_model_mode), nothing written", r.ok === false && r.reason === "not_model_mode" && s.log.length === 0, JSON.stringify(r));
r = V.set_markup_delta(2, NOW);
check("baseline: set_markup_delta refused (not_model_mode), nothing written", r.ok === false && r.reason === "not_model_mode" && s.log.length === 0, JSON.stringify(r));
check("baseline: the rate reader returns the stored map exactly", JSON.stringify(RS.readRateBuilderLabourSourceRates()) === rate_value());
check("baseline: the markup reader returns the stored state exactly", JSON.stringify(MS.readRateBuilderMaterialsMarkup()) === markup_value());

// 2. Model mode needs a locked baseline
s = fresh();
check("no baseline: set_rate_delta refused, nothing written", V.set_rate_delta("S01", 5, NOW).ok === false && s.log.length === 0);

// 3. Model mode: set a rate move
s = fresh();
check("setup: lock and Model mode", lock_and_enter_model());
const real_before = real_only(s), baseline_before = baseline_only(s);
s.log.length = 0;
r = V.set_rate_delta("S01", 5, NOW);
check("set_rate_delta ok", r.ok === true, JSON.stringify(r));
check("only mirra_diffs_v1 was written", s.log.length === 1 && only_diffs_written(s), JSON.stringify(s.log));
check("real keys and baseline entries are byte identical", same_map(real_only(s), real_before) && same_map(baseline_only(s), baseline_before));
let d = stored(s);
const expect_rate = { path: "rate:S01", kind: "delta", value: 5, flag: "", created_at: NOW, locked_at: lock_stamp(s) };
check("stored shape: version 1 and the exact record under the rate key", d && d.version === 1 && JSON.stringify(d.by_key[RATE]) === JSON.stringify([expect_rate]), JSON.stringify(d));
check("locked_at equals the baseline meta locked_at and is not empty", expect_rate.locked_at !== "" && d.by_key[RATE][0].locked_at === expect_rate.locked_at);
check("get_rate_deltas returns the delta with no flag", V.get_rate_deltas().S01 && V.get_rate_deltas().S01.delta === 5 && V.get_rate_deltas().S01.flag === "");
check("the rate reader merges: S01 90 + 5 = 95, S02 untouched", JSON.stringify(RS.readRateBuilderLabourSourceRates()) === JSON.stringify({ S01: 95, S02: 100 }), JSON.stringify(RS.readRateBuilderLabourSourceRates()));
check("the markup reader is unchanged with no markup move", JSON.stringify(MS.readRateBuilderMaterialsMarkup()) === markup_value());

// 4. baseline mode again: the record stays stored but nothing merges and the diffs key is not read
h.set_mode("baseline");
s.read_keys.length = 0;
check("baseline again: the rate reader returns the stored baseline map", JSON.stringify(RS.readRateBuilderLabourSourceRates()) === rate_value());
check("baseline again: mirra_diffs_v1 is not read", !s.read_keys.includes(DIFFS));
check("baseline again: the record is still stored", stored(s).by_key[RATE].length === 1);
h.set_mode("model");

// 5. A second move updates, keeps created_at, re-stamps locked_at; zero removes
r = V.set_rate_delta("S01", 7.456, LATER);
let rec = stored(s).by_key[RATE];
check("second move: still one record, value rounded to 7.46, created_at kept", r.ok === true && rec.length === 1 && rec[0].value === 7.46 && rec[0].created_at === NOW, JSON.stringify(rec));
check("second move: the merged rate is 97.46", RS.readRateBuilderLabourSourceRates().S01 === 97.46);
r = V.set_rate_delta("S02", -10, LATER);
rec = stored(s).by_key[RATE];
check("second source: two records sorted by path", r.ok === true && rec.length === 2 && rec[0].path === "rate:S01" && rec[1].path === "rate:S02");
r = V.set_rate_delta("S01", 0, LATER);
rec = stored(s).by_key[RATE];
check("zero removes that record and leaves the other", r.ok === true && rec.length === 1 && rec[0].path === "rate:S02", JSON.stringify(rec));
r = V.set_rate_delta("S02", 0, LATER);
check("removing the last record removes the by_key entry", r.ok === true && !(RATE in stored(s).by_key), JSON.stringify(stored(s)));
check("after removal the reader returns the baseline map", JSON.stringify(RS.readRateBuilderLabourSourceRates()) === rate_value());

// 6. Merge edges
V.set_rate_delta("S99", 3, NOW);
check("a delta for a source with no stored rate is kept but not applied", stored(s).by_key[RATE].length === 1 && RS.readRateBuilderLabourSourceRates().S99 === undefined && Object.keys(RS.readRateBuilderLabourSourceRates()).length === 2);
V.set_rate_delta("S99", 0, NOW);
V.set_rate_delta("S01", -500, NOW);
check("a merged rate never goes below 0", RS.readRateBuilderLabourSourceRates().S01 === 0);
V.set_rate_delta("S01", 0, NOW);

// 7. Materials markup
s.log.length = 0;
r = V.set_markup_delta(2.5, NOW);
check("set_markup_delta ok and only mirra_diffs_v1 written", r.ok === true && s.log.length === 1 && only_diffs_written(s), JSON.stringify(r));
d = stored(s);
check("markup stored shape", JSON.stringify(d.by_key[MARKUP]) === JSON.stringify([{ path: "markup:materials", kind: "delta", value: 2.5, flag: "", created_at: NOW, locked_at: lock_stamp(s) }]), JSON.stringify(d));
check("the markup reader merges: 10 + 2.5 = 12.5", MS.readRateBuilderMaterialsMarkup().materials_markup_percent === 12.5);
check("get_markup_delta returns the entry", V.get_markup_delta() && V.get_markup_delta().delta === 2.5 && V.get_markup_delta().flag === "");
V.set_markup_delta(-50, NOW);
check("the merged markup never goes below 0", MS.readRateBuilderMaterialsMarkup().materials_markup_percent === 0);
r = V.set_markup_delta(0, NOW);
check("zero removes the markup entry", r.ok === true && !(MARKUP in stored(s).by_key) && V.get_markup_delta() === null);
check("real keys and baseline entries are still byte identical", same_map(real_only(s), real_before) && same_map(baseline_only(s), baseline_before));

// 8. Validation: nothing written
s.log.length = 0;
const bad_rates = [["", 5], ["   ", 5], [null, 5], [undefined, 5], [5, 5], ["x".repeat(81), 5], ["S01", null], ["S01", undefined], ["S01", ""], ["S01", "abc"], ["S01", NaN], ["S01", Infinity], ["S01", 10001], ["S01", -10001]];
const bad_all = bad_rates.every(([id, v]) => V.set_rate_delta(id, v, NOW).ok === false);
check("bad source ids and bad rate values are refused", bad_all && s.log.length === 0);
check("bad_source and bad_rate_value reasons", V.set_rate_delta("", 5).reason === "bad_source" && V.set_rate_delta("S01", "abc").reason === "bad_rate_value" && typeof V.set_rate_delta("S01", "abc").message === "string");
const bad_markups = [null, undefined, "", "  ", "abc", NaN, 1001, -101];
check("bad markup values are refused", bad_markups.every((v) => V.set_markup_delta(v, NOW).ok === false) && s.log.length === 0);
check("a numeric string is accepted", V.set_rate_delta("S01", "4", NOW).ok === true && stored(s).by_key[RATE][0].value === 4);
V.set_rate_delta("S01", 0, NOW);

// 9. Field-dropping check: nudges and lever records survive each other's writes with EVERY field
s = fresh();
lock_and_enter_model();
const stamp = lock_stamp(s);
check("nudge set", D.set_overhead_nudge("office_admin", 5).ok === true);
V.set_rate_delta("S01", 5, NOW);
V.set_markup_delta(2, NOW);
d = stored(s);
check("all three kinds are stored side by side", d.by_key[D.OVERHEAD_DIFF_KEY].length === 1 && d.by_key[RATE].length === 1 && d.by_key[MARKUP].length === 1, JSON.stringify(d));
const rate_before_nudge = JSON.stringify(d.by_key[RATE]), markup_before_nudge = JSON.stringify(d.by_key[MARKUP]);
D.set_overhead_nudge("vehicle_running_costs", -10);
d = stored(s);
check("a nudge change leaves the rate and markup records byte identical", JSON.stringify(d.by_key[RATE]) === rate_before_nudge && JSON.stringify(d.by_key[MARKUP]) === markup_before_nudge && d.by_key[D.OVERHEAD_DIFF_KEY].length === 2);
// hand-stamp the nudge record as the lever batch will (created_at and locked_at), then make sure neither write drops the stamps
d.by_key[D.OVERHEAD_DIFF_KEY][0].created_at = NOW;
d.by_key[D.OVERHEAD_DIFF_KEY][0].locked_at = stamp;
s.map.set(DIFFS, JSON.stringify(d));
h.clear_model_caches();
V.set_rate_delta("S02", 3, LATER);
let nudges_after = stored(s).by_key[D.OVERHEAD_DIFF_KEY];
check("a lever write keeps the nudge record's created_at and locked_at", nudges_after[0].created_at === NOW && nudges_after[0].locked_at === stamp, JSON.stringify(nudges_after));
D.set_overhead_nudge("vehicle_running_costs", -20);
nudges_after = stored(s).by_key[D.OVERHEAD_DIFF_KEY];
const office = nudges_after.find((x) => x.path === "category:office_admin");
check("a nudge write on another category keeps this nudge record's created_at and locked_at (spread, not rebuild)", office && office.created_at === NOW && office.locked_at === stamp, JSON.stringify(nudges_after));
check("the lever records survived that nudge write", stored(s).by_key[RATE].length === 2 && stored(s).by_key[MARKUP].length === 1);

// 10. Unknown entries survive
s = fresh();
lock_and_enter_model();
const odd = { path: "rate:ODD", kind: "delta", value: 1, flag: "", created_at: NOW, locked_at: "x", future_field: { a: 1 } };
s.map.set(DIFFS, JSON.stringify({ version: 1, generation: 0, by_key: { "some_future_key": [{ path: "z", kind: "delta", value: 9 }], [RATE]: [odd, { junk: true }] } }));
h.clear_model_caches();
V.set_rate_delta("S01", 5, NOW);
d = stored(s);
check("an unknown by_key entry survives a lever write", JSON.stringify(d.by_key.some_future_key) === JSON.stringify([{ path: "z", kind: "delta", value: 9 }]));
check("other records in the rate entry survive untouched, including unknown fields", d.by_key[RATE].some((x) => JSON.stringify(x) === JSON.stringify(odd)) && d.by_key[RATE].some((x) => x.junk === true) && d.by_key[RATE].length === 3, JSON.stringify(d.by_key[RATE]));
D.set_overhead_nudge("office_admin", 1);
check("an unknown by_key entry survives a nudge write", JSON.stringify(stored(s).by_key.some_future_key) === JSON.stringify([{ path: "z", kind: "delta", value: 9 }]));

// 11. baseline_changed flag per record
s = fresh();
lock_and_enter_model();
V.set_rate_delta("S01", 5, NOW);
V.set_markup_delta(2, NOW);
check("fresh lock: no flag", V.get_rate_deltas().S01.flag === "" && V.get_markup_delta().flag === "");
const meta = JSON.parse(s.map.get("mirra_baseline_v1"));
meta.locked_at = "2026-11-10T00:00:00.000Z";
s.map.set("mirra_baseline_v1", JSON.stringify(meta));
h.clear_model_caches();
check("a relocked baseline flags both records baseline_changed", V.get_rate_deltas().S01.flag === "baseline_changed" && V.get_markup_delta().flag === "baseline_changed");
check("the merge still applies a flagged record (the page decides what to do)", RS.readRateBuilderLabourSourceRates().S01 === 95);
const unstamped = { version: 1, generation: 0, by_key: { [RATE]: [{ path: "rate:S01", kind: "delta", value: 5, flag: "" }] } };
s.map.set(DIFFS, JSON.stringify(unstamped));
h.clear_model_caches();
check("a record with no stamps reads with no flag and empty stamps", V.get_rate_deltas().S01.flag === "" && V.get_rate_deltas().S01.created_at === "" && V.get_rate_deltas().S01.locked_at === "");

// 12. A slice 3 file with only nudges changes nothing
s = fresh();
lock_and_enter_model();
D.set_overhead_nudge("office_admin", 5);
check("nudge-only file: no rate deltas, no markup delta", Object.keys(V.get_rate_deltas()).length === 0 && V.get_markup_delta() === null);
check("nudge-only file: both readers return the baseline", JSON.stringify(RS.readRateBuilderLabourSourceRates()) === rate_value() && JSON.stringify(MS.readRateBuilderMaterialsMarkup()) === markup_value());

// 13. Storage full leaves the layer as it was
s = fresh();
lock_and_enter_model();
V.set_rate_delta("S01", 5, NOW);
const before_full = s.map.get(DIFFS);
s.capacity = s.used() + 5;
r = V.set_rate_delta("S02", 4, NOW);
check("storage full: refused with storage_full", r.ok === false && r.reason === "storage_full" && typeof r.message === "string", JSON.stringify(r));
check("storage full: mirra_diffs_v1 is exactly as it was", s.map.get(DIFFS) === before_full);
check("storage full: the reader still serves the earlier layer", RS.readRateBuilderLabourSourceRates().S01 === 95 && RS.readRateBuilderLabourSourceRates().S02 === 100);

// 14. Listeners are told after a successful write
s = fresh();
lock_and_enter_model();
let calls = 0;
const off = D.subscribe_to_diffs(() => { calls += 1; });
V.set_rate_delta("S01", 5, NOW);
V.set_markup_delta(1, NOW);
V.set_rate_delta("S01", "abc", NOW);
check("listeners are called once per successful write and not on a refusal", calls === 2, "calls " + calls);
off();

// 15. Pure helpers
check("delta_from_target 95 against 90 is 5", V.delta_from_target(95, 90) === 5);
check("delta_from_target rounds to 2 decimals", V.delta_from_target(95.005, 90) === 5.01 || V.delta_from_target(95.005, 90) === 5);
check("delta_from_target with a missing side is null (not zero)", V.delta_from_target(null, 90) === null && V.delta_from_target(95, "") === null && V.delta_from_target(undefined, undefined) === null);
const frozen_map = Object.freeze({ A: 10, B: 20 });
const merged = V.apply_rate_deltas(frozen_map, { A: { delta: 1.5 } });
check("apply_rate_deltas returns a new map and does not mutate its input", merged !== frozen_map && frozen_map.A === 10 && merged.A === 11.5 && merged.B === 20);
check("apply_rate_deltas with no deltas returns an equal map", JSON.stringify(V.apply_rate_deltas({ A: 10 }, {})) === JSON.stringify({ A: 10 }) && JSON.stringify(V.apply_rate_deltas({ A: 10 }, null)) === JSON.stringify({ A: 10 }));
const state = Object.freeze({ materials_markup_percent: 10, extra: "kept" });
check("apply_markup_delta spreads: other fields survive, input untouched", (() => { const o = V.apply_markup_delta(state, { delta: 2 }); return o.materials_markup_percent === 12 && o.extra === "kept" && state.materials_markup_percent === 10; })());
check("apply_markup_delta with no entry returns an equal state", JSON.stringify(V.apply_markup_delta({ materials_markup_percent: 10 }, null)) === JSON.stringify({ materials_markup_percent: 10 }));

// 16. Source checks
const lever_src = fs.readFileSync(path.join(storage_dir, "modelLeverDiffs.js"), "utf8");
const diffs_src = fs.readFileSync(path.join(storage_dir, "modelDiffs.js"), "utf8");
const rate_src = fs.readFileSync(path.join(storage_dir, "rateBuilderLabourSourceRatesStorage.js"), "utf8");
const markup_src = fs.readFileSync(path.join(storage_dir, "rateBuilderMaterialsMarkupStorage.js"), "utf8");
const lines = (t) => t.split("\n").length;
check("modelLeverDiffs.js is under 600 lines", lines(lever_src) < 600, String(lines(lever_src)));
check("modelDiffs.js is under 600 lines", lines(diffs_src) < 600, String(lines(diffs_src)));
check("modelLeverDiffs.js writes only through write_other_records (no direct setItem, no localStorage)", !/setItem|localStorage|removeItem/.test(lever_src.replace(/\/\/.*$/gm, "")));
check("modelDiffs.js normalise_diffs spreads the record", /records: own\.filter\(is_nudge_record\)\.map\(\(record\) => \(\{\s*\.\.\.record,/.test(diffs_src));
check("the rate reader applies the deltas", /apply_rate_deltas\(read_baseline_labour_source_rates\(\), get_rate_deltas\(\)\)/.test(rate_src));
check("the markup reader applies the delta", /apply_markup_delta\(read_baseline_materials_markup\(\), get_markup_delta\(\)\)/.test(markup_src));
check("the two storage modules still write only through model_storage", !/window\.localStorage\.(set|remove)Item/.test(rate_src + markup_src));

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
