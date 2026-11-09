// R3 slice 5, lever batch L2 (Business Modelling brief, Addendum 53 item 1 and Addendum 56): the lever INPUT actions for the Rate Builder.
// In Model mode a typed charge-out rate (per labour source) or materials markup is stored as a DIFFERENCE from the saved baseline value, in
// mirra_diffs_v1, through modelLeverDiffs.js. This file converts the typed target into that difference and holds the small pure helpers the hooks
// use to follow a change. It never writes a real key and never writes a merged value anywhere: a merged (baseline plus difference) value is for
// reading only. No React, no browser globals of its own, so it runs in plain node for the tests.
//
// Rules built in (owner decisions 2026-11-09):
//  - A rate move needs a saved baseline rate above 0 for that source (nothing to add a difference to otherwise): refused with a plain message.
//  - A new move after Accept flips the status back to working: that is L3 (the status field); nothing here touches a status.
//  - Version of mirra_diffs_v1 stays 1.

import { get_mode } from "../../storage/modelStorage.js";
import { delta_from_target, set_markup_delta, set_rate_delta } from "../../storage/modelLeverDiffs.js";
import { read_baseline_labour_source_rates } from "../../storage/rateBuilderLabourSourceRatesStorage.js";
import { read_baseline_materials_markup } from "../../storage/rateBuilderMaterialsMarkupStorage.js";

// Plain words for the screen. Draft wording, the owner approves it in L3 together with the banner.
export const LEVER_INPUT_MESSAGES = {
  not_model_mode: "Working changes can only be made in Model mode. Nothing was changed.",
  no_baseline_rate: "No saved rate to change yet. Save a rate in baseline mode first.",
  bad_target: "Enter a number of 0 or more. Nothing was changed.",
  saved_rate: "Working change saved.",
  saved_markup: "Working change saved.",
  rate_note: "Model mode: Save rate stores a working change. The saved rate is not touched.",
  markup_note: "Model mode: leaving this box stores a working change. The saved markup is not touched.",
};

function fail(reason) {
  return { ok: false, reason, message: LEVER_INPUT_MESSAGES[reason] };
}

// Number(null) and Number("") are 0: a missing target must read as missing, never as zero.
function to_target(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function is_model_mode() {
  return get_mode() === "model";
}

// True when the SAVED (baseline) rate map holds a rate above 0 for this source. Reads the baseline only, never the merged map.
export function has_baseline_rate(source_id) {
  if (typeof source_id !== "string" || source_id === "") return false;
  const baseline = read_baseline_labour_source_rates();
  return Object.prototype.hasOwnProperty.call(baseline, source_id) && Number(baseline[source_id]) > 0;
}

// Stores "this source's charge-out rate should be typed_target" as a difference from the saved baseline rate. Writes only mirra_diffs_v1.
export function save_rate_move(source_id, typed_target, now_iso) {
  if (!is_model_mode()) return fail("not_model_mode");
  const target = to_target(typed_target);
  if (target === null) return fail("bad_target");
  if (!has_baseline_rate(source_id)) return fail("no_baseline_rate");
  const baseline = Number(read_baseline_labour_source_rates()[source_id]);
  return set_rate_delta(source_id, delta_from_target(target, baseline), now_iso);
}

// Stores "the materials markup should be typed_target percent" as a difference (percentage points) from the saved baseline markup.
export function save_markup_move(typed_target, now_iso) {
  if (!is_model_mode()) return fail("not_model_mode");
  const target = to_target(typed_target);
  if (target === null) return fail("bad_target");
  const baseline = Number(read_baseline_materials_markup().materials_markup_percent);
  return set_markup_delta(delta_from_target(target, Number.isFinite(baseline) ? baseline : 0), now_iso);
}

// ---------- pure helpers for the hooks ----------
// { id: rate } for every id whose value differs from the previous read (or was not there). Used so a re-read only touches what actually moved.
export function changed_rates(previous, next) {
  const out = {};
  const before = previous && typeof previous === "object" ? previous : {};
  const after = next && typeof next === "object" ? next : {};
  for (const id of Object.keys(after)) {
    if (before[id] !== after[id]) out[id] = after[id];
  }
  return out;
}

// Returns the SAME array when nothing changed. Otherwise a new array: each model is spread, only its charge-out rate map (and, for the model whose
// selected source moved, its current rate) change. Names, other inputs and the list itself are untouched. Never returns an empty list for a non-empty one.
export function resync_model_rates(models, changed) {
  const ids = Object.keys(changed || {});
  if (!Array.isArray(models) || models.length === 0 || ids.length === 0) return models;
  return models.map((model) => {
    if (!model || typeof model !== "object") return model;
    const next_map = { ...(model.charge_out_rates_by_labour_source || {}) };
    for (const id of ids) next_map[id] = changed[id];
    const own_source_moved = Object.prototype.hasOwnProperty.call(changed, model.labour_source_type_id);
    return {
      ...model,
      charge_out_rates_by_labour_source: next_map,
      ...(own_source_moved ? { current_charge_out_rate: changed[model.labour_source_type_id] } : {}),
    };
  });
}

// True when two rate maps hold the same ids and values. Lets a hook keep its current object (no needless recalculation) when a change was elsewhere.
export function same_rate_map(a, b) {
  const left = a && typeof a === "object" ? a : {};
  const right = b && typeof b === "object" ? b : {};
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && left[key] === right[key]);
}
