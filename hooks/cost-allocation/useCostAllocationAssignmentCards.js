"use client";

import { safe_array } from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

function get_active_assignment_rows(rows = []) {
  return safe_array(rows).filter((row) => row?.is_active !== false);
}

function build_labour_assignment_card({
  productive_labour_type_rows,
  labour_group_assignments,
  calculated,
}) {
  const active_assignments = get_active_assignment_rows(
    labour_group_assignments
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
  const active_assignments = get_active_assignment_rows(asset_group_assignments);

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
  labour_group_assignments,
  asset_recovery_rows,
  asset_group_assignments,
  overhead_group_assignments,
  calculated,
}) {
  return {
    labour_assignment: build_labour_assignment_card({
      productive_labour_type_rows,
      labour_group_assignments,
      calculated,
    }),

    asset_assignment: build_asset_assignment_card({
      asset_recovery_rows,
      asset_group_assignments,
      calculated,
    }),

    overhead_assignment: build_overhead_assignment_card({
      overhead_group_assignments,
      calculated,
    }),
  };
}