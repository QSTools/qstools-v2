"use client";

import { useMemo } from "react";

import useBusinessOutcomeTruth from "@/hooks/useBusinessOutcomeTruth";
import useBusinessOutcomeLabourRecovery from "@/hooks/useBusinessOutcomeLabourRecovery";
import { compose_business_outcome_output_contract } from "@/lib/selectors/business-outcome/businessOutcomeOutputContractSelectors";

// Single composed entry point for downstream consumers (AI Export,
// Dashboard, Business Modelling). Reads the two existing Business Outcome
// hooks and composes them into one documented output_contract - it does
// not calculate anything itself.

export default function useBusinessOutcomeOutputContract() {
  const truth = useBusinessOutcomeTruth();
  const labour_recovery = useBusinessOutcomeLabourRecovery();

  const output_contract = useMemo(() => {
    return compose_business_outcome_output_contract(
      truth.output_contract,
      labour_recovery
    );
  }, [truth.output_contract, labour_recovery]);

  return { output_contract };
}
