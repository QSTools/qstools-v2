"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "qs_tools_recovery_summary_state";

export const DEFAULT_RECOVERY_SUMMARY_STATE = {
  recovery_model: "labour_only",
  labour_share_percent: 100,
  asset_share_percent: 0,
  overhead_share_percent: 0,
};

function parse_stored_state(value) {
  if (!value) {
    return DEFAULT_RECOVERY_SUMMARY_STATE;
  }

  try {
    const parsed_value = JSON.parse(value);

    return {
      ...DEFAULT_RECOVERY_SUMMARY_STATE,
      ...parsed_value,
    };
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

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recovery_state));
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
  const [recovery_state, set_recovery_state] = useState(
    DEFAULT_RECOVERY_SUMMARY_STATE
  );

  useEffect(() => {
    set_recovery_state(getRecoverySummaryState());
  }, []);

  useEffect(() => {
    saveRecoverySummaryState(recovery_state);
  }, [recovery_state]);

  function update_recovery_field(field_name, value) {
    set_recovery_state((current_state) => ({
      ...current_state,
      [field_name]:
        field_name === "recovery_model" ? value : Number(value ?? 0),
    }));
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