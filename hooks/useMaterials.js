"use client";

import { useMemo } from "react";
import {
  DEFAULT_MATERIALS_STATE,
  useMaterialsStorage,
} from "@/lib/storage/materialsStorage";
import { calculateMaterials } from "@/lib/calculations/materialsCalculations";
import {
  buildMaterialsStatus,
  buildMaterialsCard,
  buildMaterialsSummary,
} from "@/lib/selectors/materialsSelectors";

export default function useMaterials() {
  const {
    materials_state,
    set_materials_state,
    update_materials_field,
    reset_materials_state,
  } = useMaterialsStorage();

  const safe_state = materials_state ?? DEFAULT_MATERIALS_STATE;

  const calculated = useMemo(() => {
    return calculateMaterials(safe_state);
  }, [safe_state]);

  const status = useMemo(() => {
    return buildMaterialsStatus({ materials_state: safe_state, calculated });
  }, [safe_state, calculated]);

  const card = useMemo(() => {
    return buildMaterialsCard({
      materials_state: safe_state,
      calculated,
      update_materials_field,
      reset_materials_state,
      set_materials_state,
    });
  }, [
    safe_state,
    calculated,
    update_materials_field,
    reset_materials_state,
    set_materials_state,
  ]);

  const summary = useMemo(() => {
    return buildMaterialsSummary({ calculated });
  }, [calculated]);

  return {
    state: safe_state,
    calculated,
    status,
    card,
    summary,
    output_contract: calculated,
  };
}