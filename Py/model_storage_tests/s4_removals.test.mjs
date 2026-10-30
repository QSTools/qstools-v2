// R3 slice 4 batch B part 1 test. READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\s4_removals.test.mjs
// Checks lib/calculations/scenarioRemovals.js (staff filter, asset removal with pro-rata redistribution of overhead pool amounts, equal split when every
// receiver holds zero, no live asset left = unplaced, retired assets, conservation to the cent, identity, inputs never mutated, fields kept) and
// lib/storage/modelScenarios.js (baseline mode reads nothing, set/delete a marker, only mirra_scenarios_v1 is written, real keys and baseline entries stay
// byte-identical, idempotent, validation, generation and the baseline_changed flag, storage full leaves the layer as it was, unknown items and fields survive,
// the empty scenario created by set_mode reads as no removals, files stay under 600 lines). Exit code 0 only if every check passes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const storage_dir = path.join(root, "lib", "storage");
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

const R = await import(pathToFileURL(path.join(root, "lib", "calculations", "scenarioRemovals.js")).href);
const h = await import(pathToFileURL(path.join(storage_dir, "modelStorage.js")).href);
const L = await import(pathToFileURL(path.join(storage_dir, "modelBaselineLock.js")).href);
const S = await import(pathToFileURL(path.join(storage_dir, "modelScenarios.js")).href);

// ---------- A. scenarioRemovals.js (pure) ----------
const asset = (id, assignments, extra = {}) => ({ asset_id: id, asset_name: "Asset " + id, is_retired: false, total_asset_cost_annual: 1000, asset_overhead_pool_assignments: assignments, ...extra });
const total_pool = (list, pool) => Math.round(list.filter((a) => !a.is_retired).reduce((s, a) => s + (Number(a.asset_overhead_pool_assignments?.[pool]) || 0), 0) * 100) / 100;
const FUEL = "asset_fuel_pool", INS = "asset_insurance_pool";

const staff = [{ staff_id: "s1" }, { staff_id: "s2" }, { staff_id: "s3" }];
check("staff: nothing removed returns the SAME array", R.apply_staff_removals(staff, []) === staff && R.apply_staff_removals(staff, undefined) === staff);
check("staff: an id that matches nobody returns the SAME array", R.apply_staff_removals(staff, ["zzz"]) === staff);
const staff_after = R.apply_staff_removals(staff, ["s2"]);
check("staff: a removed id is filtered out, the others keep their order and are the same objects", staff_after.length === 2 && staff_after[0] === staff[0] && staff_after[1] === staff[2]);
check("staff: input array is not mutated", staff.length === 3);
check("staff: bad inputs are survived", R.apply_staff_removals(null, ["s1"]) === null && R.apply_staff_removals(staff, [null, 5, ""]) === staff);

const assets = [
  asset("a1", { [FUEL]: 600, [INS]: 100 }),
  asset("a2", { [FUEL]: 300, [INS]: 0 }, { custom_field: "keep me" }),
  asset("a3", { [FUEL]: 100, [INS]: 100 }),
  asset("old", { [FUEL]: 999 }, { is_retired: true }),
];
const snapshot = JSON.stringify(assets);
let r = R.apply_asset_removals(assets, []);
check("assets: nothing removed returns the SAME array and empty reports", r.assets === assets && r.removed_count === 0 && Object.keys(r.redistributed).length === 0);
r = R.apply_asset_removals(assets, ["nope"]);
check("assets: an id that matches nothing returns the SAME array", r.assets === assets && r.removed_count === 0);

r = R.apply_asset_removals(assets, ["a1"]);
check("assets: removed asset is gone from the list", r.assets.every((a) => a.asset_id !== "a1") && r.removed_count === 1);
check("assets: pro rata. Fuel 600 moves to a2 (300) and a3 (100) in the ratio 3:1 = 450 and 150", r.assets.find((a) => a.asset_id === "a2").asset_overhead_pool_assignments[FUEL] === 750 && r.assets.find((a) => a.asset_id === "a3").asset_overhead_pool_assignments[FUEL] === 250);
check("assets: pro rata with a zero holder. Insurance 100 goes only where weight exists: a3 holds 100, a2 holds 0, so a3 gets all 100", r.assets.find((a) => a.asset_id === "a3").asset_overhead_pool_assignments[INS] === 200 && r.assets.find((a) => a.asset_id === "a2").asset_overhead_pool_assignments[INS] === 0);
check("assets: pool totals are conserved over the live assets (fuel 1000 before, 1000 after; insurance 200 before, 200 after)", total_pool(assets, FUEL) === 1000 && total_pool(r.assets, FUEL) === 1000 && total_pool(assets, INS) === 200 && total_pool(r.assets, INS) === 200);
check("assets: report names what moved and nothing was unplaced", r.redistributed[FUEL] === 600 && r.redistributed[INS] === 100 && Object.keys(r.unplaced).length === 0);
check("assets: other fields survive on a receiving asset (no field dropping)", r.assets.find((a) => a.asset_id === "a2").custom_field === "keep me" && r.assets.find((a) => a.asset_id === "a2").total_asset_cost_annual === 1000);
check("assets: a receiver is a COPY, the input objects and list are not mutated", JSON.stringify(assets) === snapshot && r.assets.find((a) => a.asset_id === "a2") !== assets[1]);
check("assets: an asset that receives nothing is the same object", r.assets.find((a) => a.asset_id === "old") === assets[3]);
check("assets: a retired asset is not a receiver (its 999 stays untouched)", r.assets.find((a) => a.asset_id === "old").asset_overhead_pool_assignments[FUEL] === 999);

// equal split when every receiver holds zero in that pool
const zero = [asset("x1", { [FUEL]: 90 }), asset("x2", { [FUEL]: 0 }), asset("x3", {})];
r = R.apply_asset_removals(zero, ["x1"]);
check("assets: every receiver holds zero in the pool, so the amount splits equally (45 and 45)", r.assets.find((a) => a.asset_id === "x2").asset_overhead_pool_assignments[FUEL] === 45 && r.assets.find((a) => a.asset_id === "x3").asset_overhead_pool_assignments[FUEL] === 45);

// rounding: 100 split three ways keeps the total to the cent
const thirds = [asset("t1", { [FUEL]: 100 }), asset("t2", { [FUEL]: 0 }), asset("t3", { [FUEL]: 0 }), asset("t4", { [FUEL]: 0 })];
r = R.apply_asset_removals(thirds, ["t1"]);
check("assets: 100 split equally over three keeps the pool total exactly 100.00", total_pool(r.assets, FUEL) === 100, String(total_pool(r.assets, FUEL)));
const uneven = [asset("u1", { [FUEL]: 100.01 }), asset("u2", { [FUEL]: 33.33 }), asset("u3", { [FUEL]: 66.67 })];
r = R.apply_asset_removals(uneven, ["u1"]);
check("assets: uneven weights keep the pool total to the cent", total_pool(r.assets, FUEL) === total_pool(uneven, FUEL), total_pool(r.assets, FUEL) + " vs " + total_pool(uneven, FUEL));

// no live asset left
const only = [asset("o1", { [FUEL]: 70, [INS]: 5 }), asset("o2", { [FUEL]: 30 }, { is_retired: true })];
r = R.apply_asset_removals(only, ["o1"]);
check("assets: no live asset left, so the amount is reported unplaced (the one exception) and nothing else changes", r.unplaced[FUEL] === 70 && r.unplaced[INS] === 5 && Object.keys(r.redistributed).length === 0 && r.assets.length === 1 && r.assets[0].asset_id === "o2");

// removing two assets at once; removing everything live
r = R.apply_asset_removals(assets, ["a1", "a2"]);
check("assets: two removed at once: a3 receives everything (fuel 600+300 more = 1000, insurance 100)", r.assets.find((a) => a.asset_id === "a3").asset_overhead_pool_assignments[FUEL] === 1000 && total_pool(r.assets, FUEL) === 1000);
r = R.apply_asset_removals(assets, ["a1", "a2", "a3"]);
check("assets: all live removed: fuel 1000 and insurance 200 unplaced", r.unplaced[FUEL] === 1000 && r.unplaced[INS] === 200 && r.assets.length === 1);

// a removed retired asset: filtered, but nothing is redistributed (its overhead was never counted)
r = R.apply_asset_removals(assets, ["old"]);
check("assets: removing a retired asset filters it and redistributes nothing", r.assets.length === 3 && Object.keys(r.redistributed).length === 0 && r.assets[0] === assets[0]);
check("assets: bad inputs are survived", R.apply_asset_removals(null, ["a1"]).assets === null && R.apply_asset_removals(assets, [null, 3, ""]).assets === assets);
check("assets: an asset with no assignments object is fine", R.apply_asset_removals([{ asset_id: "n1" }, { asset_id: "n2" }], ["n1"]).assets.length === 1);

// ---------- B. modelScenarios.js ----------
const GO = "qs_tools_general_overhead_state", PNL = "qs_tools_profit_and_loss_state";
const go_value = (stamp = "2026-01-01T00:00:00.000Z") => JSON.stringify({ overhead_profile_id: "p1", vehicle_running_cost_annual: 38700, created_at: "2026-01-01T00:00:00.000Z", updated_at: stamp });
const real_data = () => ({ [GO]: go_value(), [PNL]: JSON.stringify({ revenue: 1000 }) });
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
  const lk = L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
  const m = h.set_mode("model");
  return lk.ok === true && m.ok === true;
}
const real_only = (s) => new Map([...s.map].filter(([k]) => !k.startsWith("mirra_")));
const baseline_only = (s) => new Map([...s.map].filter(([k]) => k.startsWith("mirra_baseline_v1")));
const same_map = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// 1. baseline mode
let s = fresh();
h.set_mode("baseline");
s.reads = 0; s.log.length = 0;
let q = S.get_scenario_removals();
check("baseline mode: removals are empty and reads touch no storage beyond the (cached) mode key", q.removal_count === 0 && q.staff_ids.length === 0 && q.asset_ids.length === 0 && q.has_scenario === false && s.reads <= 1, "reads " + s.reads);
s.reads = 0;
S.get_scenario_removals(); S.get_scenario_removals();
check("baseline mode: repeated calls read no storage and return the same object", s.reads === 0 && S.get_scenario_removals() === q);
let w = S.set_scenario_removal("staff", "s1", true);
check("baseline mode: set refused (not_model_mode), nothing written", w.ok === false && w.reason === "not_model_mode" && s.log.length === 0);

// 2. Model mode, empty scenario
s = fresh();
check("setup: lock and Model mode", lock_and_enter_model());
const baseline_snap = baseline_only(s), real_snap = real_only(s);
check("an empty scenario created by set_mode reads as no removals", S.get_scenario_removals().removal_count === 0 && S.get_scenario_removals().has_scenario === false);

// 3. set and delete markers
s.log.length = 0;
w = S.set_scenario_removal("staff", "staff-1", true);
check("remove a staff member: ok, changed, one staff id served", w.ok === true && w.changed === true && S.get_scenario_removals().staff_ids.join() === "staff-1" && S.get_scenario_removals().asset_ids.length === 0, JSON.stringify(w));
check("the only key written is mirra_scenarios_v1", s.log.length === 1 && s.log[0][1] === "mirra_scenarios_v1", JSON.stringify(s.log));
check("real keys and baseline entries are byte-identical after the removal", same_map(real_only(s), real_snap) && same_map(baseline_only(s), baseline_snap));
let stored = JSON.parse(s.getItem("mirra_scenarios_v1"));
check("stored shape: version 1, one item with id, created_at, generation 1, empty added, one marker", stored.version === 1 && stored.items.length === 1 && typeof stored.items[0].id === "string" && typeof stored.items[0].created_at === "string" && stored.items[0].generation === 1 && Array.isArray(stored.items[0].added) && stored.items[0].added.length === 0 && JSON.stringify(stored.items[0].removed) === JSON.stringify([{ kind: "staff", id: "staff-1" }]), JSON.stringify(stored));
s.log.length = 0;
w = S.set_scenario_removal("staff", "staff-1", true);
check("removing the same staff member again is ok, unchanged, and writes nothing (idempotent)", w.ok === true && w.changed === false && s.log.length === 0);
S.set_scenario_removal("asset", "asset-9", true);
S.set_scenario_removal("staff", "staff-2", true);
check("assets and staff stack in the same scenario", S.get_scenario_removals().asset_ids.join() === "asset-9" && S.get_scenario_removals().staff_ids.join() === "staff-1,staff-2" && S.get_scenario_removals().removal_count === 3);
stored = JSON.parse(s.getItem("mirra_scenarios_v1"));
check("still ONE scenario in the list", stored.items.length === 1 && stored.items[0].removed.length === 3);
const scenario_id = stored.items[0].id;
s.reads = 0;
const warm_a = S.get_scenario_removals(), warm_b = S.get_scenario_removals();
check("a warm read touches no storage and returns the same object", s.reads === 0 && warm_a === warm_b);
w = S.set_scenario_removal("staff", "staff-1", false);
check("deleting a marker (undo) removes only that marker, the scenario keeps its id", w.ok === true && w.changed === true && S.get_scenario_removals().staff_ids.join() === "staff-2" && JSON.parse(s.getItem("mirra_scenarios_v1")).items[0].id === scenario_id);
s.log.length = 0;
w = S.set_scenario_removal("staff", "never-there", false);
check("deleting a marker that does not exist is ok, unchanged, writes nothing", w.ok === true && w.changed === false && s.log.length === 0);
S.set_scenario_removal("staff", "staff-2", false);
S.set_scenario_removal("asset", "asset-9", false);
stored = JSON.parse(s.getItem("mirra_scenarios_v1"));
check("removing the last marker leaves an empty scenario (still one item, removed empty) which reads as no removals", stored.items.length === 1 && stored.items[0].removed.length === 0 && S.get_scenario_removals().removal_count === 0);
check("real keys and baseline entries still byte-identical after the whole sequence", same_map(real_only(s), real_snap) && same_map(baseline_only(s), baseline_snap));

// 4. validation writes nothing
s.log.length = 0;
const bad = [["labour", "x"], ["", "x"], [null, "x"], ["staff", ""], ["staff", "   "], ["staff", null], ["staff", undefined], ["staff", 5], ["staff", "x".repeat(121)]];
check("invalid kind or id is refused with a message, nothing written", bad.every(([k, i]) => { const x = S.set_scenario_removal(k, i, true); return x.ok === false && typeof x.message === "string" && x.message.length > 0; }) && s.log.length === 0);
check("a 120-character id is allowed", S.set_scenario_removal("staff", "y".repeat(120), true).ok === true);
S.set_scenario_removal("staff", "y".repeat(120), false);

// 5. an external change is seen after the caches are cleared
s.map.set("mirra_scenarios_v1", JSON.stringify({ version: 1, items: [{ id: "ext", created_at: "2026-10-30T00:00:00.000Z", generation: 1, added: [], removed: [{ kind: "asset", id: "ext-asset" }] }] }));
check("before clearing, the cached answer is still served", S.get_scenario_removals().asset_ids.length === 0);
h.clear_model_caches();
check("clear_model_caches also clears the scenario cache (another tab's change is seen)", S.get_scenario_removals().asset_ids.join() === "ext-asset");

// 6. unknown items, item fields and marker fields survive a write
s.map.set("mirra_scenarios_v1", JSON.stringify({
  version: 1, note: "keep", items: [
    { id: "first", created_at: "t", generation: 1, added: [{ kind: "staff", temp_id: "tmp1" }], future_field: 7, removed: [{ kind: "asset", id: "keep-a", future_marker_field: "m" }] },
    { id: "second", created_at: "t2", generation: 1, added: [], removed: [] },
  ],
}));
h.clear_model_caches();
S.set_scenario_removal("staff", "new-s", true);
stored = JSON.parse(s.getItem("mirra_scenarios_v1"));
check("a second scenario in the list survives untouched", stored.items.length === 2 && stored.items[1].id === "second");
check("unknown item fields and the added list survive on the first scenario", stored.items[0].future_field === 7 && stored.items[0].added.length === 1 && stored.items[0].added[0].temp_id === "tmp1");
check("an existing marker keeps its extra field and the new marker is added", stored.items[0].removed.length === 2 && stored.items[0].removed[0].future_marker_field === "m" && stored.items[0].removed[1].id === "new-s");
check("unknown container fields survive", stored.note === "keep" && stored.version === 1);
check("only the first scenario is used for reads", S.get_scenario_removals().asset_ids.join() === "keep-a" && S.get_scenario_removals().staff_ids.join() === "new-s");

// 7. generation and the baseline_changed flag
s = fresh();
lock_and_enter_model();
S.set_scenario_removal("staff", "g-1", true);
check("fresh marker has an empty flag", S.get_scenario_removals().flags["staff:g-1"] === "", JSON.stringify(S.get_scenario_removals().flags));
h.set_mode("baseline");
L.unlock_baseline({ confirmed: true });
s.map.set(GO, go_value("2026-06-06T00:00:00.000Z").replace("38700", "50000"));
L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
h.set_mode("model");
check("baseline relocked (generation 2): the marker is kept and flagged baseline_changed", S.get_scenario_removals().staff_ids.join() === "g-1" && S.get_scenario_removals().flags["staff:g-1"] === "baseline_changed", JSON.stringify(S.get_scenario_removals().flags));
S.set_scenario_removal("asset", "g-2", true);
check("changing the scenario re-stamps the generation and clears the flag", JSON.parse(s.getItem("mirra_scenarios_v1")).items[0].generation === 2 && S.get_scenario_removals().flags["staff:g-1"] === "" && S.get_scenario_removals().flags["asset:g-2"] === "");

// 8. storage full leaves the layer exactly as it was
s = fresh();
lock_and_enter_model();
S.set_scenario_removal("staff", "full-1", true);
const before_text = s.getItem("mirra_scenarios_v1");
s.capacity = s.used();
w = S.set_scenario_removal("asset", "full-2", true);
check("storage full: refused with the stopgap message and the scenario is unchanged", w.ok === false && w.reason === "storage_full" && w.message === h.MODEL_STORAGE_FULL_MESSAGE && s.getItem("mirra_scenarios_v1") === before_text);
check("storage full: reads still serve the old scenario", S.get_scenario_removals().staff_ids.join() === "full-1" && S.get_scenario_removals().asset_ids.length === 0);

// 9. subscribers
s = fresh();
lock_and_enter_model();
let calls = 0;
const unsubscribe = S.subscribe_to_scenarios(() => { calls += 1; });
S.subscribe_to_scenarios(() => { throw new Error("broken subscriber"); });
S.set_scenario_removal("staff", "sub-1", true);
check("a successful change notifies subscribers once, and a broken subscriber does not stop the write", calls === 1 && S.get_scenario_removals().staff_ids.join() === "sub-1");
S.set_scenario_removal("staff", "sub-1", true);
check("an unchanged call does not notify", calls === 1);
unsubscribe();
S.set_scenario_removal("staff", "sub-1", false);
check("an unsubscribed callback is not called again", calls === 1);
check("a bad callback is ignored", typeof S.subscribe_to_scenarios(null) === "function");

// 10. file sizes and key names
for (const rel of ["lib/calculations/scenarioRemovals.js", "lib/storage/modelScenarios.js", "Py/model_storage_tests/s4_removals.test.mjs"]) {
  const lines = fs.readFileSync(path.join(root, rel), "utf8").split("\n").length;
  check(rel + " is under 600 lines (" + lines + ")", lines < 600);
}
check("modelScenarios.js reads and writes only through the registry key name (no hard-coded mirra_ literal)", !/["']mirra_/.test(fs.readFileSync(path.join(storage_dir, "modelScenarios.js"), "utf8").replace(/\/\/.*$/gm, "")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
