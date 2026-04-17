"use client";

import { useMemo } from "react";
import {
  DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE,
  useLabourRateRealityCheckStorage,
} from "@/lib/storage/labourRateRealityCheckStorage";
import { calculateLabourRateRealityCheck } from "@/lib/calculations/labourRateRealityCheckCalculations";
import {
  buildLabourRateRealityCheckCard,
  buildLabourRateRealityCheckStatus,
} from "@/lib/selectors/labourRateRealityCheckSelectors";

export default function useLabourRateRealityCheck() {
  const {
    reality_check_state,
    update_reality_check_field,
    reset_reality_check_state,
  } = useLabourRateRealityCheckStorage();

  const outputs = useMemo(() => {
    return calculateLabourRateRealityCheck(reality_check_state);
  }, [reality_check_state]);

  const status = useMemo(() => {
    return buildLabourRateRealityCheckStatus({
      state: reality_check_state,
      outputs,
    });
  }, [reality_check_state, outputs]);

  const card = useMemo(() => {
    return buildLabourRateRealityCheckCard({
      state: reality_check_state,
      outputs,
      update_reality_check_field,
      reset_reality_check_state,
    });
  }, [reality_check_state, outputs, update_reality_check_field, reset_reality_check_state]);

  return {
    state: reality_check_state,
    outputs,
    status,
    card,
    reset_reality_check_state,
    default_state: DEFAULT_LABOUR_RATE_REALITY_CHECK_STATE,
  };
}