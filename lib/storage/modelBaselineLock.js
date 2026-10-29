// R3 slice 2 (Business Modelling brief, Addendum 8 slice plan item 2; owner decisions 2026-10-30 recorded in BM Addendum 17).
// The baseline LOCK and the deliberate UNLOCK. It wraps the SAME take_baseline_snapshot that slice 1 built (all-or-nothing, byte for
// byte); it adds the gate, the settle check, the unlock and the fingerprints. It never writes a real key: the only keys it can write
// are the baseline entries and the baseline meta key (through take_baseline_snapshot), and the meta key alone on unlock.
// Imports only modelStorage.js and the registry, so it runs in plain node for the tests. Uses window.localStorage directly for the
// same reason modelStorage.js does: it IS the storage layer.
//
// What the gate can and cannot do: readiness (overall_status, blocking and warning counts) is computed live in React by the hooks, so
// the caller passes it in and this file records it. This file enforces what storage can: not in Model mode, not already locked, the
// real data is settled (a fingerprint that did not move), and the lock verified itself afterwards.

import { MODELLED_KEYS, NEW_KEYS, baseline_entry_key } from "./modelStorageRegistry.js";
import {
  MODEL_STORAGE_FULL_MESSAGE,
  comparable_form,
  get_mode,
  has_complete_baseline,
  is_baseline_locked,
  take_baseline_snapshot,
} from "./modelStorage.js";

// Time the real data must stay unchanged before the gate calls it settled (milliseconds). Used by settle_step.
export const SETTLE_MS = 1500;

// Wording is a draft until the owner approves it in batch 2 (BM Addendum 2 items 6, 8; Addendum 8 STILL OPEN).
export const LOCK_MESSAGES = {
  model_mode_active: "Switch to baseline mode before locking the baseline.",
  already_locked: "The baseline is already locked. Unlock it first if you need to correct it.",
  not_loaded: "The checks are still loading. Try again in a moment.",
  blocked: "The baseline can't be locked while the model is blocked. Clear the blocking checks first.",
  open_checks: "The baseline can't be locked while checks are still open. Resolve or accept them first.",
  not_settled: "Your data was still changing. Wait a moment and try again.",
  storage_full: MODEL_STORAGE_FULL_MESSAGE,
};

export const UNLOCK_MESSAGES = {
  model_mode_active: "Switch back to baseline mode before unlocking the baseline.",
  not_confirmed: "Unlocking needs your confirmation. Nothing was changed.",
  not_locked: "The baseline is not locked. Nothing was changed.",
  write_failed: "The baseline could not be unlocked. Nothing was changed.",
};

// Shown in the unlock panel (batch 2). Draft wording.
export const UNLOCK_WARNING =
  "Unlocking lets you correct the baseline. Model mode is switched off until you lock the baseline again. " +
  "Your modelled changes are kept and will sit on the corrected baseline.";

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

// ---------- fingerprints (53-bit string hash, cyrb53; only used to tell "changed" from "unchanged") ----------
function hash_text(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function fingerprint_of(read_raw) {
  let joined = "";
  for (const entry of MODELLED_KEYS) {
    const form = comparable_form(entry, read_raw(entry));
    joined += entry.code + "=" + (form === null ? "-" : form) + "\n";
  }
  return hash_text(joined);
}

// Fingerprint of the 28 REAL modelled keys, volatile fields ignored (timestamps, generated ids). Reads window.localStorage directly:
// in Model mode the real keys are not what pages see, and this must be able to look at them.
export function fingerprint_real() {
  return fingerprint_of((entry) => window.localStorage.getItem(entry.key));
}

// Fingerprint of the 28 BASELINE entries, same rules. Equal to fingerprint_real() right after a lock.
export function fingerprint_baseline() {
  return fingerprint_of((entry) => window.localStorage.getItem(baseline_entry_key(entry.code)));
}

export function baseline_matches_real() {
  return has_complete_baseline() && fingerprint_real() === fingerprint_baseline();
}

// ---------- settle check (pure: the page feeds it a fingerprint every poll) ----------
// state = { fingerprint, since } ; returns { state, settled }. The data is settled once the fingerprint has not moved for SETTLE_MS.
export function settle_step(state, fingerprint, now) {
  if (!state || state.fingerprint !== fingerprint) {
    return { state: { fingerprint, since: now }, settled: false };
  }
  return { state, settled: now - state.since >= SETTLE_MS };
}

// ---------- the gate (pure) ----------
// readiness = { loaded, overall_status, blocking_count, warning_count, checked_at } from the Model Readiness hooks.
// Decision 1 (owner, 2026-10-30): blockers AND unresolved warnings both block the lock. Accepted, covered and timing_expected checks
// are not warnings, so overall_status "ready" is the test. The static "Traceability" group (MR-3) is never read.
// Returns { ok, reasons: [ { code, message } ] } with every reason that applies, most important first.
export function check_lock_gate({ mode, locked, readiness, settled_fingerprint, current_fingerprint }) {
  const reasons = [];
  const add = (code) => reasons.push({ code, message: LOCK_MESSAGES[code] });

  if (mode === "model") add("model_mode_active");
  if (locked === true) add("already_locked");

  const r = readiness || {};
  const status = r.overall_status;
  if (r.loaded !== true || (status !== "ready" && status !== "warning" && status !== "blocked")) {
    add("not_loaded");
  } else {
    if (status === "blocked" || Number(r.blocking_count) > 0) add("blocked");
    else if (status === "warning" || Number(r.warning_count) > 0) add("open_checks");
  }

  if (!settled_fingerprint || settled_fingerprint !== current_fingerprint) add("not_settled");

  return { ok: reasons.length === 0, reasons };
}

function refusal(reasons) {
  const first = reasons[0];
  return { ok: false, reason: first.code, message: first.message, reasons };
}

function compact_readiness(readiness) {
  return {
    overall_status: readiness.overall_status,
    blocking_count: Number(readiness.blocking_count) || 0,
    warning_count: Number(readiness.warning_count) || 0,
    checked_at: readiness.checked_at || "",
  };
}

// ---------- lock state ----------
export function get_lock_state() {
  const meta = read_json(NEW_KEYS.baseline_meta);
  return {
    has_baseline: has_complete_baseline(),
    locked: is_baseline_locked(),
    generation: meta && Number.isFinite(meta.generation) ? meta.generation : 0,
    locked_at: meta ? meta.locked_at || "" : "",
    unlocked_at: meta ? meta.unlocked_at || "" : "",
    taken_at: meta ? meta.taken_at || "" : "",
    source: meta ? meta.source || "" : "",
    readiness: meta ? meta.readiness || null : null,
    fingerprint: meta ? meta.fingerprint || "" : "",
  };
}

function write_meta(meta) {
  window.localStorage.setItem(NEW_KEYS.baseline_meta, JSON.stringify(meta));
}

// ---------- lock ----------
// Refuses (writing nothing) unless the gate passes. Then runs take_baseline_snapshot (all-or-nothing) with locked true, and verifies
// that the real data did not move while it ran. If it did, the lock is withdrawn (locked false) and the caller is told to try again.
export function lock_baseline({ readiness, settled_fingerprint } = {}) {
  const before = fingerprint_real();
  const gate = check_lock_gate({
    mode: get_mode(),
    locked: is_baseline_locked(),
    readiness,
    settled_fingerprint,
    current_fingerprint: before,
  });
  if (!gate.ok) return refusal(gate.reasons);

  const previous = read_json(NEW_KEYS.baseline_meta);
  const generation = (previous && Number.isFinite(previous.generation) ? previous.generation : 0) + 1;

  const snapshot = take_baseline_snapshot({
    locked: true,
    source: "lock",
    generation,
    readiness: compact_readiness(readiness),
    fingerprint: before,
  });
  if (!snapshot.ok) return snapshot;

  if (fingerprint_real() !== before || fingerprint_baseline() !== before) {
    // Something wrote a real key while the copy ran (for example a second tab). Withdraw the lock rather than keep a baseline that
    // does not match the data it claims to describe.
    try {
      const meta = read_json(NEW_KEYS.baseline_meta);
      if (meta) write_meta({ ...meta, locked: false, locked_at: "" });
    } catch {
      // ignore: the caller still gets the refusal below
    }
    return { ok: false, reason: "not_settled", message: LOCK_MESSAGES.not_settled, reasons: [{ code: "not_settled", message: LOCK_MESSAGES.not_settled }] };
  }

  return { ok: true, generation, entries: snapshot.entries, absent: snapshot.absent, bytes: snapshot.bytes, fingerprint: before };
}

// ---------- unlock ----------
// Deliberate: needs confirmed === true (the UI sets it only after the warning panel). Writes the meta key and nothing else:
// baseline entries, differences, scenarios and every real key are untouched. Model mode must be off.
export function unlock_baseline({ confirmed } = {}) {
  if (get_mode() === "model") {
    return { ok: false, reason: "model_mode_active", message: UNLOCK_MESSAGES.model_mode_active };
  }
  if (confirmed !== true) {
    return { ok: false, reason: "not_confirmed", message: UNLOCK_MESSAGES.not_confirmed };
  }
  if (!is_baseline_locked()) {
    return { ok: false, reason: "not_locked", message: UNLOCK_MESSAGES.not_locked };
  }
  try {
    const meta = read_json(NEW_KEYS.baseline_meta);
    write_meta({ ...meta, locked: false, unlocked_at: new Date().toISOString() });
    return { ok: true };
  } catch (error) {
    if (is_quota_error(error)) return { ok: false, reason: "storage_full", message: MODEL_STORAGE_FULL_MESSAGE };
    return { ok: false, reason: "write_failed", message: UNLOCK_MESSAGES.write_failed };
  }
}
