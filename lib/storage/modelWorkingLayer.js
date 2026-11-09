// R3 slice 5, lever batch L3 (Business Modelling brief, Addendum 57; owner decisions and wording 2026-11-09).
// The working layer as ONE thing for the Model mode strip: how many changes it holds, whether it is working or accepted, and the Accept and Discard
// actions. The layer is mirra_diffs_v1 (nudges and lever records together); this file holds no calculation and writes nothing itself: Accept goes
// through write_layer_status and Discard through clear_working_layer in modelDiffs.js, which write only mirra_diffs_v1. mirra_scenarios_v1 is never touched.
//
// Summary (cached, so useSyncExternalStore gets the same object until something changes):
//   { count, status, accepted_at, relocked }   status is "working" or "accepted"; "" when the layer is empty or Model mode is off.
// Baseline mode: get_layer_summary() returns the empty summary and reads NO storage.
// Accept wakes only the strip (the layer listeners below), never the diff subscribers, so no hook re-reads and nothing recalculates.
// Discard is announced by modelDiffs.js to the diff subscribers; this file forwards that to the strip. Any move forwards the same way.
// Imports only the registry, modelStorage.js and modelDiffs.js, so it runs in plain node for the tests.

import { NEW_KEYS } from "./modelStorageRegistry.js";
import { get_mode, on_clear_model_caches } from "./modelStorage.js";
import { DIFF_MESSAGES, STATUS_ACCEPTED, clear_working_layer, read_layer_snapshot, subscribe_to_diffs, write_layer_status } from "./modelDiffs.js";

// Owner approved wording (BM Addendum 57 item 3).
export const LAYER_TEXT = {
  working: "Working changes, not yet accepted",
  accepted_on: "Changes accepted on",
  accept: "Accept",
  discard: "Discard",
  cancel: "Cancel",
  confirm: "Discard all working changes? This cannot be undone.",
  relocked: "The baseline was relocked after some of these changes were made.",
  failed: DIFF_MESSAGES.write_failed,
};

export const STATUS_WORKING = "working";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EMPTY_SUMMARY = Object.freeze({ count: 0, status: "", accepted_at: "", relocked: false });
let summary_cache;

// "9 Nov 2026" from an ISO time, in the viewer's own time zone. "" when the time cannot be read.
export function format_accepted_date(iso) {
  if (typeof iso !== "string" || iso === "") return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.getDate() + " " + MONTHS[date.getMonth()] + " " + date.getFullYear();
}

function entries_of(list) {
  return Array.isArray(list) ? list.filter((item) => item !== null && typeof item === "object" && typeof item.path === "string") : [];
}

function build_summary() {
  const snap = read_layer_snapshot();
  const others = [];
  for (const name of Object.keys(snap.other_by_key)) others.push(...entries_of(snap.other_by_key[name]));
  const count = snap.nudge_records.length + others.length;
  if (count === 0) return EMPTY_SUMMARY;
  // A record made against another baseline lock is flagged. Unstamped records show no flag. Nudge records are also compared by generation.
  const moved = (record) =>
    typeof record.locked_at === "string" && record.locked_at !== "" && snap.lock_stamp !== "" && record.locked_at !== snap.lock_stamp;
  const relocked =
    snap.nudge_records.some(moved) ||
    others.some(moved) ||
    (snap.nudge_records.length > 0 && snap.generation !== snap.current_generation);
  return Object.freeze({
    count,
    status: snap.status === STATUS_ACCEPTED ? STATUS_ACCEPTED : STATUS_WORKING,
    accepted_at: snap.accepted_at,
    relocked,
  });
}

export function get_layer_summary() {
  if (get_mode() !== "model") return EMPTY_SUMMARY;
  if (summary_cache !== undefined) return summary_cache;
  try {
    summary_cache = build_summary();
  } catch {
    summary_cache = EMPTY_SUMMARY;
  }
  return summary_cache;
}

export function get_server_layer_summary() {
  return EMPTY_SUMMARY;
}

// ---------- strip subscription (its own, so Accept wakes the strip and nothing else) ----------
const layer_listeners = new Set();

function notify_layer() {
  for (const callback of Array.from(layer_listeners)) {
    try {
      callback();
    } catch {
      // ignore: one broken listener must not stop the others
    }
  }
}

function on_layer_changed() {
  summary_cache = undefined;
  notify_layer();
}

// Moves and Discard are announced by modelDiffs.js to its subscribers. This file listens for the life of the page (one cheap callback), so the cached
// summary is dropped on EVERY layer change even while no strip is mounted, and forwards the notice to the strip.
subscribe_to_diffs(on_layer_changed);

export function subscribe_to_layer(callback) {
  if (typeof callback !== "function") return () => {};
  layer_listeners.add(callback);
  return () => layer_listeners.delete(callback);
}

on_clear_model_caches(() => {
  summary_cache = undefined;
});

// Another tab changed the layer or the baseline: the strip re-reads.
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === NEW_KEYS.diffs || event.key === NEW_KEYS.baseline_meta || event.key === NEW_KEYS.mode) on_layer_changed();
  });
}

// ---------- actions ----------
function failure(result) {
  const reason = result && result.reason ? result.reason : "write_failed";
  return { ok: false, reason, message: reason === "storage_full" ? result.message : LAYER_TEXT.failed };
}

// Marks the whole layer accepted. now_iso is optional (tests pass one). Refuses outside Model mode, without a locked baseline and on an empty layer.
export function accept_working_layer(now_iso) {
  if (get_mode() !== "model") return failure({ reason: "not_model_mode" });
  summary_cache = undefined;
  if (get_layer_summary().count === 0) return failure({ reason: "empty_layer" });
  const stamp = typeof now_iso === "string" && now_iso !== "" ? now_iso : new Date().toISOString();
  const result = write_layer_status(stamp);
  if (!result.ok) return failure(result);
  summary_cache = undefined;
  notify_layer(); // the strip only: the diff subscribers are not told, so no hook re-reads
  return { ok: true };
}

// Clears the whole working layer (not the scenarios). The caller asks "Discard all working changes? This cannot be undone." first.
export function discard_working_layer() {
  if (get_mode() !== "model") return failure({ reason: "not_model_mode" });
  const result = clear_working_layer();
  summary_cache = undefined; // the strip is told by modelDiffs.js through the diff subscription
  if (!result.ok) return failure(result);
  return { ok: true };
}
