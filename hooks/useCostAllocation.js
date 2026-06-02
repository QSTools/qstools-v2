"use client";

import { useMemo } from "react";

import { useLabour } from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useRecoverySummary from "@/hooks/useRecoverySummary";

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

function normalise_asset_type(value) {
  return value === "support" ? "support" : "productive";
}

function get_asset_name(asset = {}) {
  return asset.asset_name || asset.name || "Unnamed Asset";
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

function build_asset_recovery_overlay({
  asset_output_contract = {},
  recovery_hours_used = 0,
}) {
  const active_assets = safe_array(asset_output_contract.active_assets);
  const default_recovery_hours = safe_number(recovery_hours_used);

  const recovery_assets = active_assets.map((asset) => {
    const base_asset_cost_annual = safe_number(asset.total_asset_cost_annual);
    const allocated_asset_overhead_cost_annual = safe_number(
      asset.allocated_asset_overhead_cost_annual
    );

    const asset_recovery_cost_annual =
      asset.asset_recovery_cost_annual !== undefined
        ? safe_number(asset.asset_recovery_cost_annual)
        : base_asset_cost_annual + allocated_asset_overhead_cost_annual;

    const asset_recovery_rate_per_hour =
      default_recovery_hours > 0
        ? asset_recovery_cost_annual / default_recovery_hours
        : 0;

    return {
      ...asset,
      asset_type: normalise_asset_type(asset.asset_type),
      asset_name: get_asset_name(asset),
      base_asset_cost_annual,
      allocated_asset_overhead_cost_annual,
      asset_recovery_cost_annual,
      asset_recovery_hours_used: default_recovery_hours,
      asset_recovery_rate_per_hour,
      cost_allocation_asset_cost_annual: asset_recovery_cost_annual,
    };
  });

  const asset_recovery_rows = recovery_assets.map((asset) => ({
    asset_id: asset.asset_id ?? "",
    asset_name: asset.asset_name ?? "Unnamed Asset",
    asset_type: asset.asset_type,
    base_asset_cost_annual: safe_number(asset.base_asset_cost_annual),
    allocated_asset_overhead_cost_annual: safe_number(
      asset.allocated_asset_overhead_cost_annual
    ),
    asset_recovery_cost_annual: safe_number(asset.asset_recovery_cost_annual),
    asset_recovery_hours_used: safe_number(asset.asset_recovery_hours_used),
    asset_recovery_rate_per_hour: safe_number(
      asset.asset_recovery_rate_per_hour
    ),
  }));

  const productive_assets = recovery_assets.filter(
    (asset) => asset.asset_type === "productive"
  );

  const support_assets = recovery_assets.filter(
    (asset) => asset.asset_type === "support"
  );

  const productive_asset_base_cost = productive_assets.reduce(
    (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
    0
  );

  const support_asset_base_cost = support_assets.reduce(
    (sum, asset) => sum + safe_number(asset.base_asset_cost_annual),
    0
  );

  const productive_asset_allocated_overhead_cost = productive_assets.reduce(
    (sum, asset) =>
      sum + safe_number(asset.allocated_asset_overhead_cost_annual),
    0
  );

  const support_asset_allocated_overhead_cost = support_assets.reduce(
    (sum, asset) =>
      sum + safe_number(asset.allocated_asset_overhead_cost_annual),
    0
  );

  const productive_asset_recovery_cost = productive_assets.reduce(
    (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
    0
  );

  const support_asset_recovery_cost = support_assets.reduce(
    (sum, asset) => sum + safe_number(asset.asset_recovery_cost_annual),
    0
  );

  return {
    active_assets: recovery_assets,
    asset_recovery_rows,

    productive_asset_base_cost,
    support_asset_base_cost,

    productive_asset_allocated_overhead_cost,
    support_asset_allocated_overhead_cost,

    productive_asset_recovery_cost,
    support_asset_recovery_cost,

    productive_asset_cost: productive_asset_recovery_cost,
    support_asset_cost: support_asset_recovery_cost,

    total_allocated_asset_overhead_cost:
      productive_asset_allocated_overhead_cost +
      support_asset_allocated_overhead_cost,

    total_asset_recovery_cost:
      productive_asset_recovery_cost + support_asset_recovery_cost,
  };
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

function build_labour_assignment_card({
  productive_labour_type_rows,
  labour_group_assignments,
  calculated,
}) {
  const active_assignments = safe_array(labour_group_assignments).filter(
    (assignment) => assignment?.is_active !== false
  );

  return {
    productive_staff_type_rates: productive_labour_type_rows,
    productive_labour_rows: productive_labour_type_rows,
    labour_group_assignments: active_assignments,
    assignments: active_assignments,

    available_labour_cost:
      calculated?.productive_labour_pool?.available_labour_cost ??
      calculated?.available_labour_cost ??
      calculated?.total_productive_labour_cost ??
      0,

    available_labour_hours:
      calculated?.productive_labour_pool?.available_labour_hours ??
      calculated?.available_labour_hours ??
      calculated?.total_productive_labour_hours ??
      0,

    assigned_labour_cost:
      calculated?.productive_labour_pool?.assigned_labour_cost ??
      calculated?.assigned_labour_cost ??
      0,

    assigned_labour_hours:
      calculated?.productive_labour_pool?.assigned_labour_hours ??
      calculated?.assigned_labour_hours ??
      0,

    remaining_labour_cost:
      calculated?.productive_labour_pool?.remaining_labour_cost ??
      calculated?.remaining_labour_cost ??
      calculated?.unassigned_labour_cost ??
      0,

    remaining_labour_hours:
      calculated?.productive_labour_pool?.remaining_labour_hours ??
      calculated?.remaining_labour_hours ??
      0,

    over_allocated_labour_cost:
      calculated?.productive_labour_pool?.over_allocated_labour_cost ??
      calculated?.over_allocated_labour_cost ??
      0,

    over_allocated_labour_hours:
      calculated?.productive_labour_pool?.over_allocated_labour_hours ??
      calculated?.over_allocated_labour_hours ??
      0,

    allocation_status:
      calculated?.productive_labour_pool?.allocation_status ||
      calculated?.labour_pool_status ||
      "review_required",
  };
}

function build_asset_assignment_card({
  asset_recovery_rows,
  asset_group_assignments,
  calculated,
}) {
  const active_assignments = safe_array(asset_group_assignments).filter(
    (assignment) => assignment?.is_active !== false
  );

  const productive_asset_rows = safe_array(asset_recovery_rows).filter(
    (asset) => asset?.asset_type !== "support"
  );

  return {
    productive_asset_rows,
    asset_rows: productive_asset_rows,
    asset_group_assignments: active_assignments,
    assignments: active_assignments,

    productive_asset_pool: calculated?.productive_asset_pool ?? null,

    available_asset_cost:
      calculated?.productive_asset_pool?.available_asset_cost ??
      calculated?.total_available_asset_cost ??
      calculated?.productive_asset_cost ??
      0,

    assigned_asset_cost:
      calculated?.productive_asset_pool?.assigned_asset_cost ??
      calculated?.total_assigned_asset_cost ??
      0,

    remaining_asset_cost:
      calculated?.productive_asset_pool?.remaining_asset_cost ??
      calculated?.total_remaining_asset_cost ??
      calculated?.unassigned_asset_cost ??
      0,

    over_allocated_asset_cost:
      calculated?.productive_asset_pool?.over_allocated_asset_cost ??
      calculated?.total_over_allocated_asset_cost ??
      0,

    available_asset_hours:
      calculated?.productive_asset_pool?.available_asset_hours ??
      calculated?.total_available_asset_hours ??
      0,

    assigned_asset_hours:
      calculated?.productive_asset_pool?.assigned_asset_hours ??
      calculated?.total_assigned_asset_hours ??
      0,

    remaining_asset_hours:
      calculated?.productive_asset_pool?.remaining_asset_hours ??
      calculated?.total_remaining_asset_hours ??
      0,

    over_allocated_asset_hours:
      calculated?.productive_asset_pool?.over_allocated_asset_hours ??
      calculated?.total_over_allocated_asset_hours ??
      0,

    allocation_status:
      calculated?.productive_asset_pool?.allocation_status ||
      calculated?.asset_pool_status ||
      "review_required",
  };
}

function build_overhead_assignment_card({
  overhead_group_assignments,
  calculated,
}) {
  const active_assignments = safe_array(overhead_group_assignments).filter(
    (assignment) => assignment?.is_active !== false
  );

  return {
    overhead_group_assignments: active_assignments,
    assignments: active_assignments,

    overhead_pool: calculated?.overhead_pool ?? null,

    available_overhead_cost:
      calculated?.overhead_pool?.available_overhead_cost ??
      calculated?.total_available_overhead_cost ??
      calculated?.overhead_absorbed_cost ??
      0,

    assigned_overhead_cost:
      calculated?.overhead_pool?.assigned_overhead_cost ??
      calculated?.total_assigned_overhead_cost ??
      0,

    remaining_overhead_cost:
      calculated?.overhead_pool?.remaining_overhead_cost ??
      calculated?.total_remaining_overhead_cost ??
      calculated?.unassigned_overhead_cost ??
      0,

    over_allocated_overhead_cost:
      calculated?.overhead_pool?.over_allocated_overhead_cost ??
      calculated?.total_over_allocated_overhead_cost ??
      0,

    allocation_status:
      calculated?.overhead_pool?.allocation_status ||
      calculated?.overhead_pool_status ||
      "review_required",
  };
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

  const asset_recovery_overlay = useMemo(() => {
    return build_asset_recovery_overlay({
      asset_output_contract: assets?.output_contract ?? {},
      recovery_hours_used: base_calculation_inputs?.recovery_hours_used,
    });
  }, [assets?.output_contract, base_calculation_inputs?.recovery_hours_used]);

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

  function add_asset_assignment({
  group_id,
  asset_id,
  assignment_percent,
}) {
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

  const labour_assignment = build_labour_assignment_card({
    productive_labour_type_rows,
    labour_group_assignments: state?.labour_group_assignments,
    calculated,
  });

  const asset_assignment = build_asset_assignment_card({
    asset_recovery_rows: calculated?.asset_recovery_rows,
    asset_group_assignments: state?.asset_group_assignments,
    calculated,
  });

  const overhead_assignment = build_overhead_assignment_card({
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

  const output_contract = {
    allocation_status: calculated.allocation_status,
    allocation_dependency_type: calculated.allocation_dependency_type,
    setup_warnings: calculated.setup_warnings,
    structural_warnings: calculated.structural_warnings,
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

    labour_group_assignments: safe_array(state?.labour_group_assignments),
    asset_group_assignments: safe_array(state?.asset_group_assignments),
    overhead_group_assignments: safe_array(state?.overhead_group_assignments),

    productive_labour_pool: calculated.productive_labour_pool,
    productive_asset_pool: calculated.productive_asset_pool,
    overhead_pool: calculated.overhead_pool,

    cost_allocation_ready:
      calculated.allocation_status === "ready" ||
      calculated.allocation_status === "ready_with_dependency",
    cost_allocation_warnings: calculated.allocation_warnings,

    operational_groups: calculated.active_operational_groups,
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