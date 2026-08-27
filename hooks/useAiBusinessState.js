"use client";

import { useMemo } from "react";

import useBusinessSummary from "@/hooks/useBusinessSummary";
import useBusinessModelling from "@/hooks/useBusinessModelling";
import useModelReadiness from "@/hooks/useModelReadiness";
import { buildAiBusinessStateExport } from "@/lib/selectors/aiBusinessStateSelectors";
import useBusinessOutcomeOutputContract from "@/hooks/useBusinessOutcomeOutputContract";

export default function useAiBusinessState() {
  const business_summary = useBusinessSummary();
  const business_modelling = useBusinessModelling();
  const model_readiness = useModelReadiness();
  const business_outcome = useBusinessOutcomeOutputContract();

  const export_object = useMemo(() => {
    return buildAiBusinessStateExport({
      model_readiness: model_readiness.status ?? {},
      business_modelling: business_modelling.output_contract ?? {},
      business_summary: business_summary.output_contract ?? {},
      business_outcome: business_outcome.output_contract ?? {},
    });
  }, [
    model_readiness.status,
    business_modelling.output_contract,
    business_summary.output_contract,
    business_outcome.output_contract,
  ]);

  return {
    export_object,
    trust_state: export_object.trust_state,
    downstream_permissions: export_object.downstream_permissions,
    blockers: export_object.blockers,
    warnings: export_object.warnings,
  };
}
