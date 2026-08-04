"use client";

import {
  safe_array,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

function safe_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_active_assignment_rows(rows = []) {
  return safe_array(rows).filter((row) => row?.is_active !== false);
}

function find_labour_row(rows = [], assignment = {}) {
  const target_id =
    assignment?.staff_type_id ||
    assignment?.labour_type_id ||
    assignment?.labour_type_key ||
    "";

  return safe_array(rows).find((row) => {
    return (
      row?.staff_type_id === target_id ||
      row?.labour_type_id === target_id ||
      row?.labour_type_key === target_id
    );
  });
}

function get_assignment_ratio(row = {}, assignment = {}) {
  const assigned_staff_count = safe_number(assignment?.assigned_staff_count);

  const row_staff_count = safe_number(
    row?.staff_count ??
      row?.productive_staff_count ??
      row?.support_staff_count ??
      0
  );

  if (assigned_staff_count > 0 && row_staff_count > 0) {
    return Math.min(assigned_staff_count / row_staff_count, 1);
  }

  return Math.min(safe_number(assignment?.assignment_percent) / 100, 1);
}

function is_productive_labour_row(row = {}) {
  return row?.is_productive === true || row?.labour_class === "productive";
}

function get_labour_row_cost(row = {}) {
  return safe_number(row?.total_labour_cost ?? row?.total_annual_cost);
}

function build_labour_pool_from_rows({ all_labour_rows, active_assignments }) {
  const available_labour_cost = safe_array(all_labour_rows).reduce(
    (total, row) => total + get_labour_row_cost(row),
    0
  );

  const available_labour_hours = safe_array(all_labour_rows).reduce(
    (total, row) => total + safe_number(row?.total_productive_hours),
    0
  );

  const assigned_labour_cost = safe_array(active_assignments).reduce(
    (total, assignment) => {
      const row = find_labour_row(all_labour_rows, assignment);
      const ratio = get_assignment_ratio(row, assignment);

      return total + get_labour_row_cost(row) * ratio;
    },
    0
  );

  const assigned_labour_hours = safe_array(active_assignments).reduce(
    (total, assignment) => {
      const row = find_labour_row(all_labour_rows, assignment);
      const ratio = get_assignment_ratio(row, assignment);

      if (!is_productive_labour_row(row)) {
        return total;
      }

      return total + safe_number(row?.total_productive_hours) * ratio;
    },
    0
  );

  return {
    available_labour_cost,
    available_labour_hours,
    assigned_labour_cost,
    assigned_labour_hours,
    remaining_labour_cost: Math.max(
      available_labour_cost - assigned_labour_cost,
      0
    ),
    remaining_labour_hours: Math.max(
      available_labour_hours - assigned_labour_hours,
      0
    ),
    over_allocated_labour_cost: Math.max(
      assigned_labour_cost - available_labour_cost,
      0
    ),
    over_allocated_labour_hours: Math.max(
      assigned_labour_hours - available_labour_hours,
      0
    ),
  };
}

function build_labour_assignment_card({
  productive_labour_type_rows,
  support_labour_type_rows,
  all_labour_type_rows,
  labour_group_assignments,
  calculated,
}) {
  const active_assignments = get_active_assignment_rows(
    labour_group_assignments
  );

  const all_labour_rows =
    safe_array(all_labour_type_rows).length > 0
      ? safe_array(all_labour_type_rows)
      : [
          ...safe_array(productive_labour_type_rows),
          ...safe_array(support_labour_type_rows),
        ];

  const full_labour_pool = build_labour_pool_from_rows({
    all_labour_rows,
    active_assignments,
  });

  return {
    productive_staff_type_rates: safe_array(productive_labour_type_rows),
    productive_labour_rows: all_labour_rows,
    support_labour_rows: safe_array(support_labour_type_rows),
    all_labour_rows,

    labour_group_assignments: active_assignments,
    assignments: active_assignments,

    available_labour_cost: full_labour_pool.available_labour_cost,
    available_labour_hours: full_labour_pool.available_labour_hours,

    assigned_labour_cost: full_labour_pool.assigned_labour_cost,
    assigned_labour_hours: full_labour_pool.assigned_labour_hours,

    remaining_labour_cost: full_labour_pool.remaining_labour_cost,
    remaining_labour_hours: full_labour_pool.remaining_labour_hours,

    over_allocated_labour_cost: full_labour_pool.over_allocated_labour_cost,
    over_allocated_labour_hours: full_labour_pool.over_allocated_labour_hours,

    productive_labour_pool: calculated?.productive_labour_pool ?? null,
    labour_pool_status:
      calculated?.labour_pool?.allocation_status ||
      calculated?.productive_labour_pool?.allocation_status ||
      calculated?.labour_pool_status ||
      "review_required",

    allocation_status:
      calculated?.labour_pool?.allocation_status ||
      calculated?.productive_labour_pool?.allocation_status ||
      calculated?.labour_pool_status ||
      "review_required",
  };
}

function build_asset_assignment_card({
  asset_recovery_rows,
  asset_group_assignments,
  non_productive_asset_group_assignments,
  calculated,
}) {
  const active_assignments = get_active_assignment_rows(asset_group_assignments);

  const productive_asset_rows = safe_array(asset_recovery_rows).filter(
    (asset) => asset?.asset_type !== "support"
  );

  const support_asset_rows = safe_array(asset_recovery_rows).filter(
    (asset) => asset?.asset_type === "support"
  );

  const active_non_productive_assignments = get_active_assignment_rows(
    non_productive_asset_group_assignments
  );

  return {
    productive_asset_rows,
    asset_rows: productive_asset_rows,
    asset_group_assignments: active_assignments,
    assignments: active_assignments,

    support_asset_rows,
    non_productive_asset_rows: support_asset_rows,
    non_productive_asset_group_assignments: active_non_productive_assignments,
    non_productive_asset_pool: calculated?.non_productive_asset_pool ?? null,

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
  const active_assignments = get_active_assignment_rows(
    overhead_group_assignments
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

export function build_cost_allocation_assignment_cards({
  productive_labour_type_rows,
  support_labour_type_rows,
  all_labour_type_rows,
  labour_group_assignments,
  asset_recovery_rows,
  asset_group_assignments,
  non_productive_asset_group_assignments,
  overhead_group_assignments,
  calculated,
}) {
  return {
    labour_assignment: build_labour_assignment_card({
      productive_labour_type_rows,
      support_labour_type_rows,
      all_labour_type_rows,
      labour_group_assignments,
      calculated,
    }),

    asset_assignment: build_asset_assignment_card({
      asset_recovery_rows,
      asset_group_assignments,
      non_productive_asset_group_assignments,
      calculated,
    }),

    overhead_assignment: build_overhead_assignment_card({
      overhead_group_assignments,
      calculated,
    }),
  };
}