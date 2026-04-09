"use client";

import { useCallback, useState } from "react";

export const DEFAULT_MATERIALS_STATE = {
  annual_material_cost: 0,
  annual_material_revenue: 0,

  supplied_material_cost: 0,
  supplied_material_revenue: 0,
  resale_material_cost: 0,
  resale_material_revenue: 0,
  subcontract_pass_through_cost: 0,
  subcontract_pass_through_revenue: 0,

  profile_version: 1,
  effective_from: "",
  is_active: true,
  created_at: "",
  updated_at: "",
};

export function useMaterialsStorage() {
  const [materials_state, set_materials_state] = useState(
    DEFAULT_MATERIALS_STATE
  );

  const update_materials_field = useCallback((field, value) => {
    set_materials_state((current) => ({
      ...(current ?? DEFAULT_MATERIALS_STATE),
      [field]: value,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const reset_materials_state = useCallback(() => {
    set_materials_state(DEFAULT_MATERIALS_STATE);
  }, []);

  return {
    materials_state,
    set_materials_state,
    update_materials_field,
    reset_materials_state,
  };
}