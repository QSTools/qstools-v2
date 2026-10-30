"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import useLabour from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useOpeningHours from "@/hooks/useOpeningHours";
import { calculateModuleReconciliation } from "@/lib/reconciliation/moduleReconciliation";
import {
  getStoredModuleReconciliationAcceptances,
  acceptModuleReconciliationCheck,
} from "@/lib/storage/moduleReconciliationAcceptanceStorage";

export default function useModuleReconciliation() {
  const profitAndLoss = useProfitAndLoss();
  const generalOverheads = useGeneralOverheads();
  const labour = useLabour();
  const assets = useAssets();
  const openingHours = useOpeningHours();

  // S20: manual accept storage is browser-only and not reactive by
  // itself, so it's read once on mount and held as state - accept_check
  // below updates this state directly from the storage write's return
  // value, so the UI re-renders immediately without a second read.
  const [acceptance_map, set_acceptance_map] = useState({});

  useEffect(() => {
    set_acceptance_map(getStoredModuleReconciliationAcceptances());
  }, []);

  const accept_check = useCallback(
    ({ check_id, accepted_variance_amount, reason }) => {
      const updated = acceptModuleReconciliationCheck({
        check_id,
        accepted_variance_amount,
        reason,
      });
      set_acceptance_map(updated);
    },
    [],
  );

  const status = useMemo(() => {
    return calculateModuleReconciliation({
      pnl: profitAndLoss,
      // R3 slice 4 batch B: the gate judges REAL data, so it gets the un-removed Labour and Assets (the same objects as before when no removal applies).
      labour: { ...labour, output_contract: labour.unmodelled_output_contract ?? labour.output_contract },
      assets: {
        ...assets,
        status: assets.unmodelled_status ?? assets.status,
        output_contract: assets.unmodelled_output_contract ?? assets.output_contract,
      },
      generalOverheads: {
        status: generalOverheads.unmodelled_status,
        output_contract: generalOverheads.unmodelled_output_contract,
      },
      acceptance_map,
    });
  }, [
    profitAndLoss.status,
    profitAndLoss.output_contract,
    labour.status,
    labour.unmodelled_output_contract,
    labour.outputs,
    assets.unmodelled_status,
    assets.unmodelled_output_contract,
    generalOverheads.unmodelled_status,
    generalOverheads.unmodelled_output_contract,
    openingHours.status,
    openingHours.calculated,
    acceptance_map,
  ]);

  return {
    status,
    accept_check,
    modelled_overhead_effect: generalOverheads.modelled_effect,
    modules: {
      profitAndLoss,
      generalOverheads,
      labour,
      assets,
      openingHours,
    },
  };
}
