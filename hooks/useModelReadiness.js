"use client";

import { useMemo } from "react";
import useModuleReconciliation from "@/hooks/useModuleReconciliation";
import { calculateModelReadiness } from "@/lib/calculations/modelReadinessCalculations";

export default function useModelReadiness() {
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
