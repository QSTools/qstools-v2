"use client";

import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useRecoverySummary from "@/hooks/useRecoverySummary";

import { useCostAllocationAssetOverlay } from "@/hooks/cost-allocation/useCostAllocationAssetOverlay";
import { build_cost_allocation_assignment_cards } from "@/hooks/cost-allocation/useCostAllocationAssignmentCards";
import { useCostAllocationGroupRecoveryRows } from "@/hooks/cost-allocation/useCostAllocationGroupRecoveryRows";
import { build_cost_allocation_output_contract } from "@/hooks/cost-allocation/useCostAllocationOutputContract";

import {
  build_cost_allocation_inputs,
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

import {
  build_all_labour_type_rows,
  build_productive_labour_type_rows,
  build_support_labour_type_rows,
} from "@/lib/calculations/cost-allocation/costAllocationLabourAdapter";

import { calculate_cost_allocation } from "@/lib/calculations/costAllocationRules";

import {
  build_cost_allocation_card,
  build_cost_allocation_status,
} from "@/lib/selectors/costAllocationSelectors";

import { useCostAllocationStorage } from "@/lib/storage/costAllocationStorage";

function generate_local_id(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

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
    add_division,
    update_division,
    remove_division,
    add_asset_labour_link,
    remove_asset_labour_link,
    update_operational_group,
    remove_operational_group,
    reset_state,
  } = useCostAllocationStorage();

  const base_calculation_inputs = useMemo(() => {
    return build_cost_allocation_inputs({
      recovery_summary,
      labour,
      assets,
      allocation_state: state,
    });
  }, [recovery_summary, labour, assets, state]);

  const productive_labour_type_rows = useMemo(() => {
    return build_productive_labour_type_rows(labour?.output_contract ?? {});
  }, [labour?.output_contract]);

  const support_labour_type_rows = useMemo(() => {
    return build_support_labour_type_rows(labour?.output_contract ?? {});
  }, [labour?.output_contract]);

  const all_labour_type_rows = useMemo(() => {
    return build_all_labour_type_rows(labour?.output_contract ?? {});
  }, [labour?.output_contract]);

  const asset_recovery_overlay = useCostAllocationAssetOverlay({
    asset_output_contract: assets?.output_contract ?? {},
    recovery_hours_used: base_calculation_inputs?.recovery_hours_used,
  });

  const operational_group_recovery_rows = useCostAllocationGroupRecoveryRows({
    operational_groups: state?.operational_groups ?? [],
    active_assets: asset_recovery_overlay.active_assets,
    active_staff: base_calculation_inputs?.active_staff ?? [],
    productive_labour_type_rows,
    working_unit_recovery_cost:
      safe_number(base_calculation_inputs?.labour_recovery_cost) +
      safe_number(base_calculation_inputs?.asset_recovery_cost),
    overhead_absorbed_cost: base_calculation_inputs?.overhead_absorbed_cost,
    recovery_hours_used: base_calculation_inputs?.recovery_hours_used,
  });

  const calculation_inputs = useMemo(() => {
    return {
      ...base_calculation_inputs,

      divisions: safe_array(state?.divisions),

      active_assets: asset_recovery_overlay.active_assets,
      asset_recovery_rows: asset_recovery_overlay.asset_recovery_rows,

      productive_labour_type_rows,
      support_labour_type_rows,
      all_labour_type_rows,

      labour_group_assignments: safe_array(state?.labour_group_assignments),
      asset_group_assignments: safe_array(state?.asset_group_assignments),
      overhead_group_assignments: safe_array(state?.overhead_group_assignments),
      operational_group_recovery_rows,

      productive_asset_base_cost:
        asset_recovery_overlay.productive_asset_base_cost,
      support_asset_base_cost: asset_recovery_overlay.support_asset_base_cost,

      productive_asset_allocated_overhead_cost:
        asset_recovery_overlay.productive_asset_allocated_overhead_cost,
      support_asset_allocated_overhead_cost:
        asset_recovery_overlay.support_asset_allocated_overhead_cost,

      productive_asset_recovery_cost:
        asset_recovery_overlay.productive_asset_recovery_cost,
      support_asset_recovery_cost:
        asset_recovery_overlay.support_asset_recovery_cost,

      productive_asset_cost: asset_recovery_overlay.productive_asset_cost,
      support_asset_cost: asset_recovery_overlay.support_asset_cost,

      total_allocated_asset_overhead_cost:
        asset_recovery_overlay.total_allocated_asset_overhead_cost,
      total_asset_recovery_cost: asset_recovery_overlay.total_asset_recovery_cost,
    };
  }, [
    base_calculation_inputs,
    asset_recovery_overlay,
    productive_labour_type_rows,
    support_labour_type_rows,
    all_labour_type_rows,
    state?.divisions,
    state?.labour_group_assignments,
    state?.asset_group_assignments,
    state?.overhead_group_assignments,
    operational_group_recovery_rows,
  ]);

  const calculated = useMemo(() => {
    return calculate_cost_allocation(calculation_inputs);
  }, [calculation_inputs]);

  const status = useMemo(() => {
    return build_cost_allocation_status(calculated);
  }, [calculated]);

  const base_card = useMemo(() => {
    return build_cost_allocation_card(calculated);
  }, [calculated]);

  function handle_add_operational_group(group_input = {}) {
    const timestamp = new Date().toISOString();

    const group =
      typeof group_input === "string"
        ? {
            group_name: group_input,
          }
        : group_input || {};

    const next_group = {
      group_id: group.group_id || generate_local_id("group"),
      division_id: group.division_id || "main_operations",
      group_name: String(group.group_name || "").trim(),
      group_description: String(group.group_description || "").trim(),
      required_asset_ids: safe_array(group.required_asset_ids),
      required_staff_ids: safe_array(group.required_staff_ids),
      required_staff_count: safe_number(group.required_staff_count),
      is_active: group.is_active !== false,
      created_at: group.created_at || timestamp,
      updated_at: timestamp,
    };

    if (!next_group.group_name) {
      return;
    }

    set_field("operational_groups", [
      ...safe_array(state?.operational_groups),
      next_group,
    ]);
  }

  function find_labour_type(staff_type_id) {
    return safe_array(all_labour_type_rows).find((row) => {
      return (
        row?.staff_type_id === staff_type_id ||
        row?.labour_type_id === staff_type_id ||
        row?.labour_type_key === staff_type_id
      );
    });
  }

  function add_labour_assignment({
    group_id,
    staff_type_id,
    assigned_staff_count,
    assignment_percent,
  }) {
    const percent = Math.round(safe_number(assignment_percent));
    const staff_count = Math.max(
      0,
      Math.round(safe_number(assigned_staff_count))
    );

    if (!group_id || !staff_type_id || percent <= 0) {
      return;
    }

    const labour_type = find_labour_type(staff_type_id);
    const clamped_percent = Math.min(percent, 100);
    const timestamp = new Date().toISOString();
    const assignment_id = generate_local_id("labour_assignment");

    const next_assignment = {
      assignment_id,
      labour_group_assignment_id: assignment_id,
      group_id,
      staff_type_id,
      labour_type_id: labour_type?.labour_type_id ?? staff_type_id,
      labour_type_key: labour_type?.labour_type_key ?? staff_type_id,
      labour_type_label:
        labour_type?.labour_type_label ||
        labour_type?.staff_type_name ||
        staff_type_id,
      labour_class: labour_type?.labour_class ?? "productive",
      is_productive: labour_type?.is_productive === true,
      contributes_to_recovery_hours:
        labour_type?.contributes_to_recovery_hours === true,
      assigned_staff_count: staff_count,
      assignment_percent: clamped_percent,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    set_field("labour_group_assignments", [
      ...safe_array(state?.labour_group_assignments),
      next_assignment,
    ]);
  }

  function remove_labour_assignment(assignment_id) {
    if (!assignment_id) {
      return;
    }

    const next_assignments = safe_array(state?.labour_group_assignments).map(
      (assignment) => {
        const current_assignment_id =
          assignment.assignment_id ||
          assignment.labour_assignment_id ||
          assignment.labour_group_assignment_id;

        if (current_assignment_id !== assignment_id) {
          return assignment;
        }

        return {
          ...assignment,
          is_active: false,
          updated_at: new Date().toISOString(),
        };
      }
    );

    set_field("labour_group_assignments", next_assignments);
  }

  function add_asset_assignment({ group_id, asset_id, assignment_percent }) {
    const percent = Math.round(safe_number(assignment_percent));

    if (!group_id || !asset_id || percent <= 0) {
      return;
    }

    const clamped_percent = Math.min(percent, 100);
    const timestamp = new Date().toISOString();

    const next_assignment = {
      assignment_id: generate_local_id("asset_assignment"),
      group_id,
      asset_id,
      assignment_percent: clamped_percent,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    set_field("asset_group_assignments", [
      ...safe_array(state?.asset_group_assignments),
      next_assignment,
    ]);
  }

  function remove_asset_assignment(assignment_id) {
    if (!assignment_id) {
      return;
    }

    const next_assignments = safe_array(state?.asset_group_assignments).map(
      (assignment) => {
        const current_assignment_id =
          assignment.assignment_id || assignment.asset_assignment_id;

        if (current_assignment_id !== assignment_id) {
          return assignment;
        }

        return {
          ...assignment,
          is_active: false,
          updated_at: new Date().toISOString(),
        };
      }
    );

    set_field("asset_group_assignments", next_assignments);
  }

  function add_overhead_assignment({
    group_id,
    allocation_method,
    assigned_amount,
    assignment_percent,
  }) {
    if (!group_id || !allocation_method) {
      return;
    }

    const is_manual_amount = allocation_method === "manual_amount";
    const is_manual_percent = allocation_method === "manual_percent";

    if (is_manual_amount && safe_number(assigned_amount) <= 0) {
      return;
    }

    if (is_manual_percent && safe_number(assignment_percent) <= 0) {
      return;
    }

    const timestamp = new Date().toISOString();

    const next_assignment = {
      assignment_id: generate_local_id("overhead_assignment"),
      group_id,
      allocation_method,
      assigned_amount: safe_number(assigned_amount),
      assignment_percent: safe_number(assignment_percent),
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    };

    set_field("overhead_group_assignments", [
      ...safe_array(state?.overhead_group_assignments),
      next_assignment,
    ]);
  }

  function remove_overhead_assignment(assignment_id) {
    if (!assignment_id) {
      return;
    }

    const next_assignments = safe_array(state?.overhead_group_assignments).map(
      (assignment) => {
        const current_assignment_id =
          assignment.assignment_id || assignment.overhead_assignment_id;

        if (current_assignment_id !== assignment_id) {
          return assignment;
        }

        return {
          ...assignment,
          is_active: false,
          updated_at: new Date().toISOString(),
        };
      }
    );

    set_field("overhead_group_assignments", next_assignments);
  }

  const { labour_assignment, asset_assignment, overhead_assignment } =
    build_cost_allocation_assignment_cards({
      productive_labour_type_rows,
      support_labour_type_rows,
      all_labour_type_rows,
      labour_group_assignments: state?.labour_group_assignments,
      asset_recovery_rows: calculated?.asset_recovery_rows,
      asset_group_assignments: state?.asset_group_assignments,
      overhead_group_assignments: state?.overhead_group_assignments,
      calculated,
    });

  const card = {
    ...base_card,

    labour_assignment,
    asset_assignment,
    overhead_assignment,

    recovery_plan: {
      ...(base_card?.recovery_plan ?? {}),

      active_divisions: calculated.active_divisions,
      division_cost_rows: calculated.division_cost_rows,
      total_divisions: calculated.total_divisions,
      valid_divisions: calculated.valid_divisions,
      invalid_divisions: calculated.invalid_divisions,
      division_coverage_percent: calculated.division_coverage_percent,

      productive_asset_base_cost: calculated.productive_asset_base_cost,
      support_asset_base_cost: calculated.support_asset_base_cost,
      productive_asset_allocated_overhead_cost:
        calculated.productive_asset_allocated_overhead_cost,
      support_asset_allocated_overhead_cost:
        calculated.support_asset_allocated_overhead_cost,
      productive_asset_recovery_cost: calculated.productive_asset_recovery_cost,
      support_asset_recovery_cost: calculated.support_asset_recovery_cost,
      total_allocated_asset_overhead_cost:
        calculated.total_allocated_asset_overhead_cost,
      total_asset_recovery_cost: calculated.total_asset_recovery_cost,
      asset_recovery_rows: calculated.asset_recovery_rows,

      productive_labour_type_rows: calculated.productive_labour_type_rows,
      support_labour_type_rows: calculated.support_labour_type_rows,
      all_labour_type_rows: calculated.all_labour_type_rows,

      operational_group_recovery_rows:
        calculated.operational_group_recovery_rows,
      operational_group_cost_rows: calculated.operational_group_cost_rows,
      total_grouped_labour_cost: calculated.total_grouped_labour_cost,
      total_grouped_asset_cost: calculated.total_grouped_asset_cost,
      total_grouped_overhead_cost: calculated.total_grouped_overhead_cost,
      total_grouped_operating_cost: calculated.total_grouped_operating_cost,
      unassigned_labour_cost: calculated.unassigned_labour_cost,
      unassigned_asset_cost: calculated.unassigned_asset_cost,
      unassigned_overhead_cost: calculated.unassigned_overhead_cost,
      total_unassigned_cost: calculated.total_unassigned_cost,
      productive_asset_utilisation_hours_annual:
        calculated.productive_asset_utilisation_hours_annual,
      group_recovery_basis_label: calculated.group_recovery_basis_label,
      group_required_recovery_rate: calculated.group_required_recovery_rate,

      rate_builder_labour_recovery_rows:
        base_card?.recovery_plan?.rate_builder_labour_recovery_rows ?? [],
    },
  };

  const actions = {
    set_field,
    add_division,
    update_division,
    remove_division,
    add_asset_labour_link,
    remove_asset_labour_link,
    add_operational_group: handle_add_operational_group,
    update_operational_group,
    remove_operational_group,
    add_labour_assignment,
    remove_labour_assignment,
    add_asset_assignment,
    remove_asset_assignment,
    add_overhead_assignment,
    remove_overhead_assignment,
    reset_state,
  };

  const output_contract = {
    ...build_cost_allocation_output_contract({
      calculated,
      state,
    }),
    rate_builder_labour_recovery_rows:
      card?.recovery_plan?.rate_builder_labour_recovery_rows ?? [],
    operational_group_cost_rows: calculated?.operational_group_cost_rows ?? [],
    total_available_overhead_cost: calculated?.total_available_overhead_cost ?? 0,
    total_grouped_overhead_cost: calculated?.total_grouped_overhead_cost ?? 0,
    overhead_allocation_method: calculated?.overhead_allocation_method ?? "",
  };

  return {
    status,
    card,
    actions,
    output_contract,
  };
}
