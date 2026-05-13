"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateAssetOutputs } from "@/lib/calculations/assetCalculations";

const ASSET_STATE_STORAGE_KEY = "qs_tools_asset_state";
const SAVED_ASSETS_STORAGE_KEY = "qs_tools_saved_assets";

function create_uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function create_timestamp() {
  return new Date().toISOString();
}

function get_next_profile_version(existing_asset = {}) {
  const current_version = Number(existing_asset.profile_version || 0);
  return current_version > 0 ? current_version + 1 : 1;
}

export function createEmptyAssetState() {
  const timestamp = create_timestamp();

  return {
    asset_id: create_uuid(),
    owner_scope_id: "",
    asset_name: "",
    asset_type: "productive",

    purchase_price: 0,
    interest_rate: 0,
    finance_start_date: "",
    finance_term_years: 0,
    finance_paid_off: false,

    // Finance lifecycle controls.
    // These describe the current asset finance state only.
    // Pressure comparison belongs to the future Pressure Layer.
    finance_paid_off_date: "",
    early_payoff_amount: 0,
    early_payoff_notes: "",

    finance_term_extended: false,
    original_finance_end_date: "",
    revised_finance_end_date: "",
    revised_term_months: 0,
    extension_reason: "",

    // Kept for wiring stability only. Not used in Phase 1 UI.
    maintenance_cost_monthly: 0,
    fuel_cost_monthly: 0,
    registration_cost_monthly: 0,
    other_running_cost_monthly: 0,

    assets_benchmark_total: 0,
    no_active_assets_confirmed: false,

    profile_version: 1,
    effective_from: "",
    is_active: true,
    is_retired: false,
    created_at: timestamp,
    updated_at: timestamp,

    // Future pressure-layer readiness metadata.
    // These are record/context fields only.
    change_reason: "",
    notes: "",
  };
}

export function sanitizeAssetState(input = {}) {
  const empty_state = createEmptyAssetState();

  return {
    ...empty_state,
    ...input,

    asset_id: input.asset_id || empty_state.asset_id,

    asset_type: input.asset_type === "support" ? "support" : "productive",

    purchase_price: Number(input.purchase_price || 0),
    interest_rate: Number(input.interest_rate || 0),
    finance_start_date:
      typeof input.finance_start_date === "string"
        ? input.finance_start_date
        : "",
    finance_term_years: Number(input.finance_term_years || 0),
    finance_paid_off: Boolean(input.finance_paid_off),

    finance_paid_off_date:
      typeof input.finance_paid_off_date === "string"
        ? input.finance_paid_off_date
        : "",
    early_payoff_amount: Number(input.early_payoff_amount || 0),
    early_payoff_notes:
      typeof input.early_payoff_notes === "string"
        ? input.early_payoff_notes
        : "",

    finance_term_extended: Boolean(input.finance_term_extended),
    original_finance_end_date:
      typeof input.original_finance_end_date === "string"
        ? input.original_finance_end_date
        : "",
    revised_finance_end_date:
      typeof input.revised_finance_end_date === "string"
        ? input.revised_finance_end_date
        : "",
    revised_term_months: Number(input.revised_term_months || 0),
    extension_reason:
      typeof input.extension_reason === "string" ? input.extension_reason : "",

    maintenance_cost_monthly: Number(input.maintenance_cost_monthly || 0),
    fuel_cost_monthly: Number(input.fuel_cost_monthly || 0),
    registration_cost_monthly: Number(input.registration_cost_monthly || 0),
    other_running_cost_monthly: Number(input.other_running_cost_monthly || 0),

    assets_benchmark_total: Number(input.assets_benchmark_total || 0),
    no_active_assets_confirmed: Boolean(input.no_active_assets_confirmed),

    profile_version: Number(input.profile_version || 1),
    effective_from:
      typeof input.effective_from === "string" ? input.effective_from : "",
    is_active: input.is_active !== undefined ? Boolean(input.is_active) : true,
    is_retired: Boolean(input.is_retired),

    created_at: input.created_at || empty_state.created_at,
    updated_at: input.updated_at || create_timestamp(),

    change_reason:
      typeof input.change_reason === "string" ? input.change_reason : "",
    notes: typeof input.notes === "string" ? input.notes : "",
  };
}

function sanitizeSavedAssetRecord(input = {}) {
  const sanitized = sanitizeAssetState(input);
  const recalculated = calculateAssetOutputs(
    sanitized,
    [],
    sanitized.assets_benchmark_total
  );

  const asset_interest_annual = Number(
    recalculated.asset_interest_annual ??
      input.asset_interest_annual ??
      input.interest_annual ??
      0
  );

  const asset_principal_repayment_annual = Number(
    recalculated.asset_principal_repayment_annual ??
      input.asset_principal_repayment_annual ??
      input.principal_annual ??
      0
  );

  return {
    ...sanitized,

    finance_end_date:
      recalculated.finance_end_date || input.finance_end_date || "",
    original_finance_end_date:
      recalculated.original_finance_end_date ||
      input.original_finance_end_date ||
      "",
    revised_finance_end_date:
      recalculated.revised_finance_end_date ||
      input.revised_finance_end_date ||
      "",
    effective_finance_term_years: Number(
      recalculated.effective_finance_term_years ??
        input.effective_finance_term_years ??
        0
    ),

    finance_active: Boolean(recalculated.finance_active),
    finance_status:
      recalculated.finance_status || input.finance_status || "not_financed",

    estimated_remaining_finance_balance: Number(
      recalculated.estimated_remaining_finance_balance ??
        input.estimated_remaining_finance_balance ??
        0
    ),
    finance_progress_percent: Number(
      recalculated.finance_progress_percent ??
        input.finance_progress_percent ??
        0
    ),

    // Legacy principal aliases are retained for future Cash Flow support only.
    principal_annual: asset_principal_repayment_annual,
    interest_annual: asset_interest_annual,
    asset_interest_annual,
    asset_principal_repayment_annual,
    asset_total_finance_payment_annual: Number(
      recalculated.asset_total_finance_payment_annual ??
        input.asset_total_finance_payment_annual ??
        0
    ),
    finance_cost_annual: asset_interest_annual,
    running_cost_annual: Number(input.running_cost_annual || 0),
    total_asset_cost_annual: Number(
      recalculated.total_asset_cost_annual ?? input.total_asset_cost_annual ?? 0
    ),
  };
}

function readStoredAssetState() {
  if (typeof window === "undefined") {
    return createEmptyAssetState();
  }

  try {
    const raw = window.localStorage.getItem(ASSET_STATE_STORAGE_KEY);
    if (!raw) {
      return createEmptyAssetState();
    }

    return sanitizeAssetState(JSON.parse(raw));
  } catch {
    return createEmptyAssetState();
  }
}

function readStoredSavedAssets() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SAVED_ASSETS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((asset) => sanitizeSavedAssetRecord(asset))
      : [];
  } catch {
    return [];
  }
}

export function useAssetStorage() {
  const [asset_state, set_asset_state] = useState(() =>
    createEmptyAssetState()
  );
  const [saved_assets, set_saved_assets] = useState(() => []);
  const [has_hydrated, set_has_hydrated] = useState(false);

  useEffect(() => {
    const stored_asset_state = readStoredAssetState();
    const stored_saved_assets = readStoredSavedAssets();

    set_asset_state(stored_asset_state);
    set_saved_assets(stored_saved_assets);
    set_has_hydrated(true);
  }, []);

  useEffect(() => {
    if (!has_hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      ASSET_STATE_STORAGE_KEY,
      JSON.stringify(asset_state)
    );
  }, [asset_state, has_hydrated]);

  useEffect(() => {
    if (!has_hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      SAVED_ASSETS_STORAGE_KEY,
      JSON.stringify(saved_assets)
    );
  }, [saved_assets, has_hydrated]);

  function set_asset_field(field_name, value) {
    set_asset_state((current) => ({
      ...current,
      [field_name]: value,
      updated_at: create_timestamp(),
    }));
  }

  function set_asset_fields(partial_state) {
    set_asset_state((current) => ({
      ...current,
      ...partial_state,
      updated_at: create_timestamp(),
    }));
  }

  function replace_asset_state(next_state) {
    set_asset_state(sanitizeAssetState(next_state));
  }

  function reset_asset_state() {
    set_asset_state(createEmptyAssetState());
  }

  function save_asset(calculations) {
    const timestamp = create_timestamp();
    const existing_asset =
      saved_assets.find((asset) => asset.asset_id === asset_state.asset_id) ||
      null;

    const sanitized_state = sanitizeAssetState({
      ...asset_state,
      profile_version: existing_asset
        ? get_next_profile_version(existing_asset)
        : Number(asset_state.profile_version || 1),
      created_at:
        existing_asset?.created_at || asset_state.created_at || timestamp,
      updated_at: timestamp,
      is_active: asset_state.is_active !== false,
      effective_from:
        asset_state.effective_from ||
        existing_asset?.effective_from ||
        asset_state.created_at ||
        timestamp,
      change_reason:
        asset_state.change_reason || existing_asset?.change_reason || "",
      notes: asset_state.notes || existing_asset?.notes || "",
    });

    const saved_record = sanitizeSavedAssetRecord({
      ...sanitized_state,
      ...calculations,
      profile_version: sanitized_state.profile_version,
      created_at: sanitized_state.created_at,
      updated_at: timestamp,
    });

    set_saved_assets((current) => {
      const existing_index = current.findIndex(
        (asset) => asset.asset_id === saved_record.asset_id
      );

      if (existing_index === -1) {
        return [...current, saved_record];
      }

      return current.map((asset) =>
        asset.asset_id === saved_record.asset_id ? saved_record : asset
      );
    });

    set_asset_state(saved_record);

    return saved_record;
  }

  function load_asset(asset_id) {
    const selected_asset =
      saved_assets.find((asset) => asset.asset_id === asset_id) || null;

    if (!selected_asset) {
      return null;
    }

    const sanitized_asset = sanitizeAssetState(selected_asset);
    set_asset_state(sanitized_asset);
    return sanitized_asset;
  }

  function delete_asset(asset_id) {
    set_saved_assets((current) =>
      current.filter((asset) => asset.asset_id !== asset_id)
    );

    set_asset_state((current) => {
      if (current.asset_id !== asset_id) {
        return current;
      }

      return createEmptyAssetState();
    });
  }

  const active_asset_count = useMemo(() => {
    return saved_assets.filter((asset) => !asset.is_retired).length;
  }, [saved_assets]);

  return {
    asset_state,
    saved_assets,
    active_asset_count,
    set_asset_field,
    set_asset_fields,
    replace_asset_state,
    reset_asset_state,
    save_asset,
    load_asset,
    delete_asset,
  };
}