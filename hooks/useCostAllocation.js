"use client";

import { useMemo } from "react";

import useRecoverySummary from "@/hooks/useRecoverySummary";
import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";

import {
  build_cost_allocation_inputs,
  calculate_cost_allocation,
} from "@/lib/calculations/costAllocationRules";
import {
  build_cost_allocation_status,
  build_cost_allocation_card,
} from "@/lib/selectors/costAllocationSelectors";
import {
  useCostAllocationStorage,
} from "@/lib/storage/costAllocationStorage";

export default function useCostAllocation() {
  const recovery_summary = useRecoverySummary();
  const labour = useLabour();
  const assets = useAssets();

  const {
    state,
    set_field,
    add_asset_labour_link,
    remove_asset_labour_link,
    add_operational_group,
    update_operational_group,
    remove_operational_group,
    reset_state,
  } = useCostAllocationStorage();

  const calculation_inputs = useMemo(() => {
    return build_cost_allocation_inputs({
      recovery_summary,
      labour,
      assets,
      allocation_state: state,
    });
  }, [recovery_summary, labour, assets, state]);

  const calculated = useMemo(() => {
    return calculate_cost_allocation(calculation_inputs);
  }, [calculation_inputs]);

  const status = useMemo(() => {
    return build_cost_allocation_status(calculated);
  }, [calculated]);

  const card = useMemo(() => {
    return build_cost_allocation_card(calculated);
  }, [calculated]);

  const actions = {
    set_field,
    add_asset_labour_link,
    remove_asset_labour_link,
    add_operational_group,
    update_operational_group,
    remove_operational_group,
    reset_state,
  };

  return {
    status,
    card,
    actions,
  };
}