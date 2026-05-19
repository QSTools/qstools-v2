"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "qs_tools_recovery_summary_state";

export const DEFAULT_RECOVERY_SUMMARY_STATE = {
  recovery_model: "labour_led",
  labour_share_percent: 100,
  asset_share_percent: 0,
  material_share_percent: 0,
  overhead_absorbed_percent: 0,
};

function normalise_recovery_model(value) {
  if (value === "labour_only") return "labour_led";
  if (value === "asset_driven") return "asset_led";

  if (
    value === "labour_led" ||
    value === "asset_led" ||
    value === "material_led" ||
    value === "hybrid"
  ) {
    return value;
  }

  return DEFAULT_RECOVERY_SUMMARY_STATE.recovery_model;
}

function normalise_recovery_state(value = {}) {
  const overhead_absorbed_percent =
    value.overhead_absorbed_percent ??
    value.overhead_share_percent ??
    DEFAULT_RECOVERY_SUMMARY_STATE.overhead_absorbed_percent;

  return {
    ...DEFAULT_RECOVERY_SUMMARY_STATE,
    ...value,
    recovery_model: normalise_recovery_model(value.recovery_model),
    labour_share_percent: Number(value.labour_share_percent ?? 100),
    asset_share_percent: Number(value.asset_share_percent ?? 0),
    material_share_percent: Number(value.material_share_percent ?? 0),
    overhead_absorbed_percent: Number(overhead_absorbed_percent ?? 0),
  };
}

function parse_stored_state(value) {
  if (!value) {
    return DEFAULT_RECOVERY_SUMMARY_STATE;
  }

  try {
    const parsed_value = JSON.parse(value);
    return normalise_recovery_state(parsed_value);
  } catch (error) {
    return DEFAULT_RECOVERY_SUMMARY_STATE;
  }
}

export function getRecoverySummaryState() {
  if (typeof window === "undefined") {
    return DEFAULT_RECOVERY_SUMMARY_STATE;
  }

  return parse_stored_state(window.localStorage.getItem(STORAGE_KEY));
}

export function saveRecoverySummaryState(recovery_state) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalise_recovery_state(recovery_state))
  );
}

export function resetRecoverySummaryState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(DEFAULT_RECOVERY_SUMMARY_STATE)
  );
}

export function useRecoverySummaryStorage() {
  const [recovery_state, set_recovery_state] = useState(() =>
    getRecoverySummaryState()
  );

  useEffect(() => {
    saveRecoverySummaryState(recovery_state);
  }, [recovery_state]);

  function update_recovery_field(field_name, value) {
    set_recovery_state((current_state) =>
      normalise_recovery_state({
        ...current_state,
        [field_name]:
          field_name === "recovery_model" ? value : Number(value ?? 0),
      })
    );
  }

  function reset_recovery_state() {
    set_recovery_state(DEFAULT_RECOVERY_SUMMARY_STATE);
  }

  return {
    recovery_state,
    set_recovery_state,
    update_recovery_field,
    reset_recovery_state,
  };
}