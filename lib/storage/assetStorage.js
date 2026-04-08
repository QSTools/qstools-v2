"use client";

import { useEffect, useMemo, useState } from "react";

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

export function createEmptyAssetState() {
  const timestamp = create_timestamp();

  return {
    asset_id: create_uuid(),
    owner_scope_id: "",
    asset_name: "",

    // 🔹 NEW FIELDS (Phase 1)
    asset_type: "productive", // "productive" | "support"
    available_hours_per_year: 0,
    utilisation_percent: 0,

    // 🔹 EXISTING FIELDS (UNCHANGED)
    purchase_price: 0,
    interest_rate: 0,
    finance_term_years: 0,
    maintenance_cost_monthly: 0,
    fuel_cost_monthly: 0,
    registration_cost_monthly: 0,
    other_running_cost_monthly: 0,

    profile_version: 1,
    effective_from: "",
    is_active: true,
    is_retired: false,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function sanitizeAssetState(input = {}) {
  const empty_state = createEmptyAssetState();

  return {
    ...empty_state,
    ...input,

    asset_id: input.asset_id || empty_state.asset_id,

    // 🔹 NEW FIELD SANITIZATION
    asset_type:
      input.asset_type === "support" ? "support" : "productive",

    available_hours_per_year: Number(
      input.available_hours_per_year || 0
    ),
    utilisation_percent: Number(input.utilisation_percent || 0),

    // 🔹 EXISTING SANITIZATION
    purchase_price: Number(input.purchase_price || 0),
    interest_rate: Number(input.interest_rate || 0),
    finance_term_years: Number(input.finance_term_years || 0),
    maintenance_cost_monthly: Number(
      input.maintenance_cost_monthly || 0
    ),
    fuel_cost_monthly: Number(input.fuel_cost_monthly || 0),
    registration_cost_monthly: Number(
      input.registration_cost_monthly || 0
    ),
    other_running_cost_monthly: Number(
      input.other_running_cost_monthly || 0
    ),

    profile_version: Number(input.profile_version || 1),
    is_active:
      input.is_active !== undefined ? Boolean(input.is_active) : true,
    is_retired: Boolean(input.is_retired),

    created_at: input.created_at || empty_state.created_at,
    updated_at: input.updated_at || create_timestamp(),
  };
}

function sanitizeSavedAssetRecord(input = {}) {
  const sanitized = sanitizeAssetState(input);

  return {
    ...sanitized,
    finance_cost_annual: Number(input.finance_cost_annual || 0),
    running_cost_annual: Number(input.running_cost_annual || 0),
    total_asset_cost_annual: Number(
      input.total_asset_cost_annual || 0
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
    const sanitized_state = sanitizeAssetState(asset_state);
    const timestamp = create_timestamp();

    const saved_record = sanitizeSavedAssetRecord({
      ...sanitized_state,
      ...calculations,
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
        asset.asset_id === saved_record.asset_id
          ? saved_record
          : asset
      );
    });

    set_asset_state(saved_record);

    return saved_record;
  }

  function load_asset(asset_id) {
    const selected_asset =
      saved_assets.find((asset) => asset.asset_id === asset_id) ||
      null;

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
    return saved_assets.filter((asset) => !asset.is_retired)
      .length;
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