"use client";

// Balance Sheet storage - follows the same pattern as revenueCogsStorage.js
// (localStorage-backed, buildState() normaliser merging overrides over
// defaults, load/save pair with silent-fail). Unlike Revenue/COGS, this
// state is entirely IMPORT-DERIVED (from xeroBalanceSheetImporter.js), not
// user-entered form fields - so there are no per-field input normalisers
// here, just a straightforward shape holding whatever the importer last
// produced, plus import metadata.

const STORAGE_KEY = "qs_tools_balance_sheet_state_v1";

function getIsoNow() {
  return new Date().toISOString();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseAccountRow(row = {}) {
  return {
    section: row.section || null,
    subsection: row.subsection || null,
    account_name: row.account_name || "",
    amount: toNumberOrNull(row.amount),
  };
}

function normaliseAccounts(accounts) {
  if (!Array.isArray(accounts)) return [];
  return accounts.map(normaliseAccountRow).filter((row) => row.account_name);
}

function normaliseTotals(totals) {
  if (!totals || typeof totals !== "object") return {};

  const result = {};
  for (const [key, value] of Object.entries(totals)) {
    const num = toNumberOrNull(value);
    if (num !== null) result[key] = num;
  }
  return result;
}

const DEFAULT_BALANCE_SHEET_STATE = {
  as_at_date: null,
  accounts: [],
  totals: {},
  import_warnings: [],
  source_filename: "",
  imported_at: "",
  created_at: "",
  updated_at: "",
};

export function getDefaultBalanceSheetState() {
  const now = getIsoNow();

  return {
    ...DEFAULT_BALANCE_SHEET_STATE,
    created_at: now,
    updated_at: now,
  };
}

export function buildBalanceSheetState(overrides = {}) {
  const now = getIsoNow();
  const base = getDefaultBalanceSheetState();

  return {
    ...base,
    ...overrides,
    as_at_date: overrides.as_at_date ?? base.as_at_date,
    accounts: normaliseAccounts(overrides.accounts ?? base.accounts),
    totals: normaliseTotals(overrides.totals ?? base.totals),
    import_warnings: Array.isArray(overrides.import_warnings)
      ? overrides.import_warnings
      : base.import_warnings,
    source_filename: overrides.source_filename || base.source_filename,
    imported_at: overrides.imported_at || base.imported_at,
    created_at: overrides.created_at || base.created_at,
    updated_at: overrides.updated_at || now,
  };
}

function parseStoredState(raw) {
  if (!raw) {
    return getDefaultBalanceSheetState();
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object") {
      return buildBalanceSheetState(parsed);
    }
  } catch {
    // Ignore invalid JSON and fall through to defaults.
  }

  return getDefaultBalanceSheetState();
}

export function loadBalanceSheetState() {
  if (typeof window === "undefined") {
    return getDefaultBalanceSheetState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredState(raw);
  } catch {
    return getDefaultBalanceSheetState();
  }
}

export function saveBalanceSheetState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(buildBalanceSheetState(state))
    );
  } catch {
    // Fail silently if storage is unavailable.
  }
}

/**
 * buildBalanceSheetStateFromImport
 *
 * Convenience helper - takes the raw output of
 * parseXeroBalanceSheetWorkbook/parseXeroBalanceSheetFile
 * (lib/imports/xeroBalanceSheetImporter.js) plus the source filename, and
 * builds a properly-shaped state ready to save. Kept as a separate named
 * function (rather than expecting callers to know the field-name mapping
 * themselves) so the importer's output shape and this storage shape can
 * evolve independently without every call site needing to know both.
 */
export function buildBalanceSheetStateFromImport({ as_at_date, accounts, totals, warnings }, source_filename = "") {
  return buildBalanceSheetState({
    as_at_date,
    accounts,
    totals,
    import_warnings: warnings || [],
    source_filename,
    imported_at: getIsoNow(),
  });
}