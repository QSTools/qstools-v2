const STORAGE_KEY = "qs_tools_module_reconciliation_acceptance_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function getNowIso() {
  return new Date().toISOString();
}

export function getModuleReconciliationAcceptanceStorageKey() {
  return STORAGE_KEY;
}

// Stored shape: { [check_id]: { check_id, accepted_variance_amount, reason, accepted_at } }
//
// One record per check_id, per S20 section 7 - a new Accept overwrites
// the previous acceptance for that same check rather than appending a
// history list, so an object map keyed by check_id is used rather than
// an array (matching the "currently accepted" single-state-per-check
// behaviour, not a log).
export function getStoredModuleReconciliationAcceptances() {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function setStoredModuleReconciliationAcceptances(acceptances = {}) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(acceptances));
}

// High-level action: record a new acceptance for one check, overwriting
// any previous acceptance for that same check_id (S20 section 7).
// Returns the updated full map so a hook can update its own state from
// the return value without a second storage read.
export function acceptModuleReconciliationCheck({
  check_id,
  accepted_variance_amount,
  reason,
}) {
  const current = getStoredModuleReconciliationAcceptances();

  const record = {
    check_id,
    accepted_variance_amount: Number(accepted_variance_amount) || 0,
    reason: String(reason || "").trim(),
    accepted_at: getNowIso(),
  };

  const updated = {
    ...current,
    [check_id]: record,
  };

  setStoredModuleReconciliationAcceptances(updated);

  return updated;
}

// High-level action: remove an acceptance entirely. Not part of S20's
// core flow (reopening is automatic, per section 6) but kept available
// for a future manual "undo" affordance without needing a new storage
// function later.
export function removeModuleReconciliationAcceptance(check_id) {
  const current = getStoredModuleReconciliationAcceptances();

  if (!(check_id in current)) return current;

  const updated = { ...current };
  delete updated[check_id];

  setStoredModuleReconciliationAcceptances(updated);

  return updated;
}
