"use client";

import { useEffect, useMemo, useState } from "react";

import useProfitAndLoss from "@/hooks/useProfitAndLoss";

import {
  readRateBuilderMaterialsMarkup,
  saveRateBuilderMaterialsMarkupPercent,
} from "@/lib/storage/rateBuilderMaterialsMarkupStorage";

import { calculate_materials_markup_result } from "@/lib/calculations/rateBuilderMaterialsMarkupCalculations";

export function useRateBuilderMaterialsMarkup() {
  const { output_contract: pnl_output_contract } = useProfitAndLoss();

  const [materials_markup_percent, set_materials_markup_percent] = useState(0);
  const [is_loaded, set_is_loaded] = useState(false);

  useEffect(() => {
    const saved_state = readRateBuilderMaterialsMarkup();
    set_materials_markup_percent(saved_state.materials_markup_percent);
    set_is_loaded(true);
  }, []);

  useEffect(() => {
    if (!is_loaded) {
      return;
    }
    saveRateBuilderMaterialsMarkupPercent(materials_markup_percent);
  }, [materials_markup_percent, is_loaded]);

  const total_cogs = pnl_output_contract?.total_cogs ?? 0;

  const result = useMemo(() => {
    return calculate_materials_markup_result({
      total_cogs,
      materials_markup_percent,
    });
  }, [total_cogs, materials_markup_percent]);

  function handle_update_markup_percent(value) {
    set_materials_markup_percent(Number(value) || 0);
  }

  return {
    ...result,

    actions: {
      update_markup_percent: handle_update_markup_percent,
    },
  };
}

export default useRateBuilderMaterialsMarkup;

