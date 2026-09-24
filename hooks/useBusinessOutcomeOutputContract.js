"use client";

import { useMemo } from "react";

import useBusinessOutcomeTruth from "@/hooks/useBusinessOutcomeTruth";
import useBusinessOutcomeLabourRecovery from "@/hooks/useBusinessOutcomeLabourRecovery";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import { compose_business_outcome_output_contract } from "@/lib/selectors/business-outcome/businessOutcomeOutputContractSelectors";

// Single composed entry point for downstream consumers (AI Export,
// Dashboard, Business Modelling). Reads the two existing Business Outcome
// hooks and composes them into one documented output_contract - it does
// not calculate anything itself.

// F7 (8b, 2026-09-23): labour_recovery's overhead-per-hour now comes from
// this page's own per-group cost-share split (per_source.labour_groups),
// not Rate Builder's all-on-labour basis - so per_source must be computed
// here too, same pattern as app/business-outcome/page.jsx.
export default function useBusinessOutcomeOutputContract() {
  const truth = useBusinessOutcomeTruth();
  const per_source_calculation = useBusinessOutcomePerSourceRevenue();
  const per_source = selectBusinessOutcomePerSourceRevenue(per_source_calculation);
  const labour_recovery = useBusinessOutcomeLabourRecovery(per_source?.labour_groups ?? []);

  const output_contract = useMemo(() => {
    return compose_business_outcome_output_contract(
      truth.output_contract,
      labour_recovery
    );
  }, [truth.output_contract, labour_recovery]);

  return { output_contract };
}
