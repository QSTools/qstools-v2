// R3 slice 1 (Business Modelling brief, Addendum 12 owner answers A to H). The ONE door between the storage modules and
// window.localStorage. With Model mode OFF (the default, and whenever the mode key is absent) every call is exactly the
// call the module made before: nothing else is read except the small mode key, nothing is written.
// With Model mode ON: a modelled key reads its BASELINE entry (never the real key); writes are compared with the baseline
// ignoring volatile fields (timestamps, generated ids) and NOTHING is written (slice 1 builds no differences logic: a real
// difference is discarded and counted, see get_model_stats); unmodelled and unregistered keys are read-through and
// write-blocked. The real keys and the baseline entries are never touched by a Model mode page.
// Also here: the mode switch (refused without a complete baseline) and the all-or-nothing baseline snapshot, shared by the
// slice 1 dev button and the slice 2 lock. Written so it can later become asynchronous (database, R6) without changing what
// its callers mean. Imports only the registry, so it runs in plain node for the tests.

import {
  MODELLED_KEYS,
  NEW_KEYS,
  REGISTRY_VERSION,
  UNMODELLED_KEYS,
  EXCLUDED_KEYS,
  baseline_entry_key,
  find_modelled_entry,
} from "./modelStorageRegistry.js";

// Owner's wording (Addendum 12 owner answer D). Kept tiny: it is a stopgap until the database arrives.
export const MODEL_STORAGE_FULL_MESSAGE =
  "This business is too large for Model mode until the database arrives";

// Used for a modelled key whose volatile list has not been reviewed yet (registry volatile: null).
const DEFAULT_VOLATILE = ["updated_at", "created_at"];
const MAX_LISTED = 50;

// ---------- mode (cached; cleared when the mode changes here or in another tab) ----------
let mode_cache = null;

function read_mode() {
  if (mode_cache) return mode_cache;
  let mode = "baseline";
  try {
    const text = window.localStorage.getItem(NEW_KEYS.mode);
    if (text) {
      const record = JSON.parse(text);
      if (record && record.mode === "model") mode = "model";
    }
  } catch {
    mode = "baseline";
  }
  mode_cache = mode;
  return mode;
}

export function get_mode() {
  return read_mode();
}

export function clear_model_caches() {
  mode_cache = null;
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === NEW_KEYS.mode) mode_cache = null;
  });
}

// ---------- counters (memory only, mirrored to window.__mirra_model_stats for the console and the dev page) ----------
const stats = { noop_writes: 0, dropped_writes: 0, blocked_writes: 0, dropped: [], blocked: [] };

function publish_stats() {
  try {
    if (typeof window !== "undefined") window.__mirra_model_stats = stats;
  } catch {
    // ignore
  }
}

function note(list, key, reason) {
  if (list.length < MAX_LISTED) list.push({ key, reason });
  publish_stats();
}

export function get_model_stats() {
  publish_stats();
  return {
    mode: read_mode(),
    noop_writes: stats.noop_writes,
    dropped_writes: stats.dropped_writes,
    blocked_writes: stats.blocked_writes,
    dropped: stats.dropped.slice(),
    blocked: stats.blocked.slice(),
  };
}

export function reset_model_stats() {
  stats.noop_writes = 0;
  stats.dropped_writes = 0;
  stats.blocked_writes = 0;
  stats.dropped.length = 0;
  stats.blocked.length = 0;
  publish_stats();
}

// ---------- comparing a page's write-back with the baseline ----------
function strip(value, names) {
  if (Array.isArray(value)) return value.map((item) => strip(item, names));
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (!names.includes(key)) out[key] = strip(value[key], names);
    }
    return out;
  }
  return value;
}

function same_ignoring(a_text, b_text, names) {
  if (a_text === null || a_text === undefined || b_text === null || b_text === undefined) return false;
  if (a_text === b_text) return true;
  try {
    return JSON.stringify(strip(JSON.parse(a_text), names)) === JSON.stringify(strip(JSON.parse(b_text), names));
  } catch {
    return false;
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

// The baseline value of a modelled key: the raw stored string, or null when the baseline holds it as absent.
function baseline_raw_for(entry) {
  const meta = read_json(NEW_KEYS.baseline_meta);
  if (!meta || !Array.isArray(meta.codes) || !meta.codes.includes(entry.code)) return null;
  return window.localStorage.getItem(baseline_entry_key(entry.code));
}

function block_reason(key) {
  if (UNMODELLED_KEYS.includes(key)) return "unmodelled";
  if (EXCLUDED_KEYS.includes(key)) return "excluded";
  return "unregistered";
}

// ---------- the three functions every storage module calls ----------
export function getItem(key) {
  if (read_mode() !== "model") return window.localStorage.getItem(key);
  const entry = find_modelled_entry(key);
  if (entry) return baseline_raw_for(entry);
  return window.localStorage.getItem(key);
}

export function setItem(key, value) {
  if (read_mode() !== "model") return window.localStorage.setItem(key, value);
  const entry = find_modelled_entry(key);
  if (!entry) {
    stats.blocked_writes += 1;
    note(stats.blocked, key, block_reason(key));
    return undefined;
  }
  const current = baseline_raw_for(entry);
  if (current === null) {
    stats.dropped_writes += 1;
    note(stats.dropped, key, "baseline_absent");
    return undefined;
  }
  const names = entry.volatile ?? DEFAULT_VOLATILE;
  if (same_ignoring(current, String(value), names)) {
    stats.noop_writes += 1;
    publish_stats();
    return undefined;
  }
  // Slice 1 stores no differences (slice 3 does): the write is discarded and counted so it is visible, never lost silently.
  stats.dropped_writes += 1;
  note(stats.dropped, key, "difference_not_stored_yet");
  return undefined;
}

export function removeItem(key) {
  if (read_mode() !== "model") return window.localStorage.removeItem(key);
  const entry = find_modelled_entry(key);
  if (!entry) {
    stats.blocked_writes += 1;
    note(stats.blocked, key, block_reason(key));
    return undefined;
  }
  stats.dropped_writes += 1;
  note(stats.dropped, key, "remove_not_stored_yet");
  return undefined;
}

export const model_storage = { getItem, setItem, removeItem };

// ---------- baseline: completeness, snapshot, mode switch ----------
function fail(reason, message) {
  return { ok: false, reason, message };
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

export function has_complete_baseline() {
  try {
    const store = window.localStorage;
    const meta = read_json(NEW_KEYS.baseline_meta);
    if (!meta || meta.version !== 1 || meta.registry_version !== REGISTRY_VERSION) return false;
    if (!Array.isArray(meta.codes) || !Array.isArray(meta.absent_codes)) return false;
    const registry_codes = MODELLED_KEYS.map((entry) => entry.code);
    const listed = [...meta.codes, ...meta.absent_codes];
    if (listed.length !== registry_codes.length || new Set(listed).size !== listed.length) return false;
    if (!registry_codes.every((code) => listed.includes(code))) return false;
    return meta.codes.every((code) => store.getItem(baseline_entry_key(code)) !== null);
  } catch {
    return false;
  }
}

// Copies every modelled source key (raw string, byte for byte) into its baseline entry, then writes the meta key LAST.
// All-or-nothing: on any failure the entries already written are put back exactly as they were (Addendum 12 owner answers D, F, G).
// Only allowed with Model mode off (the real data is what is being copied).
export function take_baseline_snapshot() {
  if (read_mode() === "model") {
    return fail("model_mode_active", "Switch to baseline mode before copying the baseline.");
  }
  const store = window.localStorage;
  const sources = MODELLED_KEYS.map((entry) => ({
    entry,
    raw: store.getItem(entry.key),
    name: baseline_entry_key(entry.code),
  }));
  const touched = [...sources.map((source) => source.name), NEW_KEYS.baseline_meta];
  const previous = new Map(touched.map((name) => [name, store.getItem(name)]));

  const restore = () => {
    // Remove what did not exist before, then put old values back shrinking ones first so a full store cannot block the restore.
    const to_set = [];
    for (const name of touched) {
      const old_value = previous.get(name);
      let current = null;
      try {
        current = store.getItem(name);
      } catch {
        current = null;
      }
      if (old_value === null) {
        try {
          if (current !== null) store.removeItem(name);
        } catch {
          // ignore
        }
      } else if (current !== old_value) {
        to_set.push({ name, old_value, delta: old_value.length - (current ? current.length : 0) });
      }
    }
    to_set.sort((a, b) => a.delta - b.delta);
    for (const item of to_set) {
      try {
        store.setItem(item.name, item.old_value);
      } catch {
        // ignore: reported by the caller as a failed copy
      }
    }
  };

  try {
    const codes = [];
    const absent_codes = [];
    let bytes = 0;
    for (const source of sources) {
      if (source.raw === null) {
        absent_codes.push(source.entry.code);
        if (previous.get(source.name) !== null) store.removeItem(source.name);
      } else {
        store.setItem(source.name, source.raw);
        codes.push(source.entry.code);
        bytes += source.raw.length;
      }
    }
    const meta = {
      version: 1,
      locked: false,
      locked_at: "",
      source: "dev_copy",
      taken_at: new Date().toISOString(),
      registry_version: REGISTRY_VERSION,
      codes,
      absent_codes,
    };
    store.setItem(NEW_KEYS.baseline_meta, JSON.stringify(meta));
    for (const source of sources) {
      const back = store.getItem(source.name);
      if (source.raw === null ? back !== null : back !== source.raw) {
        throw new Error("verify failed for " + source.name);
      }
    }
    return { ok: true, entries: codes.length, absent: absent_codes.length, bytes };
  } catch (error) {
    restore();
    if (is_quota_error(error)) return fail("storage_full", MODEL_STORAGE_FULL_MESSAGE);
    return fail("write_failed", "The baseline copy failed and was undone. Nothing was changed.");
  }
}

// Switch mode. "model" is refused (nothing changes) unless a complete baseline exists. Entering Model mode creates the empty
// differences and scenarios keys if they are missing (so a visit can be checked to leave them empty). Pages must be reloaded
// after a switch: the hooks read their state once on mount.
export function set_mode(next) {
  if (next !== "baseline" && next !== "model") return fail("bad_mode", "Unknown mode.");
  try {
    const store = window.localStorage;
    if (next === "model") {
      if (!has_complete_baseline()) {
        return fail("no_baseline", "Model mode needs a baseline first. Copy the baseline, then try again. Nothing was changed.");
      }
      if (store.getItem(NEW_KEYS.diffs) === null) {
        store.setItem(NEW_KEYS.diffs, JSON.stringify({ version: 1, by_key: {} }));
      }
      if (store.getItem(NEW_KEYS.scenarios) === null) {
        store.setItem(NEW_KEYS.scenarios, JSON.stringify({ version: 1, items: [] }));
      }
    }
    store.setItem(NEW_KEYS.mode, JSON.stringify({ version: 1, mode: next, changed_at: new Date().toISOString() }));
    mode_cache = next;
    return { ok: true, mode: next };
  } catch (error) {
    if (is_quota_error(error)) return fail("storage_full", MODEL_STORAGE_FULL_MESSAGE);
    return fail("write_failed", "The mode could not be changed. Nothing was changed.");
  }
}