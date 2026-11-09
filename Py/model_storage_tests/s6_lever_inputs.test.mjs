// R3 slice 5 lever batch L2 test (Business Modelling brief, Addendum 56). READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\s6_lever_inputs.test.mjs
// Checks: lib/actions/rate-builder/rateBuilderLeverActions.js (a typed target becomes a difference from the SAVED baseline value, baseline mode refuses and writes
// nothing, a source with no saved rate above 0 is refused, bad targets are refused, only mirra_diffs_v1 is written, real keys and baseline entries stay byte
// identical, a second move keeps created_at, the typed baseline value removes the record, nudges / other records / unknown entries survive with every field,
// the merged value is never written to a baseline key) and the pure helpers (changed_rates, resync_model_rates, same_rate_map), plus source checks that the
// patched hooks, action and cards contain the L2 wiring. Exit code 0 only if every check passes.
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
const A = await import(pathToFileURL(path.join(repo, "lib", "actions", "rate-builder", "rateBuilderLeverActions.js")).href);

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

// 1. Baseline mode: refused, nothing read from the diffs, nothing written
let s = fresh();
h.set_mode("baseline");
s.log.length = 0; s.read_keys.length = 0;
check("baseline: is_model_mode is false", A.is_model_mode() === false);
let r = A.save_rate_move("S01", 95, NOW);
check("baseline: save_rate_move refused (not_model_mode) with a message, nothing written", r.ok === false && r.reason === "not_model_mode" && typeof r.message === "string" && r.message.length > 0 && s.log.length === 0, JSON.stringify(r));
r = A.save_markup_move(12, NOW);
check("baseline: save_markup_move refused (not_model_mode), nothing written", r.ok === false && r.reason === "not_model_mode" && s.log.length === 0, JSON.stringify(r));
check("baseline: the stored rate map and markup are unchanged", s.map.get(RATE) === rate_value() && s.map.get(MARKUP) === markup_value());

// 2. Model mode: the typed target becomes the difference from the SAVED rate
s = fresh();
check("setup: lock and Model mode", lock_and_enter_model());
const real_before = real_only(s), baseline_before = baseline_only(s);
check("model: is_model_mode is true", A.is_model_mode() === true);
check("model: has_baseline_rate S01 true, S99 false, empty false", A.has_baseline_rate("S01") === true && A.has_baseline_rate("S99") === false && A.has_baseline_rate("") === false && A.has_baseline_rate(undefined) === false);
s.log.length = 0;
r = A.save_rate_move("S01", 95, NOW);
check("typed 95 against saved 90: ok", r.ok === true, JSON.stringify(r));
check("only mirra_diffs_v1 was written", s.log.length === 1 && only_diffs_written(s), JSON.stringify(s.log));
check("real keys and baseline entries are byte identical", same_map(real_only(s), real_before) && same_map(baseline_only(s), baseline_before));
let d = stored(s);
const expect_rate = { path: "rate:S01", kind: "delta", value: 5, flag: "", created_at: NOW, locked_at: lock_stamp(s) };
check("stored difference is +5 with created_at and locked_at, exact shape", d && d.version === 1 && JSON.stringify(d.by_key[RATE]) === JSON.stringify([expect_rate]), JSON.stringify(d));
check("the merged read returns 95, the saved key still holds 90", RS.readRateBuilderLabourSourceRates().S01 === 95 && JSON.parse(s.map.get(RATE)).S01 === 90);
check("the baseline-only reader returns 90 even with a move stored", A.has_baseline_rate("S01") && RS.read_baseline_labour_source_rates().S01 === 90);

// 3. Second move keeps created_at; typed baseline value removes the record
r = A.save_rate_move("S01", 98, LATER);
let rec = stored(s).by_key[RATE];
check("second move to 98: one record, +8, created_at kept", r.ok === true && rec.length === 1 && rec[0].value === 8 && rec[0].created_at === NOW, JSON.stringify(rec));
check("the merged read returns 98", RS.readRateBuilderLabourSourceRates().S01 === 98);
r = A.save_rate_move("S01", 90, LATER);
check("typed 90 (the saved value) removes the record and the by_key entry", r.ok === true && !(RATE in stored(s).by_key), JSON.stringify(stored(s)));
check("after removal the merged read equals the saved map", JSON.stringify(RS.readRateBuilderLabourSourceRates()) === rate_value());
r = A.save_rate_move("S01", "95.456", NOW);
check("a numeric string is accepted and the difference is rounded (+5.46)", r.ok === true && stored(s).by_key[RATE][0].value === 5.46, JSON.stringify(stored(s)));
r = A.save_rate_move("S01", 0, NOW);
check("typed 0 stores -90 and the merged rate is 0 (never negative)", r.ok === true && stored(s).by_key[RATE][0].value === -90 && RS.readRateBuilderLabourSourceRates().S01 === 0);
A.save_rate_move("S01", 90, NOW);

// 4. Markup
s.log.length = 0;
r = A.save_markup_move(12.5, NOW);
check("markup typed 12.5 against saved 10: ok, only mirra_diffs_v1 written", r.ok === true && s.log.length === 1 && only_diffs_written(s), JSON.stringify(r));
check("markup stored shape +2.5 with both stamps", JSON.stringify(stored(s).by_key[MARKUP]) === JSON.stringify([{ path: "markup:materials", kind: "delta", value: 2.5, flag: "", created_at: NOW, locked_at: lock_stamp(s) }]), JSON.stringify(stored(s)));
check("markup merged read 12.5, saved key still 10", MS.readRateBuilderMaterialsMarkup().materials_markup_percent === 12.5 && JSON.parse(s.map.get(MARKUP)).materials_markup_percent === 10 && MS.read_baseline_materials_markup().materials_markup_percent === 10);
r = A.save_markup_move(10, LATER);
check("markup typed 10 (the saved value) removes the record", r.ok === true && !(MARKUP in stored(s).by_key));
check("real keys and baseline entries still byte identical", same_map(real_only(s), real_before) && same_map(baseline_only(s), baseline_before));

// 5. Refusals write nothing
s = fresh(Infinity, { ...real_data(), [RATE]: JSON.stringify({ S01: 90, S02: 100, S04: 0 }) });
lock_and_enter_model();
s.log.length = 0;
r = A.save_rate_move("S99", 95, NOW);
check("a source with no saved rate is refused (no_baseline_rate) with the plain message", r.ok === false && r.reason === "no_baseline_rate" && r.message === A.LEVER_INPUT_MESSAGES.no_baseline_rate && s.log.length === 0, JSON.stringify(r));
r = A.save_rate_move("S04", 95, NOW);
check("a source whose saved rate is 0 is refused too", r.ok === false && r.reason === "no_baseline_rate" && s.log.length === 0, JSON.stringify(r));
const bad_targets = [null, undefined, "", "  ", "abc", NaN, Infinity, -1, -0.01];
check("bad targets are refused for rates (bad_target), nothing written", bad_targets.every((t) => { const x = A.save_rate_move("S01", t, NOW); return x.ok === false && x.reason === "bad_target"; }) && s.log.length === 0);
check("bad targets are refused for markup (bad_target), nothing written", bad_targets.every((t) => { const x = A.save_markup_move(t, NOW); return x.ok === false && x.reason === "bad_target"; }) && s.log.length === 0);
check("a markup target above the allowed difference is refused by the storage layer, nothing written", (() => { const x = A.save_markup_move(5000, NOW); return x.ok === false && s.log.length === 0; })());

// 6. Field dropping and survival: nudges, other source records and unknown entries survive an action write with every field
s = fresh();
lock_and_enter_model();
D.set_overhead_nudge("office_admin", 5);
const odd = { path: "rate:S02", kind: "delta", value: -3, flag: "", created_at: NOW, locked_at: lock_stamp(s), future_field: "kept" };
const with_extras = stored(s);
with_extras.by_key.some_future_key = [{ path: "z", kind: "delta", value: 9 }];
with_extras.by_key[RATE] = [odd];
s.map.set(DIFFS, JSON.stringify(with_extras));
h.clear_model_caches();
const nudge_before = JSON.stringify(stored(s).by_key[D.OVERHEAD_DIFF_KEY]);
r = A.save_rate_move("S01", 93, LATER);
d = stored(s);
check("action write ok with other records present", r.ok === true, JSON.stringify(r));
check("the overhead nudge entry is byte identical", JSON.stringify(d.by_key[D.OVERHEAD_DIFF_KEY]) === nudge_before);
check("the other source record survives with every field, including an unknown one", d.by_key[RATE].some((x) => JSON.stringify(x) === JSON.stringify(odd)) && d.by_key[RATE].length === 2, JSON.stringify(d.by_key[RATE]));
check("an unknown by_key entry survives", JSON.stringify(d.by_key.some_future_key) === JSON.stringify([{ path: "z", kind: "delta", value: 9 }]));
check("the new record carries created_at and locked_at", (() => { const x = d.by_key[RATE].find((y) => y.path === "rate:S01"); return x && x.created_at === LATER && x.locked_at === lock_stamp(s); })());
A.save_markup_move(11, LATER);
check("a markup action write leaves the rate records and the nudge untouched", stored(s).by_key[RATE].length === 2 && JSON.stringify(stored(s).by_key[D.OVERHEAD_DIFF_KEY]) === nudge_before);

// 7. The merged value is never written to a baseline key: the action file has no write path of its own
const actions_src = fs.readFileSync(path.join(repo, "lib", "actions", "rate-builder", "rateBuilderLeverActions.js"), "utf8");
const code_only = actions_src.replace(/\/\/.*$/gm, "");
check("rateBuilderLeverActions.js has no setItem / removeItem / localStorage / saveRateBuilder / writeRateBuilder", !/setItem|removeItem|localStorage|saveRateBuilder|writeRateBuilder/.test(code_only));
check("rateBuilderLeverActions.js reads only the baseline readers, never the merged readers", !/readRateBuilderLabourSourceRates|readRateBuilderMaterialsMarkup/.test(code_only));
check("rateBuilderLeverActions.js has no React import", !/from "react"/.test(code_only));

// 8. Pure helpers
check("changed_rates: only the moved id", JSON.stringify(A.changed_rates({ A: 1, B: 2 }, { A: 1, B: 3 })) === JSON.stringify({ B: 3 }));
check("changed_rates: a new id counts, nothing moved gives {}", JSON.stringify(A.changed_rates({ A: 1 }, { A: 1, C: 4 })) === JSON.stringify({ C: 4 }) && Object.keys(A.changed_rates({ A: 1 }, { A: 1 })).length === 0);
check("changed_rates: null inputs are safe", Object.keys(A.changed_rates(null, null)).length === 0 && JSON.stringify(A.changed_rates(undefined, { A: 1 })) === JSON.stringify({ A: 1 }));
const models = Object.freeze([
  Object.freeze({ labour_rate_model_id: "m1", labour_rate_model_name: "Calc one", labour_source_type_id: "S01", current_charge_out_rate: 90, other: "kept", charge_out_rates_by_labour_source: Object.freeze({ S01: 90, S02: 100 }) }),
  Object.freeze({ labour_rate_model_id: "m2", labour_rate_model_name: "Calc two", labour_source_type_id: "S02", current_charge_out_rate: 100, charge_out_rates_by_labour_source: Object.freeze({ S01: 90, S02: 100 }) }),
]);
const same = A.resync_model_rates(models, {});
check("resync_model_rates with nothing changed returns the SAME array", same === models);
const out = A.resync_model_rates(models, { S01: 95 });
check("resync: the rate map follows for every model, input untouched", out !== models && out[0].charge_out_rates_by_labour_source.S01 === 95 && out[1].charge_out_rates_by_labour_source.S01 === 95 && models[0].charge_out_rates_by_labour_source.S01 === 90);
check("resync: other fields and the list length survive", out.length === 2 && out[0].other === "kept" && out[0].labour_rate_model_name === "Calc one" && out[1].labour_rate_model_name === "Calc two" && out[0].charge_out_rates_by_labour_source.S02 === 100);
check("resync: current_charge_out_rate follows only the model whose selected source moved", out[0].current_charge_out_rate === 95 && out[1].current_charge_out_rate === 100);
check("resync: never empties a list; empty and non-array inputs come back unchanged", A.resync_model_rates([], { S01: 1 }).length === 0 && A.resync_model_rates(null, { S01: 1 }) === null);
check("same_rate_map", A.same_rate_map({ A: 1, B: 2 }, { B: 2, A: 1 }) && !A.same_rate_map({ A: 1 }, { A: 2 }) && !A.same_rate_map({ A: 1 }, { A: 1, B: 2 }) && A.same_rate_map(null, {}));

// 9. Source checks on the patched files (these fail before the patch script has run)
const read = (...p) => fs.readFileSync(path.join(repo, ...p), "utf8");
const lines = (t) => t.split("\n").length;
const labour_hook = read("hooks", "rate-builder", "useRateBuilderLabourRates.js");
const markup_hook = read("hooks", "rate-builder", "useRateBuilderMaterialsMarkup.js");
const recovery_hook = read("hooks", "useBusinessOutcomeLabourRecovery.js");
const bo_hook = read("hooks", "useBusinessOutcomePerSourceRevenue.js");
const model_actions = read("lib", "actions", "rate-builder", "rateBuilderLabourRateModelActions.js");
const input_card = read("components", "rate-builder", "RateBuilderLabourRatesInputCard.jsx");
const markup_card = read("components", "rate-builder", "RateBuilderMaterialsMarkupCard.jsx");
const rate_src = read("lib", "storage", "rateBuilderLabourSourceRatesStorage.js");
const markup_src = read("lib", "storage", "rateBuilderMaterialsMarkupStorage.js");
check("both storage modules export their baseline-only reader", /export function read_baseline_labour_source_rates\(/.test(rate_src) && /export function read_baseline_materials_markup\(/.test(markup_src));
check("labour rates hook subscribes and returns the unsubscribe", /subscribe_to_diffs\(/.test(labour_hook) && /return subscribe_to_diffs\(/.test(labour_hook));
check("labour rates hook re-syncs only the changed rates (changed_rates and resync_model_rates)", /changed_rates\(/.test(labour_hook) && /resync_model_rates\(/.test(labour_hook));
check("labour rates hook returns lever_input and has a model_active state", /lever_input/.test(labour_hook) && /set_model_active\(is_model_mode\(\)\)/.test(labour_hook));
check("markup hook subscribes and returns the unsubscribe", /return subscribe_to_diffs\(/.test(markup_hook) || /=> subscribe_to_diffs\(/.test(markup_hook));
check("markup hook: the save effect skips Model mode and still has the is_loaded guard", /if \(!is_loaded \|\| model_active\)/.test(markup_hook));
check("markup hook: commit action calls save_markup_move and is exposed as commit_markup_percent", /save_markup_move\(/.test(markup_hook) && /commit_markup_percent/.test(markup_hook));
check("recovery hook re-reads on a change and keeps its object when nothing moved", /subscribe_to_diffs/.test(recovery_hook) && /same_rate_map/.test(recovery_hook));
check("business outcome hook re-reads the markup on a change", /subscribe_to_diffs/.test(bo_hook) && /reload_markup/.test(bo_hook));
check("model actions: Model mode save goes through save_rate_move BEFORE the baseline save", (() => { const a = model_actions.indexOf("save_rate_move("); const b = model_actions.indexOf("saveRateBuilderLabourSourceRate(source_id, saved_rate)"); return a > 0 && b > 0 && a < b; })());
check("model actions: the Model mode branch returns before the baseline save", /if \(is_model_mode\(\)\) \{[\s\S]*?return;\s*\}\s*\n\s*saveRateBuilderLabourSourceRate\(source_id, saved_rate\)/.test(model_actions));
check("input card: the rate box and Save button disable when there is no saved rate, and the note shows", (input_card.match(/rate_move_blocked/g) || []).length >= 2 && /lever_input\?\.note/.test(input_card));
check("markup card: leaving the box or pressing Enter commits", /onBlur=/.test(markup_card) && /commit_markup_percent/.test(markup_card) && /onKeyDown=/.test(markup_card));
check("new files are under 600 lines", lines(actions_src) < 600 && lines(fs.readFileSync(fileURLToPath(import.meta.url), "utf8")) < 600);

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
