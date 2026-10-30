// R3 slice 4, batch B, part 1 (Business Modelling brief, Addendum 18 items 7 to 12; Addendum 23 item 7; owner confirmation and generation stamp 2026-10-30, Addendum 24).
// The SCENARIO layer: removals (batch B) are markers saying "this staff member / this asset is removed in the scenario"; scratch ADDS (batch C1, Addendum 26)
// are staff and assets that exist only in the scenario. Both are kept in mirra_scenarios_v1.
// A marker is only an id. Real data, the baseline and the modelled layer (mirra_diffs_v1) are never touched. Removal keeps the original id, so deleting the marker returns
// exactly to the modelled numbers.
//
// Record shape (owner confirmed): mirra_scenarios_v1 = { version: 1, items: [ { id, created_at, generation, added: [], removed: [ { kind: "staff" | "asset", id } ] } ] }
//   A LIST from day one, ONE scenario used for now (items[0]); further items, unknown item fields and unknown marker fields are preserved on every write (project instruction 6b).
//   generation = the baseline generation when the scenario was last changed. If the baseline has since been re-locked, reads report flag "baseline_changed" for every marker
//   until the next change re-stamps it (same rule as the overhead nudge in modelDiffs.js).
// Baseline mode: get_scenario_removals() returns a frozen empty answer and reads NO storage (Model mode OFF stays byte-identical to before).
// Imports only the registry and modelStorage.js, so it runs in plain node for the tests.

import { NEW_KEYS } from "./modelStorageRegistry.js";
import { MODEL_STORAGE_FULL_MESSAGE, get_mode, is_baseline_locked, on_clear_model_caches } from "./modelStorage.js";
import { MAX_COPIES, is_scratch_id, is_valid_stored_add, new_scratch_id, validate_add_input } from "../calculations/scenarioAdds.js";

export const SCENARIO_KINDS = ["staff", "asset"];
export const FLAG_BASELINE_CHANGED = "baseline_changed";
const MAX_ID_LENGTH = 120;

export const SCENARIO_MESSAGES = {
  not_model_mode: "Scenario changes can only be made in Model mode.",
  baseline_not_locked: "A scenario needs a locked baseline. Nothing was changed.",
  bad_kind: "Only staff or assets can be removed. Nothing was changed.",
  bad_id: "That item could not be identified. Nothing was changed.",
  add_bad_kind: "Only staff or assets can be added. Nothing was changed.",
  add_bad_name: "Give the item a name of 1 to 80 characters. Nothing was changed.",
  add_bad_is_productive: "Say whether the item is productive or not. Nothing was changed.",
  add_bad_cost: "The annual cost must be a number of zero or more. Nothing was changed.",
  add_bad_hours: "A productive item needs hours above zero. Nothing was changed.",
  add_bad_group: "A productive item needs a working group. Nothing was changed.",
  bad_copy_count: "The number of copies must be a whole number from 1 to " + MAX_COPIES + ". Nothing was changed.",
  unknown_add: "That added item was not found. Nothing was changed.",
  storage_full: MODEL_STORAGE_FULL_MESSAGE,
  write_failed: "The change could not be saved. Nothing was changed.",
};

const EMPTY_IDS = Object.freeze([]);
const EMPTY_REMOVALS = Object.freeze({
  staff_ids: EMPTY_IDS,
  asset_ids: EMPTY_IDS,
  flags: Object.freeze({}),
  has_scenario: false,
  removal_count: 0,
});

// ---------- cache (cleared with the rest through on_clear_model_caches, and after every write here) ----------
let scenarios_cache = undefined;
let removals_cache = undefined;
let adds_cache = undefined;

export function clear_scenarios_cache() {
  scenarios_cache = undefined;
  removals_cache = undefined;
  adds_cache = undefined;
}

on_clear_model_caches(clear_scenarios_cache);

// Same-tab subscribers: every mounted copy of useLabour / useAssets (the page, the sidebar's reconciliation, Cost Allocation, Business Outcome)
// holds its own copy of the answer, so a successful write tells them all to re-read.
const listeners = new Set();

export function subscribe_to_scenarios(callback) {
  if (typeof callback !== "function") return () => {};
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify_listeners() {
  for (const callback of Array.from(listeners)) {
    try {
      callback();
    } catch {
      // ignore: one broken subscriber must not stop the others or fail the write
    }
  }
}

function read_json(key) {
  try {
    const text = window.localStorage.getItem(key);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function is_quota_error(error) {
  if (!error) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014 ||
    /quota/i.test(String(error.message || ""))
  );
}

function fail(reason) {
  return { ok: false, reason, message: SCENARIO_MESSAGES[reason] };
}

function baseline_generation() {
  const meta = read_json(NEW_KEYS.baseline_meta);
  return meta && Number.isFinite(meta.generation) ? meta.generation : 0;
}

function is_marker(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    SCENARIO_KINDS.includes(entry.kind) &&
    typeof entry.id === "string" &&
    entry.id !== ""
  );
}

// Reads mirra_scenarios_v1 as a plain object. Anything not understood is kept as it was (rest_of_items) so a write never drops it.
function normalise_scenarios(parsed) {
  const items = parsed && Array.isArray(parsed.items) ? parsed.items : [];
  return { container: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}, items };
}

function load_scenarios() {
  if (scenarios_cache !== undefined) return scenarios_cache;
  scenarios_cache = normalise_scenarios(read_json(NEW_KEYS.scenarios));
  return scenarios_cache;
}

function first_item(items) {
  return items.length > 0 && items[0] !== null && typeof items[0] === "object" ? items[0] : null;
}

// ---------- read ----------
// { staff_ids: [...], asset_ids: [...], flags: { "<kind>:<id>": "" | "baseline_changed" }, has_scenario, removal_count }.
// Empty in baseline mode, and then no storage is read at all. In Model mode it is read and parsed once and held until something clears the caches.
// The returned object keeps the same identity until the layer changes, so a hook can use it as a memo dependency.
export function get_scenario_removals() {
  if (get_mode() !== "model") return EMPTY_REMOVALS;
  if (removals_cache !== undefined) return removals_cache;
  const { items } = load_scenarios();
  const item = first_item(items);
  if (!item) {
    removals_cache = EMPTY_REMOVALS;
    return removals_cache;
  }
  const stale = Number.isFinite(item.generation) ? item.generation !== baseline_generation() : baseline_generation() !== 0;
  const markers = Array.isArray(item.removed) ? item.removed.filter(is_marker) : [];
  const staff_ids = [];
  const asset_ids = [];
  const flags = {};
  for (const marker of markers) {
    const bucket = marker.kind === "staff" ? staff_ids : asset_ids;
    if (!bucket.includes(marker.id)) bucket.push(marker.id);
    flags[marker.kind + ":" + marker.id] = stale ? FLAG_BASELINE_CHANGED : "";
  }
  removals_cache = Object.freeze({
    staff_ids: Object.freeze(staff_ids),
    asset_ids: Object.freeze(asset_ids),
    flags: Object.freeze(flags),
    has_scenario: true,
    removal_count: staff_ids.length + asset_ids.length,
  });
  return removals_cache;
}

// ---------- write ----------
// Adds (removed = true) or deletes (removed = false) one marker. The ONLY key this writes is mirra_scenarios_v1. Model mode and a locked baseline only.
// Adding a marker that already exists, or deleting one that does not, changes nothing and writes nothing (still ok). The first removal creates the scenario.
export function set_scenario_removal(kind, id, removed) {
  if (get_mode() !== "model") return fail("not_model_mode");
  if (!is_baseline_locked()) return fail("baseline_not_locked");
  if (!SCENARIO_KINDS.includes(kind)) return fail("bad_kind");
  if (typeof id !== "string" || id.trim() === "" || id.length > MAX_ID_LENGTH) return fail("bad_id");

  try {
    // Read fresh (not through the cache): another tab may have written since.
    const current = normalise_scenarios(read_json(NEW_KEYS.scenarios));
    const items = current.items.slice();
    const existing = first_item(items);
    const markers = existing && Array.isArray(existing.removed) ? existing.removed.slice() : [];
    const index = markers.findIndex((m) => is_marker(m) && m.kind === kind && m.id === id);

    if (removed === true && index !== -1) return { ok: true, changed: false, removals: get_scenario_removals() };
    if (removed !== true && index === -1) return { ok: true, changed: false, removals: get_scenario_removals() };

    if (removed === true) markers.push({ kind, id });
    else markers.splice(index, 1);

    const generation = baseline_generation();
    const next_item = existing
      ? { ...existing, generation, removed: markers }
      : {
          id: "scenario_" + Date.now().toString(36),
          created_at: new Date().toISOString(),
          generation,
          added: [],
          removed: markers,
        };
    if (existing) items[0] = next_item;
    else items.unshift(next_item);

    const next = { ...current.container, version: 1, items };
    window.localStorage.setItem(NEW_KEYS.scenarios, JSON.stringify(next));
    clear_scenarios_cache();
    const removals = get_scenario_removals();
    notify_listeners();
    return { ok: true, changed: true, removals };
  } catch (error) {
    clear_scenarios_cache();
    if (is_quota_error(error)) return fail("storage_full");
    return fail("write_failed");
  }
}

// ================= ADDS (batch C1, Addendum 26) =================
// An add is { id: "scratch_<base36>", kind, name, is_productive, annual_cost, productive_hours?, group_id?, copy_of? } in item.added[] (shape approved by the owner).
// The pure rules (validation, ids, rows, totals) live in lib/calculations/scenarioAdds.js. Nothing in the app reads this yet (C2 wires it).
// Entries that no longer pass the rules are skipped on read and left untouched on write; removals, other items and unknown fields are always kept (instruction 6b).
const EMPTY_ADDS = Object.freeze({
  adds: EMPTY_IDS,
  staff_adds: EMPTY_IDS,
  asset_adds: EMPTY_IDS,
  flags: Object.freeze({}),
  has_scenario: false,
  add_count: 0,
});

// { adds: [...], staff_adds: [...], asset_adds: [...], flags: { "<id>": "" | "baseline_changed" }, has_scenario, add_count }.
// Empty in baseline mode (no storage read). Same object until the layer changes.
export function get_scenario_adds() {
  if (get_mode() !== "model") return EMPTY_ADDS;
  if (adds_cache !== undefined) return adds_cache;
  const { items } = load_scenarios();
  const item = first_item(items);
  if (!item) {
    adds_cache = EMPTY_ADDS;
    return adds_cache;
  }
  const stale = Number.isFinite(item.generation) ? item.generation !== baseline_generation() : baseline_generation() !== 0;
  const adds = [];
  const flags = {};
  for (const entry of Array.isArray(item.added) ? item.added : []) {
    if (!is_valid_stored_add(entry) || flags[entry.id] !== undefined) continue;
    adds.push(Object.freeze({ ...entry }));
    flags[entry.id] = stale ? FLAG_BASELINE_CHANGED : "";
  }
  const staff_adds = adds.filter((add) => add.kind === "staff");
  const asset_adds = adds.filter((add) => add.kind === "asset");
  adds_cache = Object.freeze({
    adds: Object.freeze(adds),
    staff_adds: Object.freeze(staff_adds),
    asset_adds: Object.freeze(asset_adds),
    flags: Object.freeze(flags),
    has_scenario: true,
    add_count: adds.length,
  });
  return adds_cache;
}

function guard_add_write() {
  if (get_mode() !== "model") return fail("not_model_mode");
  if (!is_baseline_locked()) return fail("baseline_not_locked");
  return null;
}

function all_scratch_ids(items) {
  const ids = new Set();
  for (const item of items) {
    if (!item || !Array.isArray(item.added)) continue;
    for (const entry of item.added) if (entry && typeof entry.id === "string") ids.add(entry.id);
  }
  return ids;
}

// Writes the new added[] into the first item (creating the scenario if there is none), re-stamping generation. Throws on a storage error.
function commit_added(current, items, existing, added) {
  const generation = baseline_generation();
  const next_item = existing
    ? { ...existing, generation, added }
    : {
        id: "scenario_" + Date.now().toString(36),
        created_at: new Date().toISOString(),
        generation,
        added,
        removed: [],
      };
  if (existing) items[0] = next_item;
  else items.unshift(next_item);
  const next = { ...current.container, version: 1, items };
  window.localStorage.setItem(NEW_KEYS.scenarios, JSON.stringify(next));
  clear_scenarios_cache();
  notify_listeners();
}

function add_write_failed(error) {
  clear_scenarios_cache();
  if (is_quota_error(error)) return fail("storage_full");
  return fail("write_failed");
}

// Adds one scratch item. input: { kind, name, is_productive, annual_cost, productive_hours?, group_id? } (any id the caller passes is ignored).
// Returns { ok: true, changed: true, id, add, adds } or { ok: false, reason, message }. The only key written is mirra_scenarios_v1.
export function add_scenario_add(input) {
  const blocked = guard_add_write();
  if (blocked) return blocked;
  const checked = validate_add_input(input);
  if (!checked.ok) return fail(checked.reason);
  try {
    const current = normalise_scenarios(read_json(NEW_KEYS.scenarios)); // fresh, not cached: another tab may have written
    const items = current.items.slice();
    const existing = first_item(items);
    const added = existing && Array.isArray(existing.added) ? existing.added.slice() : [];
    const id = new_scratch_id(all_scratch_ids(items));
    const entry = { id, ...checked.value };
    added.push(entry);
    commit_added(current, items, existing, added);
    return { ok: true, changed: true, id, add: entry, adds: get_scenario_adds() };
  } catch (error) {
    return add_write_failed(error);
  }
}

// "Add N more of this": n copies of one added item, each with its own id. copy_of is the ORIGINAL (a copy of a copy points at the original).
// n must be a whole number from 1 to MAX_COPIES. Returns { ok: true, changed: true, ids, adds } or a failure.
export function copy_scenario_add(id, n) {
  const blocked = guard_add_write();
  if (blocked) return blocked;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > MAX_COPIES) return fail("bad_copy_count");
  if (!is_scratch_id(id)) return fail("unknown_add");
  try {
    const current = normalise_scenarios(read_json(NEW_KEYS.scenarios));
    const items = current.items.slice();
    const existing = first_item(items);
    const added = existing && Array.isArray(existing.added) ? existing.added.slice() : [];
    const source = added.find((entry) => entry && entry.id === id && is_valid_stored_add(entry));
    if (!source) return fail("unknown_add");
    const root = typeof source.copy_of === "string" && source.copy_of !== "" ? source.copy_of : source.id;
    const taken = all_scratch_ids(items);
    const ids = [];
    for (let i = 0; i < n; i += 1) {
      const copy_id = new_scratch_id(taken);
      taken.add(copy_id);
      ids.push(copy_id);
      added.push({ ...source, id: copy_id, copy_of: root });
    }
    commit_added(current, items, existing, added);
    return { ok: true, changed: true, ids, adds: get_scenario_adds() };
  } catch (error) {
    return add_write_failed(error);
  }
}

// Deletes one added item. An id that is not there changes nothing and writes nothing (still ok). Copies are independent of their original.
export function remove_scenario_add(id) {
  const blocked = guard_add_write();
  if (blocked) return blocked;
  if (typeof id !== "string" || id.trim() === "" || id.length > 120) return fail("bad_id");
  try {
    const current = normalise_scenarios(read_json(NEW_KEYS.scenarios));
    const items = current.items.slice();
    const existing = first_item(items);
    const added = existing && Array.isArray(existing.added) ? existing.added.slice() : [];
    const index = added.findIndex((entry) => entry && entry.id === id);
    if (index === -1) return { ok: true, changed: false, adds: get_scenario_adds() };
    added.splice(index, 1);
    commit_added(current, items, existing, added);
    return { ok: true, changed: true, adds: get_scenario_adds() };
  } catch (error) {
    return add_write_failed(error);
  }
}
