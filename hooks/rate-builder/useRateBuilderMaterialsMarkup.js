"use client";

import { useEffect, useMemo, useState } from "react";

import useProfitAndLoss from "@/hooks/useProfitAndLoss";

import {
  readRateBuilderMaterialsMarkup,
  saveRateBuilderMaterialsMarkupPercent,
} from "@/lib/storage/rateBuilderMaterialsMarkupStorage";

import { calculate_materials_markup_result } from "@/lib/calculations/rateBuilderMaterialsMarkupCalculations";

import { subscribe_to_diffs } from "@/lib/storage/modelDiffs";

import {
  LEVER_INPUT_MESSAGES,
  is_model_mode,
  save_markup_move,
} from "@/lib/actions/rate-builder/rateBuilderLeverActions";

export function useRateBuilderMaterialsMarkup() {
  const { output_contract: pnl_output_contract } = useProfitAndLoss();

  const [materials_markup_percent, set_materials_markup_percent] = useState(0);
  const [is_loaded, set_is_loaded] = useState(false);
  // Lever batch L2: Model mode is read after mount. In Model mode the typed markup is a working change, never the saved markup.
  const [model_active, set_model_active] = useState(false);
  const [markup_move_status, set_markup_move_status] = useState("");

  useEffect(() => {
    const saved_state = readRateBuilderMaterialsMarkup();
    set_materials_markup_percent(saved_state.materials_markup_percent);
    set_model_active(is_model_mode());
    set_is_loaded(true);
  }, []);

  useEffect(() => {
    // Lever batch L2: follow a working change saved or cleared elsewhere (the box is committed on leaving it, so a typed draft is short-lived).
    return subscribe_to_diffs(() => {
      set_materials_markup_percent(
        readRateBuilderMaterialsMarkup().materials_markup_percent
      );
    });
  }, []);

  useEffect(() => {
    if (!is_loaded || model_active) {
      return;
    }
    saveRateBuilderMaterialsMarkupPercent(materials_markup_percent);
  }, [materials_markup_percent, is_loaded, model_active]);

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

  // Lever batch L2: in Model mode the typed markup is stored as a working change when the box is left (or Enter), not on every key.
  function handle_commit_markup_percent() {
    if (!model_active) {
      return;
    }
    const move = save_markup_move(materials_markup_percent);
    set_markup_move_status(
      move.ok ? LEVER_INPUT_MESSAGES.saved_markup : move.message
    );
  }

  return {
    ...result,

    model_active,
    markup_note: model_active ? LEVER_INPUT_MESSAGES.markup_note : "",
    markup_move_status,

    actions: {
      update_markup_percent: handle_update_markup_percent,
      commit_markup_percent: handle_commit_markup_percent,
    },
  };
}

export default useRateBuilderMaterialsMarkup;
