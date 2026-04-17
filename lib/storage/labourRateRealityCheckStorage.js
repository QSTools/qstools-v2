"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "qs_tools_labour_rate_reality_check_v1";

export const DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE = {
  labour_rate: 40,
  hours_per_week: 40,
  days_per_week: 5,
};

function load_state() {
  if (typeof window === "undefined") {
    return DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE,
      ...parsed,
    };
  } catch {
    return DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE;
  }
}

export function useLabourRateRealityCheckStorage() {
  const [reality_check_state, set_reality_check_state] = useState(
    DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE
  );

  useEffect(() => {
    set_reality_check_state(load_state());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(reality_check_state)
    );
  }, [reality_check_state]);

  const update_reality_check_field = useCallback((field, value) => {
    set_reality_check_state((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const reset_reality_check_state = useCallback(() => {
    set_reality_check_state(DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE);
  }, []);

  return {
    reality_check_state,
    set_reality_check_state,
    update_reality_check_field,
    reset_reality_check_state,
  };
}