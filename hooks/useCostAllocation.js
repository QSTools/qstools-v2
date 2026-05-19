"use client";

import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
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

export default function useCostAllocation(inputs = {}) {
    const labour = useLabour();
    const assets = useAssets();

    const fallback_recovery_summary = useRecoverySummary();
    const recovery_summary =
        inputs.recovery_summary ??
        fallback_recovery_summary?.output_contract ??
        {};

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
                "",
            active_profile_name:
                active_profile?.allocation_profile_name ??
                state?.allocation_profile_name ??
                "",
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
        allocation_status: calculated.allocation_status,
        allocation_dependency_type: calculated.allocation_dependency_type,
        allocation_warnings: calculated.allocation_warnings,
        active_recovery_model: calculated.active_recovery_model,
        recovery_plan_target_per_driver:
            calculated.recovery_plan_target_per_driver,
        recovery_plan_split: calculated.recovery_plan_split,
        component_required_recovery: calculated.component_required_recovery,
        labour_share_percent: calculated.labour_share_percent,
        asset_share_percent: calculated.asset_share_percent,
        material_share_percent: calculated.material_share_percent,
        overhead_absorbed_percent: calculated.overhead_absorbed_percent,
        labour_recovery_cost: calculated.labour_recovery_cost,
        asset_recovery_cost: calculated.asset_recovery_cost,
        material_recovery_cost: calculated.material_recovery_cost,
        overhead_absorbed_cost: calculated.overhead_absorbed_cost,
        recovery_hours_used: calculated.recovery_hours_used,
        required_recovery_rate: calculated.required_recovery_rate,
        actual_recovery_rate: calculated.actual_recovery_rate,
        profit_or_deficit_per_recovery_hour:
            calculated.profit_or_deficit_per_recovery_hour,
        material_recovery_included: calculated.material_recovery_included,
        asset_recovery_included: calculated.asset_recovery_included,
        material_margin_status: calculated.material_margin_status,
        asset_utilisation_status: calculated.asset_utilisation_status,
        has_productive_asset_recovery_base:
            calculated.has_productive_asset_recovery_base,
        productive_asset_count: calculated.productive_asset_count,
        support_asset_count: calculated.support_asset_count,
        productive_asset_cost: calculated.productive_asset_cost,
        support_asset_cost: calculated.support_asset_cost,
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
        external_delivery_enabled: calculated.external_delivery_enabled,
        external_delivery_required: calculated.external_delivery_required,
        internal_capacity_shortfall: calculated.internal_capacity_shortfall,
    };

    return {
        status,
        card,
        actions,
        output_contract,
    };
}
