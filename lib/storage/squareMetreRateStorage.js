"use client";

import { useCallback, useState } from "react";

export const DEFAULT_SQUARE_METRE_RATE_STATE = {
  base_square_metre_rate: 0,
  minimum_charge: 0,
  expected_annual_square_metres: 0,

  small_job_threshold_m2: 0,
  average_job_size_m2: 0,
  small_job_uplift_percent: 0,
  large_job_discount_percent: 0,

  included_labour_basis_label: "",
  included_material_basis_label: "",

  profile_version: 1,
  effective_from: "",
  is_active: true,
  created_at: "",
  updated_at: "",
};

export function useSquareMetreRateStorage() {
  const [square_metre_rate_state, set_square_metre_rate_state] = useState(
    DEFAULT_SQUARE_METRE_RATE_STATE
  );

  const update_square_metre_rate_field = useCallback((field, value) => {
    set_square_metre_rate_state((current) => ({
      ...(current ?? DEFAULT_SQUARE_METRE_RATE_STATE),
      [field]: value,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const reset_square_metre_rate_state = useCallback(() => {
    set_square_metre_rate_state(DEFAULT_SQUARE_METRE_RATE_STATE);
  }, []);

  return {
    square_metre_rate_state,
    set_square_metre_rate_state,
    update_square_metre_rate_field,
    reset_square_metre_rate_state,
  };
}