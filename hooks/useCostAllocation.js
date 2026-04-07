"use client";

import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useEmployeeOverheads from "@/hooks/useEmployeeOverheads";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import useCostSummary from "@/hooks/useCostSummary";
import useRecoverySummary from "@/hooks/useRecoverySummary";

import {
  build_cost_allocation_inputs,
  calculate_cost_allocation,
} from "@/lib/calculations/costAllocationRules";
import {
  build_cost_allocation_status,
  build_cost_allocation_card,
} from "@/lib/selectors/costAllocationSelectors";
import { useCostAllocationStorage } from "@/lib/storage/costAllocationStorage";
import { useCostAllocationProfileStorage } from "@/lib/storage/costAllocationProfileStorage";

export default function useCostAllocation() {
  const labour = useLabour();
  const employee_overheads = useEmployeeOverheads();
  const assets = useAssets();
  const general_overheads = useGeneralOverheads();

  const cost_summary = useCostSummary({
    labour,
    employee_overheads,
    assets,
    general_overheads,
  });

  const recovery_summary = useRecoverySummary({
    cost_summary: cost_summary?.output_contract ?? {},
  });

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

  const {
    profiles,
    active_profile,
    save_profile,
    load_profile,
    delete_profile,
  } = useCostAllocationProfileStorage();

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

  const base_card = useMemo(() => {
    return build_cost_allocation_card(calculated);
  }, [calculated]);

  function handle_save_profile() {
    save_profile({
      active_allocation_profile_id:
        state?.active_allocation_profile_id || "live",
      allocation_profile_name: state?.allocation_profile_name,
      effective_from: state?.effective_from,
      active_recovery_model: calculated?.active_recovery_model,
      asset_labour_links: state?.asset_labour_links ?? [],
      operational_groups: state?.operational_groups ?? [],
    });
  }

  function handle_load_profile(active_allocation_profile_id) {
    const loaded = load_profile(active_allocation_profile_id);

    if (!loaded) {
      return;
    }

    set_field(
      "active_allocation_profile_id",
      loaded.active_allocation_profile_id ?? "live"
    );
    set_field(
      "allocation_profile_name",
      loaded.allocation_profile_name ?? "Default Allocation Profile"
    );
    set_field("effective_from", loaded.effective_from ?? "");
    set_field("asset_labour_links", loaded.asset_labour_links ?? []);
    set_field("operational_groups", loaded.operational_groups ?? []);
  }

  function handle_delete_profile(active_allocation_profile_id) {
    delete_profile(active_allocation_profile_id);
  }

  function handle_new_profile() {
    reset_state();
  }

  const card = {
    ...base_card,
    profile: {
      allocation_profile_name: state?.allocation_profile_name ?? "",
      effective_from: state?.effective_from ?? "",
      profiles,
      active_profile_id:
        active_profile?.active_allocation_profile_id ??
        state?.active_allocation_profile_id ??
        "live",
    },
  };

  const actions = {
    set_field,
    add_asset_labour_link,
    remove_asset_labour_link,
    add_operational_group,
    update_operational_group,
    remove_operational_group,
    reset_state,
    save_profile: handle_save_profile,
    load_profile: handle_load_profile,
    delete_profile: handle_delete_profile,
    new_profile: handle_new_profile,
  };

  const output_contract = {
    active_recovery_model: calculated.active_recovery_model,
    active_allocation_profile_id: calculated.active_allocation_profile_id,
    active_asset_labour_links: calculated.active_asset_labour_links,
    active_operational_groups: calculated.active_operational_groups,
    linked_staff_count: calculated.linked_staff_count,
    unlinked_staff_count: calculated.unlinked_staff_count,
    linked_asset_count: calculated.linked_asset_count,
    unlinked_asset_count: calculated.unlinked_asset_count,
    total_operational_groups: calculated.total_operational_groups,
    valid_operational_groups: calculated.valid_operational_groups,
    invalid_operational_groups: calculated.invalid_operational_groups,
    duplicate_link_warnings: calculated.duplicate_link_warnings,
    orphan_warnings: calculated.orphan_warnings,
    group_validation_warnings: calculated.group_validation_warnings,
    structure_valid: calculated.structure_valid,
    staff_coverage_percent: calculated.staff_coverage_percent,
    asset_coverage_percent: calculated.asset_coverage_percent,
    group_coverage_percent: calculated.group_coverage_percent,
  };

  return {
    status,
    card,
    actions,
    output_contract,
  };
}