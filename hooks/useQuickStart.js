"use client";

import { useMemo } from "react";
import { useQuickStartStorage } from "@/lib/storage/quickStartStorage";
import { calculateQuickStart } from "@/lib/calculations/quickStartCalculations";
import { buildQuickStartCard } from "@/lib/selectors/quickStartSelectors";

export default function useQuickStart() {
  const {
    quick_start_state,
    update_quick_start_field,
    reset_quick_start_state,
  } = useQuickStartStorage();

  const output_contract = useMemo(() => {
    return calculateQuickStart(quick_start_state);
  }, [quick_start_state]);

  const card = useMemo(() => {
    return buildQuickStartCard({
      quick_start_state,
      output_contract,
      update_quick_start_field,
      reset_quick_start_state,
    });
  }, [
    quick_start_state,
    output_contract,
    update_quick_start_field,
    reset_quick_start_state,
  ]);

  return {
    card,
    output_contract,
  };
}