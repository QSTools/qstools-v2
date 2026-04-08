"use client";

import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useEmployeeOverheads from "@/hooks/useEmployeeOverheads";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import useCostSummary from "@/hooks/useCostSummary";
import useRecoverySummary from "@/hooks/useRecoverySummary";
import useCostAllocation from "@/hooks/useCostAllocation";

import { calculateRecoveryOutcome } from "@/lib/calculations/recoveryOutcomeCalculations";
import {
  buildRecoveryOutcomeStatus,
  buildRecoveryOutcomeCard,
} from "@/lib/selectors/recoveryOutcomeSelectors";

export default function useRecoveryOutcome() {
  const labour = useLabour();
  const employee_overheads = useEmployeeOverheads();
  const assets = useAssets();
  const general_overheads = useGeneralOverheads();

  const cost_summary = useCostSummary({
    labour,
    employee_overheads,
    assets,
    general_overheads,
  });

  const recovery_summary = useRecoverySummary({
    cost_summary: cost_summary?.output_contract ?? {},
  });

  const cost_allocation = useCostAllocation();

  const output_contract = useMemo(() => {
    return calculateRecoveryOutcome({
      recovery_summary: recovery_summary?.output_contract ?? {},
      cost_allocation: cost_allocation?.output_contract ?? {},
    });
  }, [recovery_summary, cost_allocation]);

  const status = useMemo(() => {
    return buildRecoveryOutcomeStatus(output_contract);
  }, [output_contract]);

  const card = useMemo(() => {
    return buildRecoveryOutcomeCard(output_contract);
  }, [output_contract]);

  return {
    status,
    card,
    output_contract,
  };
}