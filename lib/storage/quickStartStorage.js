"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "qs_tools_quick_start_state_v6";

export const DEFAULT_QUICK_START_STATE = {
  business_type: "labour_rate_reality_check",

  labour_rate: 40,
  hours_per_week: 40,

  labour_hours: 40,
  total_job_price: 20000,
  staff_assigned: 2,

  product_cost: 8000,
  product_margin_percent: 20,

  total_m2: 130,
  rate_per_m2: 13,
  expected_task_hours: 8,
  expected_labour_margin_percent: 20,

  machine_rate: 120,
  operator_rate: 45,
  charge_out_rate: 180,
  utilisation_hours: 30,
};

function load_state() {
  if (typeof window === "undefined") {
    return DEFAULT_QUICK_START_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_QUICK_START_STATE;
    }

    return {
      ...DEFAULT_QUICK_START_STATE,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_QUICK_START_STATE;
  }
}

export function useQuickStartStorage() {
  const [quick_start_state, set_quick_start_state] = useState(
    DEFAULT_QUICK_START_STATE
  );

  useEffect(() => {
    set_quick_start_state(load_state());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(quick_start_state)
    );
  }, [quick_start_state]);

  function update_quick_start_field(field_name, value) {
    set_quick_start_state((current) => ({
      ...current,
      [field_name]: value,
    }));
  }

  function reset_quick_start_state() {
    set_quick_start_state(DEFAULT_QUICK_START_STATE);
  }

  return {
    quick_start_state,
    update_quick_start_field,
    reset_quick_start_state,
  };
}