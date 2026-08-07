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
      labour,
      assets,
      generalOverheads,
      acceptance_map,
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
    openingHours.status,
    openingHours.calculated,
    acceptance_map,
  ]);

  return {
    status,
    accept_check,
    modules: {
      profitAndLoss,
      generalOverheads,
      labour,
      assets,
      openingHours,
    },
  };
}
