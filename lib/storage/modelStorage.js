// R3 slice 1 (Business Modelling brief, Addendum 12 owner answer A). The ONE door between the storage modules and
// window.localStorage. BATCH 1 = exact pass-through: every call is the same call the module made before, so with
// Model mode off nothing changes. Mode, baseline and difference handling arrive in later batches behind these same
// three functions. Written so it can later become asynchronous (database, R6) without changing what callers mean.
// Deliberately no import of anything else, so it stays testable in plain node.

export function getItem(key) {
  return window.localStorage.getItem(key);
}

export function setItem(key, value) {
  return window.localStorage.setItem(key, value);
}

export function removeItem(key) {
  return window.localStorage.removeItem(key);
}

export const model_storage = { getItem, setItem, removeItem };