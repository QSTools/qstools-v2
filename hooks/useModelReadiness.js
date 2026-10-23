"use client";

import { createContext, useContext, useMemo } from "react";
import useModuleReconciliation from "@/hooks/useModuleReconciliation";
import { calculateModelReadiness } from "@/lib/calculations/modelReadinessCalculations";

export const ModelReadinessContext = createContext(null);

// With a ModelReadinessProvider above (Business Outcome route) this returns the shared result.
// Without one it computes its own, exactly as before. Provider presence is fixed for the life
// of a page, so the hook order never changes between renders.
export default function useModelReadiness() {
  const shared = useContext(ModelReadinessContext);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return shared ?? useModelReadinessOwn();
}

export function useModelReadinessOwn() {
  const { status: reconciliation_status, modules } = useModuleReconciliation();

  const status = useMemo(() => {
    return calculateModelReadiness(reconciliation_status);
  }, [reconciliation_status]);

  return {
    status,
    reconciliation: reconciliation_status,
    modules,
  };
}
