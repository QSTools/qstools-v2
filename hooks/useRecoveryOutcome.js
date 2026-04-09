"use client";

import { useMemo } from "react";
import { calculateRecoveryOutcome } from "@/lib/calculations/recoveryOutcomeCalculations";
import {
  buildRecoveryOutcomeStatus,
  buildRecoveryOutcomeCard,
} from "@/lib/selectors/recoveryOutcomeSelectors";

export default function useRecoveryOutcome(inputs = {}) {
  return useMemo(() => {
    const outputs = calculateRecoveryOutcome({
      recovery_summary: inputs.recovery_summary ?? {},
      cost_allocation: inputs.cost_allocation ?? {},
      materials: inputs.materials ?? {},
      rate_models: inputs.rate_models ?? {},
    });

    return {
      status: buildRecoveryOutcomeStatus(outputs),
      card: buildRecoveryOutcomeCard(outputs),
      output_contract: outputs,
    };
  }, [
    inputs.recovery_summary,
    inputs.cost_allocation,
    inputs.materials,
    inputs.rate_models,
  ]);
}