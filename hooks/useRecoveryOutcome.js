"use client";

import { useMemo } from "react";

import useRecoverySummary from "@/hooks/useRecoverySummary";
import useCostAllocation from "@/hooks/useCostAllocation";

import { calculateRecoveryOutcome } from "@/lib/calculations/recoveryOutcomeCalculations";
import {
  buildRecoveryOutcomeStatus,
  buildRecoveryOutcomeCard,
} from "@/lib/selectors/recoveryOutcomeSelectors";

export default function useRecoveryOutcome() {
  const recovery_summary = useRecoverySummary();
  const cost_allocation = useCostAllocation();

  return useMemo(() => {
    const recovery = recovery_summary?.output_contract ?? recovery_summary ?? {};
    const allocation = cost_allocation?.output_contract ?? cost_allocation ?? {};

    const output_contract = calculateRecoveryOutcome({
      recovery_summary: recovery,
      cost_allocation: allocation,
    });

    return {
      status: buildRecoveryOutcomeStatus(output_contract),
      card: buildRecoveryOutcomeCard(output_contract),
      output_contract,
    };
  }, [recovery_summary, cost_allocation]);
}