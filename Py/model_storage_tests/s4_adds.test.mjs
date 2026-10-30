// R3 slice 4 batch C1 test. READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\s4_adds.test.mjs
// Checks lib/calculations/scenarioAdds.js (validation, ids, rows, non-productive total, productive placements, identity, inputs never mutated) and the
// ADDS part of lib/storage/modelScenarios.js (baseline mode reads nothing, add / copy N / remove, exact saved shape, only mirra_scenarios_v1 is written,
// real keys, baseline entries and mirra_diffs_v1 stay byte-identical, removals and unknown fields survive, generation and baseline_changed, storage full
// leaves the layer as it was, 1,000 rapid adds are unique, files stay under 600 lines). Exit code 0 only if every check passes.
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

const A = await import(pathToFileURL(path.join(root, "lib", "calculations", "scenarioAdds.js")).href);
const h = await import(pathToFileURL(path.join(storage_dir, "modelStorage.js")).href);
const L = await import(pathToFileURL(path.join(storage_dir, "modelBaselineLock.js")).href);
const S = await import(pathToFileURL(path.join(storage_dir, "modelScenarios.js")).href);

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const keys_of = (o) => Object.keys(o).sort().join(",");

// ---------- A. scenarioAdds.js (pure) ----------
const good_staff = { kind: "staff", name: "  Estimator  ", is_productive: true, annual_cost: 85000.456, productive_hours: 1600, group_id: "group_a" };
let v = A.validate_add_input(good_staff);
check("validate: a good productive staff add passes, name trimmed, cost to the cent, hours and group kept", v.ok === true && v.value.name === "Estimator" && v.value.annual_cost === 85000.46 && v.value.productive_hours === 1600 && v.value.group_id === "group_a", JSON.stringify(v));
v = A.validate_add_input({ kind: "staff", name: "Office", is_productive: false, annual_cost: 60000, productive_hours: 1600, group_id: "group_a", id: "staff_1", copy_of: "x" });
check("validate: a non-productive add drops productive_hours and group_id, and ignores any id / copy_of passed in", v.ok === true && keys_of(v.value) === "annual_cost,is_productive,kind,name", JSON.stringify(v));
const rejects = [
  ["not an object", null, "add_bad_kind"], ["an array", [], "add_bad_kind"], ["bad kind", { ...good_staff, kind: "vehicle" }, "add_bad_kind"],
  ["empty name", { ...good_staff, name: "   " }, "add_bad_name"], ["name too long", { ...good_staff, name: "x".repeat(81) }, "add_bad_name"], ["name not a string", { ...good_staff, name: 5 }, "add_bad_name"],
  ["is_productive not boolean", { ...good_staff, is_productive: "yes" }, "add_bad_is_productive"],
  ["cost negative", { ...good_staff, annual_cost: -1 }, "add_bad_cost"], ["cost a string", { ...good_staff, annual_cost: "5" }, "add_bad_cost"], ["cost NaN", { ...good_staff, annual_cost: NaN }, "add_bad_cost"], ["cost Infinity", { ...good_staff, annual_cost: Infinity }, "add_bad_cost"],
  ["productive without hours", { ...good_staff, productive_hours: undefined }, "add_bad_hours"], ["productive with zero hours", { ...good_staff, productive_hours: 0 }, "add_bad_hours"], ["productive with negative hours", { ...good_staff, productive_hours: -5 }, "add_bad_hours"],
  ["productive without group", { ...good_staff, group_id: "" }, "add_bad_group"], ["productive with a blank group", { ...good_staff, group_id: "   " }, "add_bad_group"],
];
for (const [label, input, reason] of rejects) {
  const r = A.validate_add_input(input);
  check("validate: rejects " + label + " (" + reason + ")", r.ok === false && r.reason === reason, JSON.stringify(r));
}
check("validate: name of exactly 80 characters and cost of exactly 0 are accepted", A.validate_add_input({ ...good_staff, name: "x".repeat(80), annual_cost: 0 }).ok === true);

// ids
check("ids: is_scratch_id accepts scratch ids and rejects real-looking ids and junk", A.is_scratch_id("scratch_abc") && !A.is_scratch_id("staff_1") && !A.is_scratch_id("asset_1") && !A.is_scratch_id("scratch_") && !A.is_scratch_id("") && !A.is_scratch_id(null) && !A.is_scratch_id(5) && !A.is_scratch_id("xscratch_a"));
const many = new Set();
for (let i = 0; i < 1000; i += 1) many.add(A.new_scratch_id([], 1700000000000, () => 0.5));
check("ids: 1,000 ids made with the same clock and the same random number are all unique", many.size === 1000);
check("ids: every id starts with scratch_ and is a base36 string after it", [...many].every((id) => /^scratch_[0-9a-z]+$/.test(id)));
const taken = new Set(["scratch_zzz"]);
check("ids: an id already stored is never handed out again", A.new_scratch_id(taken) !== "scratch_zzz");

// rows and totals
const adds = [
  { id: "scratch_h1", kind: "staff", name: "Office hire", is_productive: false, annual_cost: 62345.67 },
  { id: "scratch_v1", kind: "asset", name: "Ute 1", is_productive: false, annual_cost: 8123.45 },
  { id: "scratch_v2", kind: "asset", name: "Ute 2", is_productive: false, annual_cost: 8123.45, copy_of: "scratch_v1" },
  { id: "scratch_v3", kind: "asset", name: "Ute 3", is_productive: false, annual_cost: 8123.45, copy_of: "scratch_v1" },
  { id: "scratch_d1", kind: "asset", name: "Digger", is_productive: true, annual_cost: 45000, productive_hours: 900, group_id: "group_b" },
  ...[1, 2, 3, 4, 5].map((n) => ({ id: "scratch_p" + n, kind: "staff", name: "Hire " + n, is_productive: true, annual_cost: 70000, productive_hours: 1600, group_id: "group_a" })),
];
const adds_snapshot = JSON.stringify(adds);
check("total: office hire + 3 vehicles = 86,716.02 exactly; the digger and the 5 productive hires are not counted", A.non_productive_total(adds) === 86716.02, String(A.non_productive_total(adds)));
check("total: float trap 0.1 + 0.2 sums to exactly 0.3", A.non_productive_total([{ id: "scratch_a", kind: "staff", name: "a", is_productive: false, annual_cost: 0.1 }, { id: "scratch_b", kind: "staff", name: "b", is_productive: false, annual_cost: 0.2 }]) === 0.3);
check("total: empty, undefined and junk entries give 0", A.non_productive_total([]) === 0 && A.non_productive_total(undefined) === 0 && A.non_productive_total([null, 5, { id: "staff_1", is_productive: false, annual_cost: 9 }]) === 0);
const staff_rows = A.build_added_staff_rows(adds);
check("staff rows: 6 rows (office hire + 5 hires), none for assets", staff_rows.length === 6 && staff_rows.every((r) => r.staff_id.startsWith("scratch_")));
const p1 = staff_rows.find((r) => r.staff_id === "scratch_p1"), h1 = staff_rows.find((r) => r.staff_id === "scratch_h1");
check("staff rows: a productive row has class productive, contributes to recovery hours, its cost and its hours", p1.labour_class === "productive" && p1.is_productive === true && p1.contributes_to_recovery_hours === true && p1.annual_labour_cost === 70000 && p1.productive_hours_annual === 1600);
check("staff rows: a non-productive row has class support, no recovery hours and 0 productive hours", h1.labour_class === "support" && h1.is_productive === false && h1.contributes_to_recovery_hours === false && h1.productive_hours_annual === 0 && h1.annual_labour_cost === 62345.67);
const type_ids = staff_rows.map((r) => r.staff_type_id);
check("staff rows: every add has its OWN scratch staff type, none equals a real-looking type id", new Set(type_ids).size === 6 && type_ids.every((t) => t.startsWith("scratch_type_")) && !type_ids.includes("staff_type_1"));
const asset_rows = A.build_added_asset_rows(adds);
const d1 = asset_rows.find((r) => r.asset_id === "scratch_d1"), v1 = asset_rows.find((r) => r.asset_id === "scratch_v1");
check("asset rows: 4 rows (3 vehicles + digger); a vehicle is support with 0 hours, the digger is productive with 900 hours; pools start empty", asset_rows.length === 4 && v1.asset_type === "support" && v1.utilisation_hours_annual === 0 && v1.asset_recovery_cost_annual === 8123.45 && d1.asset_type === "productive" && d1.utilisation_hours_annual === 900 && same(d1.asset_overhead_pool_assignments, {}) && d1.is_retired === false);
const pl = A.productive_placements(adds);
check("placements: only the digger and the 5 hires, each with group, hours and (staff only) its scratch type", pl.length === 6 && pl.every((p) => p.id !== "scratch_h1" && p.id !== "scratch_v1") && pl.find((p) => p.id === "scratch_d1").group_id === "group_b" && pl.find((p) => p.id === "scratch_d1").hours === 900 && pl.find((p) => p.id === "scratch_d1").staff_type_id === null && pl.find((p) => p.id === "scratch_p3").staff_type_id === A.scratch_staff_type_id("scratch_p3") && pl.find((p) => p.id === "scratch_p3").hours === 1600);
check("pure: inputs are not mutated and rows are new objects", JSON.stringify(adds) === adds_snapshot && p1 !== adds.find((a) => a.id === "scratch_p1"));
check("pure: no adds gives the SAME frozen empty result every time", A.build_added_staff_rows([]) === A.build_added_staff_rows(undefined) && A.build_added_asset_rows([]) === A.build_added_asset_rows(null) && A.productive_placements([]) === A.productive_placements(undefined) && Object.isFrozen(A.build_added_staff_rows([])) && A.build_added_staff_rows(adds.filter((a) => a.kind === "asset")) === A.build_added_staff_rows([]));
check("pure: an entry that is invalid or has a real id is ignored everywhere", A.build_added_staff_rows([{ id: "staff_1", kind: "staff", name: "x", is_productive: true, annual_cost: 1, productive_hours: 1, group_id: "g" }]).length === 0 && A.productive_placements([{ id: "scratch_x", kind: "staff", name: "x", is_productive: true, annual_cost: 1 }]).length === 0);

// ---------- B. modelScenarios.js, adds ----------
const GO = "qs_tools_general_overhead_state", PNL = "qs_tools_profit_and_loss_state";
const go_value = (stamp = "2026-01-01T00:00:00.000Z") => JSON.stringify({ overhead_profile_id: "p1", vehicle_running_cost_annual: 38700, created_at: "2026-01-01T00:00:00.000Z", updated_at: stamp });
const real_data = () => ({ [GO]: go_value(), [PNL]: JSON.stringify({ revenue: 1000 }) });
const ready = () => ({ loaded: true, overall_status: "ready", blocking_count: 0, warning_count: 0, checked_at: "2026-10-30T00:00:00.000Z" });
function fresh(capacity = Infinity, data = real_data()) {
  const s = new FakeStorage(capacity);
  for (const [k, val] of Object.entries(data)) s.map.set(k, val);
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
const stored_scn = (s) => JSON.parse(s.getItem("mirra_scenarios_v1"));
const DIFFS = "mirra_diffs_v1", SCN = "mirra_scenarios_v1";

const prod_staff = (extra = {}) => ({ kind: "staff", name: "Site hand", is_productive: true, annual_cost: 70000, productive_hours: 1600, group_id: "group_a", ...extra });
const office = (extra = {}) => ({ kind: "staff", name: "Office hire", is_productive: false, annual_cost: 62345.67, ...extra });

// 1. baseline mode
let s = fresh();
h.set_mode("baseline");
s.reads = 0; s.log.length = 0;
let q = S.get_scenario_adds();
check("baseline mode: adds are empty and reads touch no storage beyond the (cached) mode key", q.add_count === 0 && q.adds.length === 0 && q.has_scenario === false && s.reads <= 1, "reads " + s.reads);
s.reads = 0;
S.get_scenario_adds(); S.get_scenario_adds();
check("baseline mode: repeated calls read no storage and return the same frozen object", s.reads === 0 && S.get_scenario_adds() === q && Object.isFrozen(q));
for (const [label, call] of [["add", () => S.add_scenario_add(prod_staff())], ["copy", () => S.copy_scenario_add("scratch_a", 1)], ["remove", () => S.remove_scenario_add("scratch_a")]]) {
  const r = call();
  check("baseline mode: " + label + " refused (not_model_mode), nothing written", r.ok === false && r.reason === "not_model_mode" && s.log.length === 0);
}

// 2. Model mode, empty
s = fresh();
check("setup: lock and Model mode", lock_and_enter_model());
const baseline_snap = baseline_only(s), real_snap = real_only(s);
const diffs_before = s.getItem(DIFFS);
check("an empty scenario created by set_mode reads as no adds", S.get_scenario_adds().add_count === 0 && S.get_scenario_adds().has_scenario === false);
const empty_scn_text = s.getItem(SCN);

// 3. add
s.log.length = 0;
let w = S.add_scenario_add(prod_staff());
const id1 = w.id;
check("add a productive staff member: ok, changed, scratch id, entry returned", w.ok === true && w.changed === true && A.is_scratch_id(id1) && w.add.id === id1 && w.adds.add_count === 1, JSON.stringify(w));
check("the only key written is mirra_scenarios_v1", s.log.length === 1 && s.log[0][1] === SCN, JSON.stringify(s.log));
let stored = stored_scn(s);
check("stored shape: version 1, one item with id, created_at, generation 1, one add, empty removed", stored.version === 1 && stored.items.length === 1 && typeof stored.items[0].id === "string" && typeof stored.items[0].created_at === "string" && stored.items[0].generation === 1 && stored.items[0].added.length === 1 && same(stored.items[0].removed, []), JSON.stringify(stored));
check("the stored add has EXACTLY id, kind, name, is_productive, annual_cost, productive_hours, group_id (no copy_of)", keys_of(stored.items[0].added[0]) === "annual_cost,group_id,id,is_productive,kind,name,productive_hours", keys_of(stored.items[0].added[0]));
check("real keys, baseline entries and mirra_diffs_v1 are byte-identical after the add", same_map(real_only(s), real_snap) && same_map(baseline_only(s), baseline_snap) && s.getItem(DIFFS) === diffs_before);
const scenario_id = stored.items[0].id;
w = S.add_scenario_add(office({ productive_hours: 1600, group_id: "group_a" }));
const id2 = w.id;
stored = stored_scn(s);
check("a non-productive add stores no productive_hours or group_id even when passed", keys_of(stored.items[0].added[1]) === "annual_cost,id,is_productive,kind,name" && stored.items[0].added[1].annual_cost === 62345.67, keys_of(stored.items[0].added[1]));
w = S.add_scenario_add({ kind: "asset", name: "Digger", is_productive: true, annual_cost: 45000, productive_hours: 900, group_id: "group_b" });
const id3 = w.id;
check("staff and assets stack in the same scenario; still ONE scenario in the list with the same id", S.get_scenario_adds().add_count === 3 && S.get_scenario_adds().staff_adds.length === 2 && S.get_scenario_adds().asset_adds.length === 1 && stored_scn(s).items.length === 1 && stored_scn(s).items[0].id === scenario_id);
w = S.add_scenario_add({ ...prod_staff(), id: "staff_1" });
check("an id passed in the input is ignored: the stored id is a fresh scratch id", w.ok === true && w.id !== "staff_1" && A.is_scratch_id(w.id) && !stored_scn(s).items[0].added.some((e) => e.id === "staff_1"));
const id4 = w.id;
S.remove_scenario_add(id4);

// 4. validation writes nothing
s.log.length = 0;
const text_before_bad = s.getItem(SCN);
let all_bad = true;
for (const [label, input, reason] of rejects) {
  const r = S.add_scenario_add(input);
  if (!(r.ok === false && r.reason === reason && typeof r.message === "string" && r.message.length > 0)) { all_bad = false; console.log("  bad case failed: " + label + " " + JSON.stringify(r)); }
}
check("every invalid add is refused with its reason and a message", all_bad);
check("invalid adds wrote nothing and changed nothing", s.log.length === 0 && s.getItem(SCN) === text_before_bad);

// 5. copy N
s.log.length = 0;
w = S.copy_scenario_add(id1, 3);
check("copy 3: ok, changed, three new ids", w.ok === true && w.changed === true && w.ids.length === 3 && new Set(w.ids).size === 3 && w.ids.every((id) => A.is_scratch_id(id) && id !== id1), JSON.stringify(w));
check("copy: the only key written is mirra_scenarios_v1", s.log.length === 1 && s.log[0][1] === SCN);
const copies = w.ids.slice();
stored = stored_scn(s);
const original = stored.items[0].added.find((e) => e.id === id1);
const copy_entries = copies.map((cid) => stored.items[0].added.find((e) => e.id === cid));
check("copy: each copy equals the original except its id and copy_of, and copy_of is the original", copy_entries.every((c) => c.copy_of === id1 && c.name === original.name && c.annual_cost === original.annual_cost && c.productive_hours === original.productive_hours && c.group_id === original.group_id && c.kind === original.kind && c.is_productive === original.is_productive) && original.copy_of === undefined);
w = S.copy_scenario_add(copies[0], 2);
const grand = w.ids.map((cid) => stored_scn(s).items[0].added.find((e) => e.id === cid));
check("copy of a copy points at the ORIGINAL, not at the copy", w.ok === true && grand.every((c) => c.copy_of === id1));
check("the scenario now holds 3 + 3 + 2 = 8 adds, all ids unique", S.get_scenario_adds().add_count === 8 && new Set(S.get_scenario_adds().adds.map((a) => a.id)).size === 8);
s.log.length = 0;
const text_before_bad_copy = s.getItem(SCN);
const bad_counts = [0, -1, 51, 2.5, "3", NaN, Infinity, null, undefined];
check("copy: counts 0, -1, 51, 2.5, '3', NaN, Infinity, null, undefined are all refused (bad_copy_count)", bad_counts.every((n) => { const r = S.copy_scenario_add(id1, n); return r.ok === false && r.reason === "bad_copy_count"; }));
check("copy: an unknown id, a real id and a non-string are refused (unknown_add) and nothing is written", ["scratch_nope", "staff_1", "asset_1", "", null, 7].every((bad) => { const r = S.copy_scenario_add(bad, 1); return r.ok === false && r.reason === "unknown_add"; }) && s.log.length === 0 && s.getItem(SCN) === text_before_bad_copy);
w = S.copy_scenario_add(id1, 50);
check("copy: exactly 50 is allowed", w.ok === true && w.ids.length === 50 && S.get_scenario_adds().add_count === 58);
check("copy: all 58 ids still unique", new Set(S.get_scenario_adds().adds.map((a) => a.id)).size === 58);

// 6. remove
s.log.length = 0;
w = S.remove_scenario_add(copies[0]);
check("remove one copy: ok, changed, only that id is gone, the scenario keeps its id", w.ok === true && w.changed === true && S.get_scenario_adds().add_count === 57 && !S.get_scenario_adds().adds.some((a) => a.id === copies[0]) && stored_scn(s).items[0].id === scenario_id);
check("removing a copy leaves its own copies (grandchildren) in place", grand.every((g) => S.get_scenario_adds().adds.some((a) => a.id === g.id)));
s.log.length = 0;
w = S.remove_scenario_add("scratch_never_there");
check("removing an id that is not there is ok, unchanged and writes nothing", w.ok === true && w.changed === false && s.log.length === 0);
check("removing an empty or non-string id is refused (bad_id)", S.remove_scenario_add("").reason === "bad_id" && S.remove_scenario_add(null).reason === "bad_id" && S.remove_scenario_add("   ").reason === "bad_id");
w = S.remove_scenario_add(id1);
check("removing the ORIGINAL leaves its copies (they are independent)", w.ok === true && copies.slice(1).every((cid) => S.get_scenario_adds().adds.some((a) => a.id === cid)));

// 7. preservation: removals, other items, unknown fields, junk entries
s = fresh();
lock_and_enter_model();
const real_snap2 = real_only(s), baseline_snap2 = baseline_only(s), diffs2 = s.getItem(DIFFS);
S.set_scenario_removal("staff", "staff-1", true);
S.set_scenario_removal("asset", "asset-9", true);
const a1 = S.add_scenario_add(prod_staff()).id;
check("removals survive an add, and the add survives them", S.get_scenario_removals().removal_count === 2 && S.get_scenario_adds().add_count === 1);
S.set_scenario_removal("staff", "staff-1", false);
check("deleting a removal marker does not touch the adds", S.get_scenario_adds().add_count === 1 && S.get_scenario_removals().removal_count === 1);
S.set_scenario_removal("staff", "staff-1", true);
S.copy_scenario_add(a1, 2);
S.remove_scenario_add(a1);
check("copy and remove leave the removal markers alone", S.get_scenario_removals().removal_count === 2 && S.get_scenario_removals().staff_ids.join() === "staff-1" && S.get_scenario_removals().asset_ids.join() === "asset-9");
// hand-edit storage: unknown item field, second item, unknown field on an add, one junk entry in added, unknown container field
let raw = stored_scn(s);
raw.note = "container extra";
raw.items[0].note = "item extra";
raw.items[0].added[0].custom = { keep: "me" };
raw.items[0].added.push({ junk: true });
raw.items.push({ id: "scenario_second", created_at: "x", generation: 1, added: [{ id: "scratch_other", kind: "staff", name: "O", is_productive: false, annual_cost: 1 }], removed: [] });
s.map.set(SCN, JSON.stringify(raw));
h.clear_model_caches();
check("a junk entry in added[] is skipped on read (not counted, no crash)", S.get_scenario_adds().add_count === 2 && S.get_scenario_adds().adds.every((a) => A.is_scratch_id(a.id)));
const temp_id = S.add_scenario_add(office()).id;
S.remove_scenario_add(temp_id);
const after = stored_scn(s);
check("unknown container field, unknown item field, unknown add field, the junk entry and the second item all survive adds and removes", after.note === "container extra" && after.items[0].note === "item extra" && after.items[0].added.some((e) => e.junk === true) && after.items.length === 2 && after.items[1].id === "scenario_second" && after.items[1].added[0].id === "scratch_other" && after.items[0].added.some((e) => e.custom && e.custom.keep === "me"), JSON.stringify(after));
check("only the first scenario is used: the second item's add is not counted", !S.get_scenario_adds().adds.some((a) => a.id === "scratch_other"));
check("real keys, baseline entries and mirra_diffs_v1 byte-identical through all of section 7", same_map(real_only(s), real_snap2) && same_map(baseline_only(s), baseline_snap2) && s.getItem(DIFFS) === diffs2);

// 8. generation and baseline_changed
s = fresh();
lock_and_enter_model();
const g_id = S.add_scenario_add(prod_staff()).id;
check("flag: right after an add the flag is empty and generation is stamped", S.get_scenario_adds().flags[g_id] === "" && stored_scn(s).items[0].generation === 1);
raw = stored_scn(s); raw.items[0].generation = 99; s.map.set(SCN, JSON.stringify(raw));
h.clear_model_caches();
check("flag: a scenario stamped with another generation reports baseline_changed for every add", S.get_scenario_adds().flags[g_id] === "baseline_changed");
S.add_scenario_add(office());
check("flag: the next change re-stamps the generation and clears the flag", S.get_scenario_adds().flags[g_id] === "" && stored_scn(s).items[0].generation === 1);

// 9. cache identity
s.reads = 0;
const warm_a = S.get_scenario_adds(), warm_b = S.get_scenario_adds();
check("a warm read touches no storage and returns the same object; a write returns a new one", s.reads === 0 && warm_a === warm_b && (S.add_scenario_add(office()), S.get_scenario_adds() !== warm_a));

// 10. storage full
s = fresh();
lock_and_enter_model();
S.add_scenario_add(prod_staff());
const full_text = s.getItem(SCN), full_count = S.get_scenario_adds().add_count;
s.capacity = s.used() + 5;
w = S.add_scenario_add(office());
check("storage full on add: refused with storage_full and the standing message", w.ok === false && w.reason === "storage_full" && w.message === S.SCENARIO_MESSAGES.storage_full, JSON.stringify(w));
check("storage full: the layer is exactly as it was", s.getItem(SCN) === full_text && S.get_scenario_adds().add_count === full_count);
w = S.copy_scenario_add(S.get_scenario_adds().adds[0].id, 5);
check("storage full on copy: refused, layer unchanged", w.ok === false && w.reason === "storage_full" && s.getItem(SCN) === full_text);

// 11. 1,000 rapid adds, then remove everything
s = fresh();
lock_and_enter_model();
const real_snap3 = real_only(s), baseline_snap3 = baseline_only(s), diffs3 = s.getItem(DIFFS);
const first = S.add_scenario_add(prod_staff()).id;
for (let i = 0; i < 19; i += 1) S.copy_scenario_add(first, 50);
const all = S.get_scenario_adds().adds;
check("1,000 rapid adds (1 + 19 x 50 = 951 here, via copy) are all unique and stored", all.length === 951 && new Set(all.map((a) => a.id)).size === 951);
for (let i = 0; i < 49; i += 1) S.add_scenario_add(i % 2 ? office() : prod_staff());
check("1,000 adds in total, all unique", S.get_scenario_adds().add_count === 1000 && new Set(S.get_scenario_adds().adds.map((a) => a.id)).size === 1000);
const removed_ids = S.get_scenario_adds().adds.map((a) => a.id);
for (const rid of removed_ids) S.remove_scenario_add(rid);
stored = stored_scn(s);
check("removing every add leaves added = [] and the read is the empty answer (count 0)", same(stored.items[0].added, []) && S.get_scenario_adds().add_count === 0 && S.get_scenario_adds().adds.length === 0 && S.get_scenario_adds().staff_adds.length === 0);
const reuse = new Set(removed_ids);
check("ids of removed adds are never handed out again", Array.from({ length: 50 }, () => S.add_scenario_add(prod_staff()).id).every((nid) => !reuse.has(nid)));
check("real keys, baseline entries and mirra_diffs_v1 byte-identical after 1,000 adds and removals", same_map(real_only(s), real_snap3) && same_map(baseline_only(s), baseline_snap3) && s.getItem(DIFFS) === diffs3);

// 12. cannot write in baseline mode / unlocked baseline
s = fresh();
h.set_mode("baseline");
check("an unlocked baseline refuses an add", S.add_scenario_add(prod_staff()).ok === false);

// 13. file sizes
for (const f of [path.join(root, "lib", "calculations", "scenarioAdds.js"), path.join(storage_dir, "modelScenarios.js"), fileURLToPath(import.meta.url)]) {
  const lines = fs.readFileSync(f, "utf8").split("\n").length;
  check("file stays under 600 lines: " + path.basename(f) + " (" + lines + ")", lines < 600);
}
check("scenarioAdds.js has no imports (pure)", !/^import\s/m.test(fs.readFileSync(path.join(root, "lib", "calculations", "scenarioAdds.js"), "utf8")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
