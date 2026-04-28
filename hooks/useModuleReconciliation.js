"use client";

import { useMemo } from "react";
import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import useLabour from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import { calculateModuleReconciliation } from "@/lib/reconciliation/moduleReconciliation";

export default function useModuleReconciliation() {
  const profitAndLoss = useProfitAndLoss();
  const generalOverheads = useGeneralOverheads();
  const labour = useLabour();
  const assets = useAssets();

  const status = useMemo(() => {
    return calculateModuleReconciliation({
      pnl: profitAndLoss,
      labour,
      assets,
      generalOverheads,
    });
  }, [
    profitAndLoss.status,
    profitAndLoss.output_contract,
    labour.status,
    labour.output_contract,
    labour.outputs,
    assets.status,
    assets.output_contract,
    generalOverheads.status,
    generalOverheads.output_contract,
  ]);

  return {
    status,
    modules: {
      profitAndLoss,
      generalOverheads,
      labour,
      assets,
    },
  };
}
