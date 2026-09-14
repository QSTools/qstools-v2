"use client";

// Fixed Asset Register storage - follows the same pattern as
// balanceSheetStorage.js (localStorage-backed, buildState() normaliser,
// load/save pair). This stores the RAW IMPORTED register data as a
// staging area - separate from lib/storage/assetStorage.js (the real
// Assets module records). Matching a register asset to a real Assets
// module record, and updating that record's purchase_price, is a
// SEPARATE, later step (per FIXED_ASSET_REGISTER_IMPORT_SCOPING_BRIEF_2026-09-12.txt -
// dropdown select-and-assign, not automatic) - this file only holds
// what was imported, plus which register assets have already been
// matched (matched_asset_id, so re-visiting the import page doesn't
// lose track of progress).

const STORAGE_KEY = "qs_tools_fixed_asset_register_state_v1";

function getIsoNow() {
  return new Date().toISOString();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseRegisterAsset(asset = {}) {
  return {
    asset_number: asset.asset_number || "",
    asset_name: asset.asset_name || "",
    asset_status: asset.asset_status || "",
    purchase_date: asset.purchase_date || null,
    purchase_price: toNumberOrNull(asset.purchase_price),
    asset_type: asset.asset_type || "",
    depreciation_method: asset.depreciation_method || "",
    depreciation_rate: toNumberOrNull(asset.depreciation_rate),
    book_value: toNumberOrNull(asset.book_value),
    accumulated_depreciation: toNumberOrNull(asset.accumulated_depreciation),
    depreciation_to_date: asset.depreciation_to_date || null,
    serial_number: asset.serial_number || "",
    // Which real Assets module asset_id this register row has been
    // matched to, if any - null until the user picks one via the
    // dropdown. Separate concern from the import itself.
    matched_asset_id: asset.matched_asset_id || null,
  };
}

function normaliseAssets(assets) {
  if (!Array.isArray(assets)) return [];
  return assets.map(normaliseRegisterAsset).filter((a) => a.asset_name);
}

const DEFAULT_STATE = {
  assets: [],
  import_warnings: [],
  source_filename: "",
  imported_at: "",
  created_at: "",
  updated_at: "",
};

export function getDefaultFixedAssetRegisterState() {
  const now = getIsoNow();
  return { ...DEFAULT_STATE, created_at: now, updated_at: now };
}

export function buildFixedAssetRegisterState(overrides = {}) {
  const now = getIsoNow();
  const base = getDefaultFixedAssetRegisterState();

  return {
    ...base,
    ...overrides,
    assets: normaliseAssets(overrides.assets ?? base.assets),
    import_warnings: Array.isArray(overrides.import_warnings) ? overrides.import_warnings : base.import_warnings,
    source_filename: overrides.source_filename || base.source_filename,
    imported_at: overrides.imported_at || base.imported_at,
    created_at: overrides.created_at || base.created_at,
    updated_at: overrides.updated_at || now,
  };
}

function parseStoredState(raw) {
  if (!raw) return getDefaultFixedAssetRegisterState();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return buildFixedAssetRegisterState(parsed);
    }
  } catch {
    // Ignore invalid JSON and fall through to defaults.
  }
  return getDefaultFixedAssetRegisterState();
}

export function loadFixedAssetRegisterState() {
  if (typeof window === "undefined") return getDefaultFixedAssetRegisterState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseStoredState(raw);
  } catch {
    return getDefaultFixedAssetRegisterState();
  }
}

export function saveFixedAssetRegisterState(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildFixedAssetRegisterState(state)));
  } catch {
    // Fail silently if storage is unavailable.
  }
}

export function buildFixedAssetRegisterStateFromImport({ assets, warnings }, source_filename = "") {
  return buildFixedAssetRegisterState({
    assets,
    import_warnings: warnings || [],
    source_filename,
    imported_at: getIsoNow(),
  });
}