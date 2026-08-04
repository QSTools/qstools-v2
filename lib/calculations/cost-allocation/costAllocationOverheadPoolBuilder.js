import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

export function build_overhead_pool({
  overhead_absorbed_cost,
  overhead_group_assignments,
  operational_group_cost_rows = [],
}) {
  const available_overhead_cost = safe_number(overhead_absorbed_cost);
  const active_group_rows = safe_array(operational_group_cost_rows);

  const total_labour_cost = active_group_rows.reduce(
    (sum, group) => sum + safe_number(group.assigned_labour_cost),
    0
  );

  const total_asset_burden = active_group_rows.reduce(
    (sum, group) => sum + safe_number(group.assigned_asset_burden),
    0
  );

  const active_group_count = active_group_rows.length;

  let allocation_method = "equal_split";

  if (total_labour_cost > 0) {
    allocation_method = "labour_cost_weighted";
  } else if (total_asset_burden > 0) {
    allocation_method = "asset_burden_weighted";
  }

  const enriched_assignments = active_group_rows.map((group) => {
    const group_id = group.group_id || "";
    let assignment_percent = 0;
    let assigned_overhead_amount = 0;

    if (allocation_method === "labour_cost_weighted") {
      const weight =
        total_labour_cost > 0
          ? safe_number(group.assigned_labour_cost) / total_labour_cost
          : 0;

      assignment_percent = weight * 100;
      assigned_overhead_amount = available_overhead_cost * weight;
    }

    if (allocation_method === "asset_burden_weighted") {
      const weight =
        total_asset_burden > 0
          ? safe_number(group.assigned_asset_burden) / total_asset_burden
          : 0;

      assignment_percent = weight * 100;
      assigned_overhead_amount = available_overhead_cost * weight;
    }

    if (allocation_method === "equal_split") {
      const weight = active_group_count > 0 ? 1 / active_group_count : 0;

      assignment_percent = weight * 100;
      assigned_overhead_amount = available_overhead_cost * weight;
    }

    return {
      assignment_id: `${group_id}_automatic_overhead`,
      group_id,
      division_id: group.division_id || "main_operations",
      allocation_method,
      assignment_percent,
      assigned_overhead_amount,
      is_active: true,
      allocation_status: "assigned",
      is_automatic: true,
    };
  });

  const assigned_overhead_cost = enriched_assignments.reduce(
    (sum, assignment) => sum + safe_number(assignment.assigned_overhead_amount),
    0
  );

  const remaining_overhead_cost =
    available_overhead_cost - assigned_overhead_cost;

  const over_allocated_overhead_cost = Math.max(
    0,
    assigned_overhead_cost - available_overhead_cost
  );

  let allocation_status = "balanced";

  if (active_group_count === 0 && available_overhead_cost > 0) {
    allocation_status = "unassigned";
  } else if (over_allocated_overhead_cost > 0) {
    allocation_status = "over_allocated";
  } else if (remaining_overhead_cost > 1) {
    allocation_status = "under_allocated";
  }

  return {
    overhead_pool: {
      pool_id: "overhead_pool",
      pool_name: "Overhead Pool",
      available_overhead_cost,
      assigned_overhead_cost,
      remaining_overhead_cost,
      over_allocated_overhead_cost,
      allocation_method,
      allocation_status,
      is_automatic: true,
    },

    overhead_group_assignments: enriched_assignments,

    total_available_overhead_cost: available_overhead_cost,
    total_assigned_overhead_cost: assigned_overhead_cost,
    total_remaining_overhead_cost: remaining_overhead_cost,
    total_over_allocated_overhead_cost: over_allocated_overhead_cost,
    overhead_pool_status: allocation_status,
    overhead_allocation_method: allocation_method,
  };
}
