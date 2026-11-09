// R3 slice 5, lever batch L3 test (BM Addendum 57 item 2 criteria 1 to 8). READ-ONLY: uses a fake in-memory store only (touches no repo file and no
// real browser storage).
// Run: node Py\model_storage_tests\s7_working_layer.test.mjs
// Checks: the summary (empty layer, count, working or accepted, relocked flag, baseline mode reads nothing), Accept (writes status and accepted_at
// and nothing else, wakes only the strip, keeps the nudge cache), a later nudge / rate / markup move (including back to zero) removes the status in the
// same write, nudges are stamped with created_at (kept) and locked_at while old unstamped records still read, Discard (whole layer, scenarios byte
// identical, every subscriber told once, accepted layer too), refusals, storage full, a layer with no status is byte-identical in shape, and the
// source checks (sizes, no direct storage writes in the new files, the strip is wired into the gate). Exit code 0 only if every check passes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..", "..");
const storage_dir = path.join(repo, "lib", "storage");
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
const V = await import(pathToFileURL(path.join(storage_dir, "modelLeverDiffs.js")).href);
const W = await import(pathToFileURL(path.join(storage_dir, "modelWorkingLayer.js")).href);

const GO = "qs_tools_general_overhead_state", PNL = "qs_tools_profit_and_loss_state";
const DIFFS = "mirra_diffs_v1", SCEN = "mirra_scenarios_v1", META = "mirra_baseline_v1";
const T1 = "2026-11-01T01:00:00.000Z", T2 = "2026-11-02T01:00:00.000Z", T3 = "2026-11-03T01:00:00.000Z";
const go_value = (stamp = "2026-01-01T00:00:00.000Z") => JSON.stringify({
  overhead_profile_id: "p1", vehicle_running_cost_annual: 38700, custom_overhead_items: [{ id: "c1", amount: 10 }],
  created_at: "2026-01-01T00:00:00.000Z", updated_at: stamp,
});
const real_data = () => ({ [GO]: go_value(), [PNL]: JSON.stringify({ revenue: 1000 }) });
const ready = () => ({ loaded: true, overall_status: "ready", blocking_count: 0, warning_count: 0, checked_at: "2026-10-30T00:00:00.000Z" });

function fresh(capacity = Infinity) {
  const s = new FakeStorage(capacity);
  for (const [k, v] of Object.entries(real_data())) s.map.set(k, v);
  globalThis.window = { localStorage: s };
  h.clear_model_caches();
  h.reset_model_stats();
  return s;
}
function model_on(s) {
  const r = L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
  const m = h.set_mode("model");
  return r.ok === true && m.ok === true;
}
const stored = (s) => JSON.parse(s.map.get(DIFFS));
const raw = (s) => s.map.get(DIFFS);
const non_diffs = (s) => JSON.stringify([...s.map].filter(([k]) => k !== DIFFS).sort());
const lock_stamp = (s) => JSON.parse(s.map.get(META)).locked_at;
const only_diffs_written = (s) => s.log.length > 0 && s.log.every(([, k]) => k === DIFFS);
const has_status = (s) => "status" in stored(s) || "accepted_at" in stored(s);
const tick = () => { const t = Date.now(); while (Date.now() === t) { /* wait for the next millisecond so a relock gets a new locked_at */ } };
const NO_STATUS_KEYS = JSON.stringify(["version", "generation", "by_key"]);

// 1. Baseline mode: nothing shown, nothing read, nothing written
let s = fresh();
h.set_mode("baseline");
s.reads = 0; s.log.length = 0;
let sum = W.get_layer_summary();
check("baseline mode: the summary is empty (count 0, no status)", sum.count === 0 && sum.status === "" && sum.relocked === false, JSON.stringify(sum));
check("baseline mode: repeated summaries read no storage and return the same object", (() => { s.reads = 0; const a = W.get_layer_summary(); const b = W.get_layer_summary(); return s.reads === 0 && a === b; })());
check("baseline mode: the server summary is the empty one", W.get_server_layer_summary().count === 0);
let r = W.accept_working_layer(T1);
check("baseline mode: Accept refused, nothing written", r.ok === false && r.reason === "not_model_mode" && s.log.length === 0, JSON.stringify(r));
r = W.discard_working_layer();
check("baseline mode: Discard refused, nothing written", r.ok === false && r.reason === "not_model_mode" && s.log.length === 0, JSON.stringify(r));

// 2. Model mode, empty layer: no strip, nothing to accept
s = fresh();
check("setup: lock and Model mode", model_on(s));
sum = W.get_layer_summary();
check("empty layer: count 0 (no strip)", sum.count === 0 && sum.status === "");
s.log.length = 0;
r = W.accept_working_layer(T1);
check("empty layer: Accept refused, nothing written", r.ok === false && s.log.length === 0 && typeof r.message === "string" && r.message.length > 0, JSON.stringify(r));

// 3. Nudges are stamped; the summary counts them
const baseline_snapshot = non_diffs(s);
r = D.set_overhead_nudge("travel", 5, T1);
let rec = stored(s).by_key[GO][0];
check("a nudge is stamped: created_at and locked_at (the baseline lock)", r.ok === true && rec.created_at === T1 && rec.locked_at === lock_stamp(s), JSON.stringify(rec));
r = D.set_overhead_nudge("travel", 7, T2);
rec = stored(s).by_key[GO][0];
check("a second move keeps created_at and re-stamps nothing else wrongly", rec.value === 7 && rec.created_at === T1 && rec.locked_at === lock_stamp(s), JSON.stringify(rec));
check("a layer with no status keeps the old shape: version, generation, by_key only", JSON.stringify(Object.keys(stored(s))) === NO_STATUS_KEYS, raw(s));
sum = W.get_layer_summary();
check("summary: one change, working, not relocked", sum.count === 1 && sum.status === "working" && sum.accepted_at === "" && sum.relocked === false, JSON.stringify(sum));
V.set_rate_delta("S01", 5, T2);
sum = W.get_layer_summary();
check("summary is cached until told (a write elsewhere without a notice is not yet seen is fine); after clear it counts the lever too", (() => { h.clear_model_caches(); return W.get_layer_summary().count === 2; })());
check("a lever record counts with the nudge: 2 changes, working", sum.count === 2 || W.get_layer_summary().count === 2);

// 4. Old unstamped records still read
s.map.set(DIFFS, JSON.stringify({ version: 1, generation: 1, by_key: { [GO]: [{ path: "category:old_cat", kind: "pct", value: 3, flag: "" }] } }));
h.clear_model_caches();
check("an old unstamped nudge still reads and counts, with no relocked flag", D.get_overhead_nudges().old_cat.pct === 3 && W.get_layer_summary().count === 1 && W.get_layer_summary().relocked === false);

// 5. Accept
s = fresh();
model_on(s);
D.set_overhead_nudge("travel", 5, T1);
V.set_rate_delta("S01", 5, T1);
V.set_markup_delta(2, T1);
// an unknown top-level field must survive Accept (the stored object is spread, not rebuilt)
{ const o = stored(s); o.future_top_field = { keep: true }; s.map.set(DIFFS, JSON.stringify(o)); h.clear_model_caches(); }
const by_key_before = JSON.stringify(stored(s).by_key);
const generation_before = stored(s).generation;
const others_before = non_diffs(s);
const nudges_before = D.get_overhead_nudges();
let diff_calls = 0, strip_calls = 0;
const stop_diffs = D.subscribe_to_diffs(() => { diff_calls += 1; });
const stop_strip = W.subscribe_to_layer(() => { strip_calls += 1; });
s.log.length = 0; s.reads = 0;
r = W.accept_working_layer(T3);
let st = stored(s);
check("Accept ok", r.ok === true, JSON.stringify(r));
check("Accept writes only mirra_diffs_v1, once", s.log.length === 1 && only_diffs_written(s), JSON.stringify(s.log));
check("Accept writes status \"accepted\" and accepted_at, version still 1", st.status === "accepted" && st.accepted_at === T3 && st.version === 1, raw(s));
check("Accept changes nothing else: by_key, generation and the unknown top-level field are as they were", JSON.stringify(st.by_key) === by_key_before && st.generation === generation_before && JSON.stringify(st.future_top_field) === JSON.stringify({ keep: true }));
check("Accept: real keys, baseline entries, meta and scenarios are byte identical", non_diffs(s) === others_before);
check("Accept wakes the strip once and the diff subscribers not at all (no hook re-reads)", strip_calls === 1 && diff_calls === 0, "strip " + strip_calls + " diffs " + diff_calls);
s.reads = 0;
check("Accept keeps the nudge cache: the same object is served with no storage read", D.get_overhead_nudges() === nudges_before && s.reads === 0, "reads " + s.reads);
sum = W.get_layer_summary();
check("summary after Accept: accepted, accepted_at, 3 changes", sum.status === "accepted" && sum.accepted_at === T3 && sum.count === 3, JSON.stringify(sum));
check("read_layer_snapshot reports the status", D.read_layer_snapshot().status === "accepted" && D.read_layer_snapshot().accepted_at === T3);
check("the status survives reads: a cache clear and a re-read leave the stored text as written", (() => { const before = raw(s); h.clear_model_caches(); D.get_overhead_nudges(); V.get_rate_deltas(); V.get_markup_delta(); W.get_layer_summary(); return raw(s) === before && stored(s).status === "accepted"; })());
r = W.accept_working_layer(T3);
check("Accept again on an accepted layer is allowed and keeps the status", r.ok === true && stored(s).status === "accepted");
stop_diffs(); stop_strip();

// 6. Any later move removes the status in the SAME write
const flips = [
  ["nudge change", () => D.set_overhead_nudge("travel", 6, T3)],
  ["nudge back to zero", () => D.set_overhead_nudge("travel", 0, T3)],
  ["rate change", () => V.set_rate_delta("S01", 6, T3)],
  ["rate back to zero", () => V.set_rate_delta("S01", 0, T3)],
  ["markup change", () => V.set_markup_delta(3, T3)],
  ["markup back to zero", () => V.set_markup_delta(0, T3)],
];
for (const [label, move] of flips) {
  // put something in the layer so each move has a record to change, then accept
  D.set_overhead_nudge("travel", 5, T1); V.set_rate_delta("S01", 5, T1); V.set_markup_delta(2, T1);
  W.accept_working_layer(T2);
  const was_accepted = stored(s).status === "accepted";
  const result = move();
  const after = stored(s);
  check("after Accept, a " + label + " removes status and accepted_at in the same write", was_accepted && result.ok === true && !has_status(s) && JSON.stringify(Object.keys(after)) === NO_STATUS_KEYS, raw(s));
  check("... and the summary reads working again (" + label + ")", (() => { const m = W.get_layer_summary(); return m.status === "working" || m.count === 0; })());
}
D.set_overhead_nudge("travel", 0, T3); V.set_rate_delta("S01", 0, T3); V.set_markup_delta(0, T3);

// 7. Discard
s = fresh();
model_on(s);
D.set_overhead_nudge("travel", 5, T1);
V.set_rate_delta("S01", 5, T1);
V.set_markup_delta(2, T1);
{ const o = stored(s); o.by_key.some_future_key = [{ path: "z", kind: "delta", value: 9 }]; s.map.set(DIFFS, JSON.stringify(o)); h.clear_model_caches(); }
s.map.set(SCEN, JSON.stringify({ version: 1, items: [{ id: "sc1", kind: "add" }] }));
W.accept_working_layer(T3);
const scen_before = s.map.get(SCEN);
const others_before_discard = JSON.stringify([...s.map].filter(([k]) => k !== DIFFS && k !== SCEN).sort());
diff_calls = 0; strip_calls = 0;
const stop_d = D.subscribe_to_diffs(() => { diff_calls += 1; });
const stop_s = W.subscribe_to_layer(() => { strip_calls += 1; });
s.log.length = 0;
r = W.discard_working_layer();
st = stored(s);
check("Discard ok on an ACCEPTED layer (stays available after Accept)", r.ok === true, JSON.stringify(r));
check("Discard writes only mirra_diffs_v1", s.log.length === 1 && only_diffs_written(s), JSON.stringify(s.log));
check("Discard clears every by_key entry (known and future) and the status; version 1, generation kept", Object.keys(st.by_key).length === 0 && !has_status(s) && st.version === 1 && st.generation === 1 && JSON.stringify(Object.keys(st)) === NO_STATUS_KEYS, raw(s));
check("Discard leaves mirra_scenarios_v1 byte identical", s.map.get(SCEN) === scen_before);
check("Discard leaves real keys, baseline entries and meta byte identical", JSON.stringify([...s.map].filter(([k]) => k !== DIFFS && k !== SCEN).sort()) === others_before_discard);
check("Discard tells the diff subscribers once and the strip once", diff_calls === 1 && strip_calls === 1, "diffs " + diff_calls + " strip " + strip_calls);
check("after Discard the nudges, rate moves and markup move read as saved values (empty)", Object.keys(D.get_overhead_nudges()).length === 0 && Object.keys(V.get_rate_deltas()).length === 0 && V.get_markup_delta() === null);
check("after Discard the summary is empty (the strip disappears)", W.get_layer_summary().count === 0);
r = W.discard_working_layer();
check("Discard on an empty layer is harmless", r.ok === true && Object.keys(stored(s).by_key).length === 0);
// a working (not accepted) layer too
D.set_overhead_nudge("travel", 4, T1);
r = W.discard_working_layer();
check("Discard on a WORKING layer clears it", r.ok === true && Object.keys(stored(s).by_key).length === 0 && W.get_layer_summary().count === 0);
stop_d(); stop_s();

// 8. The relocked flag
s = fresh();
model_on(s);
D.set_overhead_nudge("travel", 4, T1);
V.set_rate_delta("S01", 5, T1);
check("fresh layer: no relocked flag", W.get_layer_summary().relocked === false);
h.set_mode("baseline");
tick();
L.unlock_baseline({ confirmed: true });
s.map.set(GO, go_value("2026-06-06T00:00:00.000Z").replace("38700", "50000"));
L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
h.set_mode("model");
check("after the baseline is relocked, the strip flags it once for the whole layer", W.get_layer_summary().relocked === true && W.get_layer_summary().count === 2, JSON.stringify(W.get_layer_summary()));
// lever record alone (no nudge): flag from its locked_at
s = fresh();
model_on(s);
V.set_rate_delta("S01", 5, T1);
h.set_mode("baseline");
tick();
L.unlock_baseline({ confirmed: true });
s.map.set(GO, go_value("2026-06-06T00:00:00.000Z").replace("38700", "50000"));
L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
h.set_mode("model");
check("a lever record made against the old lock is flagged by its locked_at", W.get_layer_summary().relocked === true);
// unstamped records: no flag
s.map.set(DIFFS, JSON.stringify({ version: 1, generation: JSON.parse(s.map.get(META)).generation, by_key: { "qstools_rate_builder_labour_source_rates_v1": [{ path: "rate:S01", kind: "delta", value: 2, flag: "" }] } }));
h.clear_model_caches();
check("an unstamped lever record shows no flag", W.get_layer_summary().count === 1 && W.get_layer_summary().relocked === false);

// 9. Refusals and storage full
s = fresh();
model_on(s);
D.set_overhead_nudge("travel", 4, T1);
{ const meta = JSON.parse(s.map.get(META)); meta.locked = false; s.map.set(META, JSON.stringify(meta)); h.clear_model_caches(); }
s.log.length = 0;
r = W.accept_working_layer(T2);
check("Accept refused without a locked baseline, nothing written", r.ok === false && r.reason === "baseline_not_locked" && s.log.length === 0, JSON.stringify(r));
r = W.discard_working_layer();
check("Discard refused without a locked baseline, nothing written", r.ok === false && r.reason === "baseline_not_locked" && s.log.length === 0, JSON.stringify(r));
s = fresh();
model_on(s);
D.set_overhead_nudge("travel", 4, T1);
const layer_before = raw(s);
s.capacity = s.used();
r = W.accept_working_layer(T2);
check("storage full on Accept: refused with the stopgap message, the layer is exactly as it was", r.ok === false && r.reason === "storage_full" && r.message === h.MODEL_STORAGE_FULL_MESSAGE && raw(s) === layer_before, JSON.stringify(r));
check("storage full on Accept: the summary is still working", W.get_layer_summary().status === "working");
s.capacity = Infinity;
W.accept_working_layer(T2);
const accepted_before = raw(s);
const real_set = s.setItem.bind(s);
s.setItem = () => { const e = new Error("quota exceeded"); e.name = "QuotaExceededError"; throw e; };
r = W.discard_working_layer();
check("storage full on Discard: refused, the layer is exactly as it was", r.ok === false && r.reason === "storage_full" && raw(s) === accepted_before, JSON.stringify(r));
s.setItem = real_set;
s.map.set(DIFFS, "not json at all");
h.clear_model_caches();
r = W.accept_working_layer(T2);
check("an unreadable layer cannot be accepted and is not overwritten", r.ok === false && raw(s) === "not json at all", JSON.stringify(r));
check("a failed action shows the approved failure wording", r.message === "The change could not be saved. Nothing was changed.", r.message);

// 10. Subscriptions
s = fresh();
model_on(s);
let heard = 0;
const stop = W.subscribe_to_layer(() => { heard += 1; });
D.set_overhead_nudge("travel", 3, T1);
check("a move wakes the strip once", heard === 1, String(heard));
V.set_rate_delta("S01", 1, T1);
check("a lever move wakes the strip", heard === 2, String(heard));
check("the strip sees the new summary at once (cache dropped on the notice)", W.get_layer_summary().count === 2);
D.set_overhead_nudge("travel", 1001, T1);
check("a refused move wakes nobody", heard === 2);
W.subscribe_to_layer(() => { throw new Error("broken strip"); });
check("a broken listener does not stop the others or fail the action", W.accept_working_layer(T2).ok === true && heard === 3, String(heard));
stop();
D.set_overhead_nudge("travel", 2, T1);
check("after unsubscribing the callback is not called again", heard === 3);

// 11. Dates
const noon = new Date(2026, 10, 9, 12, 0, 0).toISOString();
check("format_accepted_date gives \"9 Nov 2026\"", W.format_accepted_date(noon) === "9 Nov 2026", W.format_accepted_date(noon));
check("format_accepted_date is safe for bad input", W.format_accepted_date("") === "" && W.format_accepted_date("nope") === "" && W.format_accepted_date(null) === "");

// 12. The approved wording
check("approved wording", W.LAYER_TEXT.working === "Working changes, not yet accepted" && W.LAYER_TEXT.accept === "Accept" && W.LAYER_TEXT.discard === "Discard" && W.LAYER_TEXT.confirm === "Discard all working changes? This cannot be undone." && W.LAYER_TEXT.relocked === "The baseline was relocked after some of these changes were made." && W.LAYER_TEXT.accepted_on === "Changes accepted on");

// 13. Source checks
const read = (...p) => fs.readFileSync(path.join(repo, ...p), "utf8");
const lines = (t) => t.split("\n").length;
const layer_src = read("lib", "storage", "modelWorkingLayer.js");
const strip_src = read("components", "layout", "ModelWorkingLayerStrip.jsx");
const gate_src = read("components", "layout", "ModelModeGate.jsx");
const diffs_src = read("lib", "storage", "modelDiffs.js");
const code = (t) => t.replace(/\/\/.*$/gm, "");
check("new files and modelDiffs.js are under 600 lines", lines(layer_src) < 600 && lines(strip_src) < 600 && lines(diffs_src) < 600 && lines(fs.readFileSync(fileURLToPath(import.meta.url), "utf8")) < 600);
check("modelWorkingLayer.js has no storage write of its own", !/setItem|removeItem|localStorage/.test(code(layer_src)));
check("the strip has no storage access and no browser dialog", !/setItem|removeItem|localStorage|getItem|confirm\(|alert\(/.test(code(strip_src)));
check("the gate renders the strip under the banner", /import ModelWorkingLayerStrip from/.test(gate_src) && /<ModelWorkingLayerStrip \/>/.test(gate_src));
check("the strip uses its own subscription (useSyncExternalStore with subscribe_to_layer)", /useSyncExternalStore\(subscribe_to_layer, get_layer_summary, get_server_layer_summary\)/.test(strip_src));
check("modelDiffs.js rebuilds the layer only through layer_json (the one literal lives in layer_json)", (code(diffs_src).match(/\{ version: 1, generation/g) || []).length === 1 && (code(diffs_src).match(/layer_json\(/g) || []).length >= 4);
check("modelDiffs.js still spreads the nudge record (field-dropping guard)", /records: own\.filter\(is_nudge_record\)\.map\(\(record\) => \(\{\s*\.\.\.record,/.test(diffs_src));

console.log("");
console.log(pass + " of " + (pass + fail) + " passed");
process.exit(fail === 0 ? 0 : 1);
