"use client";

import { useMemo } from "react";
import {
  DEFAULT_SQUARE_METRE_RATE_STATE,
  useSquareMetreRateStorage,
} from "@/lib/storage/squareMetreRateStorage";
import { calculateSquareMetreRate } from "@/lib/calculations/squareMetreRateCalculations";
import {
  buildSquareMetreRateStatus,
  buildSquareMetreRateCard,
  buildSquareMetreRateSummary,
} from "@/lib/selectors/squareMetreRateSelectors";

export default function useSquareMetreRate() {
  const {
    square_metre_rate_state,
    set_square_metre_rate_state,
    update_square_metre_rate_field,
    reset_square_metre_rate_state,
  } = useSquareMetreRateStorage();

  const safe_state =
    square_metre_rate_state ?? DEFAULT_SQUARE_METRE_RATE_STATE;

  const calculated = useMemo(() => {
    return calculateSquareMetreRate(safe_state);
  }, [safe_state]);

  const status = useMemo(() => {
    return buildSquareMetreRateStatus({
      square_metre_rate_state: safe_state,
      calculated,
    });
  }, [safe_state, calculated]);

  const card = useMemo(() => {
    return buildSquareMetreRateCard({
      square_metre_rate_state: safe_state,
      calculated,
      update_square_metre_rate_field,
      reset_square_metre_rate_state,
      set_square_metre_rate_state,
    });
  }, [
    safe_state,
    calculated,
    update_square_metre_rate_field,
    reset_square_metre_rate_state,
    set_square_metre_rate_state,
  ]);

  const summary = useMemo(() => {
    return buildSquareMetreRateSummary({ calculated });
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