// R3 slice 5, lever batch L1 (Business Modelling brief, Addendum 53 item 1; owner YES on the stored shape 2026-11-09).
// The Rate Builder lever records: a charge-out rate move per labour source, and the materials markup move, stored as DIFFERENCES from the
// baseline inside the existing mirra_diffs_v1 (no new key). This file only holds, serves and merges them. It never writes a real key,
// a baseline entry or the baseline meta, and it holds no calculation.
//
// Record shape (extends the slice 3 nudge record; absent created_at / locked_at is tolerated and means "no stamp"):
//   mirra_diffs_v1.by_key["qstools_rate_builder_labour_source_rates_v1"] = [ { path: "rate:<source_id>", kind: "delta", value, flag: "", created_at, locked_at } ]
//   mirra_diffs_v1.by_key["qstools_rate_builder_materials_markup_v1"]    = [ { path: "markup:materials", kind: "delta", value, flag: "", created_at, locked_at } ]
//   rate value   = dollars per hour added to the baseline rate (the page converts a typed target with delta_from_target before saving).
//   markup value = percentage points added to the baseline materials markup percent.
//   created_at   = when the move was first made; a second move on the same lever keeps it.
//   locked_at    = the baseline meta locked_at the move was made against; if the baseline is relocked later, reads report "baseline_changed".
// A delta for a rate source that has no stored baseline rate is kept but NOT applied (there is nothing to add it to); L2 decides how the
// screen handles that. A merged rate or markup never goes below 0.
// Baseline mode: the getters return empty and read NO storage (Model mode OFF stays byte-identical to before).
// Imports only modelStorage.js and modelDiffs.js, so it runs in plain node for the tests.

import { get_mode, is_baseline_locked } from "./modelStorage.js";
import { DIFF_MESSAGES, FLAG_BASELINE_CHANGED, baseline_lock_stamp, read_other_records, write_other_records } from "./modelDiffs.js";

export const RATE_SOURCE_KEY = "qstools_rate_builder_labour_source_rates_v1";
export const MARKUP_KEY = "qstools_rate_builder_materials_markup_v1";
export const RATE_PATH_PREFIX = "rate:";
export const MARKUP_PATH = "markup:materials";
export const MARKUP_PATH_PREFIX = "markup:";
export const RATE_DELTA_MIN = -10000;
export const RATE_DELTA_MAX = 10000;
export const MARKUP_DELTA_MIN = -100;
export const MARKUP_DELTA_MAX = 1000;

// Plain words for the screen. Draft wording, the owner approves it in L3 together with the banner.
export const LEVER_MESSAGES = {
  bad_source: "That rate source is not recognised. Nothing was changed.",
  bad_rate_value: "Enter a change between -10000 and 10000 dollars per hour. Nothing was changed.",
  bad_markup_value: "Enter a change between -100 and 1000 percentage points. Nothing was changed.",
};

const EMPTY_RATE_DELTAS = Object.freeze({});

function fail(reason) {
  return { ok: false, reason, message: LEVER_MESSAGES[reason] || DIFF_MESSAGES[reason] };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// Number(null) is 0 and Number("") is 0: a missing value must read as missing, never as zero.
function to_finite(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// ---------- pure helpers ----------
// The page's typed target (95) against the baseline rate (90) is stored as the difference (5). Null when either is missing.
export function delta_from_target(target, baseline) {
  const t = to_finite(target);
  const b = to_finite(baseline);
  if (t === null || b === null) return null;
  return round2(t - b);
}

// Returns a NEW map: every baseline entry is kept as it is (spread), and a delta is added only to a source the baseline already holds.
export function apply_rate_deltas(rate_map, deltas) {
  const out = { ...(rate_map || {}) };
  const list = deltas || {};
  for (const source_id of Object.keys(list)) {
    if (!Object.prototype.hasOwnProperty.call(out, source_id)) continue;
    const amount = to_finite(list[source_id] && list[source_id].delta);
    if (amount === null) continue;
    out[source_id] = Math.max(0, round2(Number(out[source_id]) + amount));
  }
  return out;
}

// Returns a NEW state object (spread, so any other field survives). entry is { delta, flag } or null.
export function apply_markup_delta(state, entry) {
  const out = { ...(state || {}) };
  const amount = to_finite(entry && entry.delta);
  if (amount === null) return out;
  const base = to_finite(out.materials_markup_percent);
  out.materials_markup_percent = Math.max(0, round2((base === null ? 0 : base) + amount));
  return out;
}

// ---------- read ----------
function is_lever_record(record, prefix) {
  return (
    record !== null &&
    typeof record === "object" &&
    record.kind === "delta" &&
    typeof record.path === "string" &&
    record.path.startsWith(prefix) &&
    record.path.length > prefix.length &&
    typeof record.value === "number" &&
    Number.isFinite(record.value)
  );
}

function flag_for(record, stamp) {
  const made_against = typeof record.locked_at === "string" ? record.locked_at : "";
  return made_against !== "" && stamp !== "" && made_against !== stamp ? FLAG_BASELINE_CHANGED : "";
}

function entry_for(record, stamp) {
  return Object.freeze({
    delta: record.value,
    flag: flag_for(record, stamp),
    created_at: typeof record.created_at === "string" ? record.created_at : "",
    locked_at: typeof record.locked_at === "string" ? record.locked_at : "",
  });
}

// { "<source_id>": { delta, flag, created_at, locked_at } }. Empty in baseline mode, and then no storage is read at all.
export function get_rate_deltas() {
  if (get_mode() !== "model") return EMPTY_RATE_DELTAS;
  const records = read_other_records(RATE_SOURCE_KEY).filter((record) => is_lever_record(record, RATE_PATH_PREFIX));
  if (records.length === 0) return EMPTY_RATE_DELTAS;
  const stamp = baseline_lock_stamp();
  const out = {};
  for (const record of records) out[record.path.slice(RATE_PATH_PREFIX.length)] = entry_for(record, stamp);
  return Object.freeze(out);
}

// { delta, flag, created_at, locked_at } or null. Null in baseline mode, and then no storage is read at all.
export function get_markup_delta() {
  if (get_mode() !== "model") return null;
  const record = read_other_records(MARKUP_KEY).find((item) => is_lever_record(item, MARKUP_PATH_PREFIX) && item.path === MARKUP_PATH);
  return record ? entry_for(record, baseline_lock_stamp()) : null;
}

// ---------- write ----------
// Sets (or, with 0, removes) one record. The ONLY key this writes is mirra_diffs_v1, through write_other_records, which keeps the
// overhead nudges, every other source's entry and every other record in this entry exactly as they were. Model mode and a locked baseline only.
function set_record(source_key, path, delta, min, max, bad_reason, now_iso) {
  if (get_mode() !== "model") return fail("not_model_mode");
  if (!is_baseline_locked()) return fail("baseline_not_locked");
  const value = to_finite(delta);
  if (value === null || value < min || value > max) return fail(bad_reason);
  const rounded = round2(value);
  try {
    // Read fresh (not through the cache): another tab may have written since.
    const current = read_other_records(source_key, true);
    const existing = current.find((record) => record && record.path === path);
    const next = current.filter((record) => !(record && record.path === path));
    if (rounded !== 0) {
      const kept_created = existing && typeof existing.created_at === "string" && existing.created_at !== "" ? existing.created_at : "";
      next.push({
        path,
        kind: "delta",
        value: rounded,
        flag: "",
        created_at: kept_created || (typeof now_iso === "string" && now_iso !== "" ? now_iso : new Date().toISOString()),
        locked_at: baseline_lock_stamp(),
      });
    }
    next.sort((a, b) => {
      const pa = a && typeof a.path === "string" ? a.path : "";
      const pb = b && typeof b.path === "string" ? b.path : "";
      return pa < pb ? -1 : pa > pb ? 1 : 0;
    });
    return write_other_records(source_key, next);
  } catch {
    return fail("write_failed");
  }
}

// delta = dollars per hour added to the baseline rate of one labour source.
export function set_rate_delta(source_id, delta, now_iso) {
  if (get_mode() !== "model") return fail("not_model_mode");
  if (typeof source_id !== "string" || source_id.trim() === "" || source_id.length > 80) return fail("bad_source");
  return set_record(RATE_SOURCE_KEY, RATE_PATH_PREFIX + source_id, delta, RATE_DELTA_MIN, RATE_DELTA_MAX, "bad_rate_value", now_iso);
}

// delta = percentage points added to the baseline materials markup percent.
export function set_markup_delta(delta, now_iso) {
  return set_record(MARKUP_KEY, MARKUP_PATH, delta, MARKUP_DELTA_MIN, MARKUP_DELTA_MAX, "bad_markup_value", now_iso);
}
