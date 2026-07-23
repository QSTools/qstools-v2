"use client";

import { useMemo } from "react";

import { calculateBusinessOutcome } from "@/lib/calculations/businessOutcomeCalculations";
import {
  buildBusinessOutcomeStatus,
  buildBusinessOutcomeCard,
} from "@/lib/selectors/businessOutcomeSelectors";

export default function useBusinessOutcome(inputs = {}) {
  return useMemo(() => {
    const outputs = calculateBusinessOutcome({
      recovery_summary: inputs.recovery_summary ?? {},
      cost_allocation: inputs.cost_allocation ?? {},
    });

    return {
      status: buildBusinessOutcomeStatus(outputs),
      card: buildBusinessOutcomeCard(outputs),
      output_contract: outputs,
    };
  }, [inputs.recovery_summary, inputs.cost_allocation]);
}
