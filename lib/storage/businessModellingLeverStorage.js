// lib/storage/businessModellingLeverStorage.js
//
// Business Modelling lever inputs (v6.0 redesign, step 2). Inputs only -
// never calculated totals. Separate key from the legacy scenario storage and
// from the 2026-09-14 scenario redesign storage.
// normaliseLevers explicitly rebuilds the object (bug class b): only string
// or number values under sane keys survive; anything else is dropped.
// Values are kept as strings so half-typed input ("8" on the way to "80")
// is preserved exactly as typed.

const STORAGE_KEY = "qs_tools_business_modelling_levers_v1";
const MAX_KEY_LENGTH = 200;
const MAX_VALUE_LENGTH = 24;

export function normaliseLevers(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  Object.entries(raw).forEach(([key, value]) => {
    if (typeof key !== "string" || key.length === 0 || key.length > MAX_KEY_LENGTH) return;
    if (typeof value !== "string" && typeof value !== "number") return;
    const text = String(value).trim();
    if (text === "" || text.length > MAX_VALUE_LENGTH) return;
    out[key] = text;
  });
  return out;
}

export function readModellingLevers() {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return normaliseLevers(JSON.parse(stored)?.levers);
  } catch {
    return {};
  }
}

export function writeModellingLevers(levers) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, levers: normaliseLevers(levers) })
    );
  } catch {
    // storage unavailable or full - levers stay in memory for this session
  }
}

export function clearModellingLevers() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}