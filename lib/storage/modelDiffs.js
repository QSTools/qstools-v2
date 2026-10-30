// R3 slice 3, batch 1 (Business Modelling brief, Addendum 8 slice plan item 3; Addendum 18 slice 3 items 1 to 6; owner approvals 2026-10-30).
// The minimal MODELLED layer: the per-category overhead nudge, stored as a DIFFERENCE from the baseline in mirra_diffs_v1.
//
// Why this is not "merge on read": General Overheads rebuilds its synced lines from the P&L on every mount, so a value merged into the stored
// state would be thrown away. The nudge is therefore stored here as a percentage per category and applied by the hook AFTER the rebuild
// (batch 3). This file only holds and serves the record. It never writes a real key, a baseline entry or the baseline meta.
//
// Record shape (owner approved): mirra_diffs_v1 = { version: 1, generation, by_key: { "<source key>": [ { path, kind, value, flag } ] } }
//   path "category:<overhead_category_key>", kind "pct", value = percent (5 means +5 percent, -10 means -10 percent), flag "" when stored.
//   generation = the baseline generation when the layer was last changed. If the baseline has since been corrected (relocked), reads report
//   flag "baseline_changed" until the next nudge change re-stamps it. Orphan flags (a category with no lines) are added in batch 2, where the
//   lines are known.
// Baseline mode: get_overhead_nudges() returns an empty object and reads NO storage (Model mode OFF stays byte-identical to before).
// Imports only the registry and modelStorage.js, so it runs in plain node for the tests.

import { NEW_KEYS } from "./modelStorageRegistry.js";
import { MODEL_STORAGE_FULL_MESSAGE, get_mode, is_baseline_locked, on_clear_model_caches } from "./modelStorage.js";

export const OVERHEAD_DIFF_KEY = "qs_tools_general_overhead_state";
export const NUDGE_PATH_PREFIX = "category:";
export const NUDGE_MIN_PCT = -100;
export const NUDGE_MAX_PCT = 1000;
export const FLAG_BASELINE_CHANGED = "baseline_changed";

// Plain words for the screen. Draft wording, owner approves it in batch 5 (BM Addendum 2 items 6, 8).
export const DIFF_MESSAGES = {
  not_model_mode: "Nudges can only be set in Model mode.",
  baseline_not_locked: "Nudges need a locked baseline. Nothing was changed.",
  bad_category: "That overhead category is not recognised. Nothing was changed.",
  bad_value: "Enter a percentage between -100 and 1000. Nothing was changed.",
  storage_full: MODEL_STORAGE_FULL_MESSAGE,
  write_failed: "The change could not be saved. Nothing was changed.",
};

const EMPTY_NUDGES = Object.freeze({});

// ---------- caches (cleared with the rest through on_clear_model_caches, and after every write here) ----------
let diffs_cache = undefined;
let nudges_cache = undefined;

export function clear_diffs_cache() {
  diffs_cache = undefined;
  nudges_cache = undefined;
}

on_clear_model_caches(clear_diffs_cache);

// Same-tab subscribers (R3 slice 3 batch 3): every mounted copy of useGeneralOverheads (the page, the sidebar's reconciliation, Assets, Business Outcome)
// holds its own nudges, and the sidebar copy outlives page changes. A successful write tells them all to re-read, so none goes stale.
const listeners = new Set();

export function subscribe_to_diffs(callback) {
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
  return { ok: false, reason, message: DIFF_MESSAGES[reason] };
}

function baseline_generation() {
  const meta = read_json(NEW_KEYS.baseline_meta);
  return meta && Number.isFinite(meta.generation) ? meta.generation : 0;
}

function is_nudge_record(record) {
  return (
    record !== null &&
    typeof record === "object" &&
    record.kind === "pct" &&
    typeof record.path === "string" &&
    record.path.startsWith(NUDGE_PATH_PREFIX) &&
    record.path.length > NUDGE_PATH_PREFIX.length &&
    Number.isFinite(Number(record.value))
  );
}

// Reads mirra_diffs_v1 into { generation, records, other_by_key }. Anything it does not understand is kept in other_by_key so a write
// here never drops it (project instruction 6b: a layer that rebuilds an object drops fields).
function normalise_diffs(parsed) {
  const by_key = parsed && typeof parsed.by_key === "object" && parsed.by_key !== null && !Array.isArray(parsed.by_key) ? parsed.by_key : {};
  const own = Array.isArray(by_key[OVERHEAD_DIFF_KEY]) ? by_key[OVERHEAD_DIFF_KEY] : [];
  const other_by_key = {};
  for (const name of Object.keys(by_key)) {
    if (name !== OVERHEAD_DIFF_KEY) other_by_key[name] = by_key[name];
  }
  return {
    generation: parsed && Number.isFinite(parsed.generation) ? parsed.generation : 0,
    records: own.filter(is_nudge_record).map((record) => ({
      path: record.path,
      kind: "pct",
      value: Number(record.value),
      flag: typeof record.flag === "string" ? record.flag : "",
    })),
    other_by_key,
  };
}

function load_diffs() {
  if (diffs_cache !== undefined) return diffs_cache;
  diffs_cache = normalise_diffs(read_json(NEW_KEYS.diffs));
  return diffs_cache;
}

// ---------- read ----------
// { "<overhead_category_key>": { pct, flag } }. Empty in baseline mode, and then no storage is read at all. In Model mode it is read and
// parsed once and held until something clears the caches.
export function get_overhead_nudges() {
  if (get_mode() !== "model") return EMPTY_NUDGES;
  if (nudges_cache !== undefined) return nudges_cache;
  const diffs = load_diffs();
  const stale = diffs.records.length > 0 && diffs.generation !== baseline_generation();
  const out = {};
  for (const record of diffs.records) {
    out[record.path.slice(NUDGE_PATH_PREFIX.length)] = Object.freeze({ pct: record.value, flag: stale ? FLAG_BASELINE_CHANGED : "" });
  }
  nudges_cache = Object.freeze(out);
  return nudges_cache;
}

// ---------- write ----------
// Sets (or, with 0, removes) the nudge for one category. The ONLY key this writes is mirra_diffs_v1. Model mode and a locked baseline only.
// pct is a percentage: 5 raises the category by 5 percent, -10 lowers it by 10 percent. Rounded to 2 decimals.
export function set_overhead_nudge(category_key, pct) {
  if (get_mode() !== "model") return fail("not_model_mode");
  if (!is_baseline_locked()) return fail("baseline_not_locked");
  if (typeof category_key !== "string" || category_key.trim() === "" || category_key.length > 80) return fail("bad_category");
  if (pct === null || pct === undefined || (typeof pct === "string" && pct.trim() === "")) return fail("bad_value");
  const value = Number(pct);
  if (!Number.isFinite(value) || value < NUDGE_MIN_PCT || value > NUDGE_MAX_PCT) return fail("bad_value");
  const rounded = Math.round(value * 100) / 100;
  const path = NUDGE_PATH_PREFIX + category_key;

  try {
    // Read fresh (not through the cache): another tab may have written since.
    const current = normalise_diffs(read_json(NEW_KEYS.diffs));
    const records = current.records.filter((record) => record.path !== path);
    if (rounded !== 0) records.push({ path, kind: "pct", value: rounded, flag: "" });
    records.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    const by_key = { ...current.other_by_key };
    if (records.length > 0) by_key[OVERHEAD_DIFF_KEY] = records;
    const next = { version: 1, generation: baseline_generation(), by_key };
    window.localStorage.setItem(NEW_KEYS.diffs, JSON.stringify(next));
    clear_diffs_cache();
    const nudges = get_overhead_nudges();
    notify_listeners();
    return { ok: true, nudges };
  } catch (error) {
    clear_diffs_cache();
    if (is_quota_error(error)) return fail("storage_full");
    return fail("write_failed");
  }
}
