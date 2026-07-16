"use client";

import { useMemo, useState } from "react";
import useAiBusinessState from "@/hooks/useAiBusinessState";
import { calculateQuoteCheckerResult } from "@/lib/calculations/quoteCheckerCalculations";

const DEFAULT_QUOTE = {
  quote_name: "Draft quote",
  labour_hours: 40,
  labour_charge_total: 4000,
  material_cost: 2500,
  material_charge_total: 3250,
  other_direct_cost: 0,
  other_direct_charge_total: 0,
};

export default function useQuoteChecker() {
  const ai_business_state = useAiBusinessState();
  const [quote, setQuote] = useState(DEFAULT_QUOTE);

  const updateQuoteField = (field, value) => {
    setQuote((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const result = useMemo(() => {
    const export_object = ai_business_state.export_object ?? {};

    return calculateQuoteCheckerResult({
      quote,
      selected_model: export_object.selected_model ?? {},
      business_summary: export_object.business_summary ?? {},
      downstream_permissions: ai_business_state.downstream_permissions ?? {},
      trust_state: ai_business_state.trust_state,
      export_blockers: ai_business_state.blockers ?? [],
      export_warnings: ai_business_state.warnings ?? [],
    });
  }, [
    quote,
    ai_business_state.export_object,
    ai_business_state.downstream_permissions,
    ai_business_state.trust_state,
    ai_business_state.blockers,
    ai_business_state.warnings,
  ]);

  return {
    quote,
    updateQuoteField,
    result,
    export_object: ai_business_state.export_object,
    trust_state: ai_business_state.trust_state,
    downstream_permissions: ai_business_state.downstream_permissions,
    blockers: result.blockers,
    warnings: result.warnings,
    export_blockers: ai_business_state.blockers,
    export_warnings: ai_business_state.warnings,
  };
}
