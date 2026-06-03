"use client";

import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useRecoverySummary from "@/hooks/useRecoverySummary";

import { useCostAllocationAssetOverlay } from "@/hooks/cost-allocation/useCostAllocationAssetOverlay";
import { build_cost_allocation_assignment_cards } from "@/hooks/cost-allocation/useCostAllocationAssignmentCards";
import { build_cost_allocation_output_contract } from "@/hooks/cost-allocation/useCostAllocationOutputContract";

import {
  build_cost_allocation_inputs,
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

import {
  build_productive_labour_type_rows,
  find_labour_type_for_staff,
  get_staff_label,
  get_staff_labour_type_key,
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

function get_group_asset_ids(group = {}) {
  const possible_lists = [
    group.required_asset_ids,
    group.asset_ids,
    group.assigned_asset_ids,
    group.linked_asset_ids,
    group.assets,
  ];

  for (const list of possible_lists) {
    if (Array.isArray(list)) {
      return list
        .map((item) =>
          typeof item === "string" ? item : item?.asset_id || item?.id || ""
        )
        .filter(Boolean);
    }
  }

  if (group.asset_id) {
    return [group.asset_id];
  }

  return [];
}

function get_group_staff_ids(group = {}) {
  const possible_lists = [
    group.required_staff_ids,
    group.staff_ids,
    group.assigned_staff_ids,
    group.linked_staff_ids,
    group.staff,
  ];

  for (const list of possible_lists) {
    if (Array.isArray(list)) {
      return list
        .map((item) =>
          typeof item === "string" ? item : item?.staff_id || item?.id || ""
        )
        .filter(Boolean);
    }
  }

  if (group.staff_id) {
    return [group.staff_id];
  }

  return [];
}

function get_overhead_burden_rate_for_group({
  working_unit_recovery_rate = 0,
  running_cost_rate_per_hour = 0,
}) {
  const required_rate = safe_number(working_unit_recovery_rate);
  const running_rate = safe_number(running_cost_rate_per_hour);

  return Math.max(required_rate - running_rate, 0);
}

function build_operational_group_recovery_rows({
  operational_groups = [],
  active_assets = [],
  active_staff = [],
  productive_labour_type_rows = [],
  working_unit_recovery_cost = 0,
  overhead_absorbed_cost = 0,
  recovery_hours_used = 0,
}) {
  const asset_map = new Map(
    safe_array(active_assets).map((asset) => [asset.asset_id, asset])
  );

  const staff_map = new Map(
    safe_array(active_staff).map((staff) => [staff.staff_id, staff])
  );

  const labour_driver_map = new Map(
    safe_array(productive_labour_type_rows).map((row) => [
      row.labour_type_id || row.labour_type_key || row.staff_type_id,
      row,
    ])
  );

  return safe_array(operational_groups).map((group, index) => {
    const group_asset_ids = get_group_asset_ids(group);
    const group_staff_ids = get_group_staff_ids(group);

    const group_assets = group_asset_ids
      .map((asset_id) => asset_map.get(asset_id))
      .filter(Boolean);

    const group_staff = group_staff_ids
      .map((staff_id) => {
        const labour_driver = labour_driver_map.get(staff_id);

        if (labour_driver) {
          return {
            staff_id:
              labour_driver.labour_type_id ||
              labour_driver.labour_type_key ||
              labour_driver.staff_type_id,
            staff_name:
              labour_driver.labour_type_label ||
              labour_driver.staff_type_name,
            labour_type_key: labour_driver.labour_type_key,
            labour_type_label: labour_driver.labour_type_label,
            staff_type: labour_driver.staff_type,
            staff_role: labour_driver.staff_role,
            labour_class: labour_driver.labour_class,
            productive_hours: labour_driver.total_productive_hours,
            total_labour_cost_annual: labour_driver.total_labour_cost,
            weighted_recovery_rate:
              labour_driver.weighted_recovery_rate ||
              labour_driver.weighted_productive_hourly_rate,
            source_staff_ids: labour_driver.source_staff_ids,
            is_labour_driver: true,
          };
        }

        return staff_map.get(staff_id);
      })
      .filter(Boolean);

    const staff_recovery_rows = group_staff.map((staff) => {
      const labour_type = staff.is_labour_driver
        ? staff
        : find_labour_type_for_staff(staff, productive_labour_type_rows);

      const labour_recovery_rate_per_hour = safe_number(
        labour_type?.weighted_recovery_rate ??
          labour_type?.weighted_productive_hourly_rate ??
          staff.weighted_recovery_rate ??
          staff.productive_labour_cost_rate ??
          staff.labour_cost_rate ??
          0
      );

      return {
        staff_id: staff.staff_id,
        staff_name: get_staff_label(staff),
        labour_type_key:
          labour_type?.labour_type_key || get_staff_labour_type_key(staff),
        labour_type_label:
          labour_type?.labour_type_label ||
          staff.staff_type ||
          staff.staff_role ||
          staff.labour_class ||
          "Unclassified productive labour",
        labour_recovery_rate_per_hour,
      };
    });

    const asset_recovery_rows = group_assets.map((asset) => ({
      asset_id: asset.asset_id,
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      asset_recovery_rate_per_hour: safe_number(
        asset.asset_recovery_rate_per_hour
      ),
      asset_recovery_cost_annual: safe_number(asset.asset_recovery_cost_annual),
    }));

    const labour_recovery_rate_per_hour = staff_recovery_rows.reduce(
      (sum, staff) => sum + safe_number(staff.labour_recovery_rate_per_hour),
      0
    );

    const asset_recovery_rate_per_hour = asset_recovery_rows.reduce(
      (sum, asset) => sum + safe_number(asset.asset_recovery_rate_per_hour),
      0
    );

    const running_cost_rate_per_hour =
      labour_recovery_rate_per_hour + asset_recovery_rate_per_hour;

    const working_unit_recovery_rate =
      safe_number(recovery_hours_used) > 0
        ? (safe_number(working_unit_recovery_cost) +
            safe_number(overhead_absorbed_cost)) /
          safe_number(recovery_hours_used)
        : 0;

    const overhead_burden_rate_per_hour = get_overhead_burden_rate_for_group({
      working_unit_recovery_rate,
      running_cost_rate_per_hour,
    });

    const minimum_recoverable_rate_per_hour =
      running_cost_rate_per_hour + overhead_burden_rate_per_hour;

    return {
      group_id:
        group.group_id || group.operational_group_id || `group-${index}`,
      group_name:
        group.group_name || group.name || `Operating Group ${index + 1}`,

      required_staff_count: safe_number(group.required_staff_count),
      selected_staff_count: group_staff.length,
      selected_asset_count: group_assets.length,

      staff_recovery_rows,
      asset_recovery_rows,

      staff_names: group_staff.map(get_staff_label),
      asset_names: group_assets.map((asset) => asset.asset_name),

      labour_recovery_rate_per_hour,
      asset_recovery_rate_per_hour,

      running_cost_rate_per_hour,
      working_unit_recovery_rate_per_hour: working_unit_recovery_rate,
      overhead_burden_rate_per_hour,
      minimum_recoverable_rate_per_hour,

      operational_group_recovery_rate_per_hour:
        minimum_recoverable_rate_per_hour,

      has_labour_rate: labour_recovery_rate_per_hour > 0,
      has_asset_rate: asset_recovery_rate_per_hour > 0,
      has_running_cost: running_cost_rate_per_hour > 0,
      has_overhead_burden: overhead_burden_rate_per_hour > 0,
      is_rate_ready: minimum_recoverable_rate_per_hour > 0,
    };
  });
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

  const asset_recovery_overlay = useCostAllocationAssetOverlay({
    asset_output_contract: assets?.output_contract ?? {},
    recovery_hours_used: base_calculation_inputs?.recovery_hours_used,
  });

  const operational_group_recovery_rows = useMemo(() => {
    return build_operational_group_recovery_rows({
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
  }, [
    state?.operational_groups,
    asset_recovery_overlay.active_assets,
    base_calculation_inputs?.active_staff,
    productive_labour_type_rows,
    base_calculation_inputs?.labour_recovery_cost,
    base_calculation_inputs?.asset_recovery_cost,
    base_calculation_inputs?.overhead_absorbed_cost,
    base_calculation_inputs?.recovery_hours_used,
  ]);

  const calculation_inputs = useMemo(() => {
    return {
      ...base_calculation_inputs,

      active_assets: asset_recovery_overlay.active_assets,
      asset_recovery_rows: asset_recovery_overlay.asset_recovery_rows,

      productive_labour_type_rows,
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

  function add_labour_assignment({
    group_id,
    staff_type_id,
    assignment_percent,
  }) {
    const percent = Math.round(safe_number(assignment_percent));

    if (!group_id || !staff_type_id || percent <= 0) {
      return;
    }

    const clamped_percent = Math.min(percent, 100);

    const timestamp = new Date().toISOString();

    const next_assignment = {
      assignment_id: generate_local_id("labour_assignment"),
      group_id,
      staff_type_id,
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
          assignment.assignment_id || assignment.labour_assignment_id;

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

  const {
    labour_assignment,
    asset_assignment,
    overhead_assignment,
  } = build_cost_allocation_assignment_cards({
    productive_labour_type_rows,
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
    },
  };

  const actions = {
    set_field,
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

  const output_contract = build_cost_allocation_output_contract({
    calculated,
    state,
  });

  return {
    status,
    card,
    actions,
    output_contract,
  };
}