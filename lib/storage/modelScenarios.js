// R3 slice 4, batch B, part 1 (Business Modelling brief, Addendum 18 items 7 to 12; Addendum 23 item 7; owner confirmation and generation stamp 2026-10-30, Addendum 24).
// The SCENARIO layer, removals only: markers saying "this staff member / this asset is removed in the scenario", kept in mirra_scenarios_v1.
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

export const SCENARIO_KINDS = ["staff", "asset"];
export const FLAG_BASELINE_CHANGED = "baseline_changed";
const MAX_ID_LENGTH = 120;

export const SCENARIO_MESSAGES = {
  not_model_mode: "Scenario changes can only be made in Model mode.",
  baseline_not_locked: "A scenario needs a locked baseline. Nothing was changed.",
  bad_kind: "Only staff or assets can be removed. Nothing was changed.",
  bad_id: "That item could not be identified. Nothing was changed.",
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

export function clear_scenarios_cache() {
  scenarios_cache = undefined;
  removals_cache = undefined;
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
