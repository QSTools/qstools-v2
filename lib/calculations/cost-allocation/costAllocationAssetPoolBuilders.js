import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";
import {
  get_asset_id,
  get_asset_name,
  get_total_asset_cost,
  get_total_asset_hours,
} from "@/lib/calculations/cost-allocation/costAllocationSharedHelpers";

export function build_productive_asset_pool({
  asset_recovery_rows,
  asset_group_assignments,
}) {
  const asset_rows = safe_array(asset_recovery_rows).filter((asset) => {
    return asset?.asset_type !== "support";
  });

  const asset_map = new Map();

  asset_rows.forEach((asset) => {
    const asset_id = get_asset_id(asset);

    if (!asset_id) {
      return;
    }

    asset_map.set(asset_id, {
      asset_id,
      asset_name: get_asset_name(asset),
      available_asset_cost: get_total_asset_cost(asset),
      available_asset_hours: get_total_asset_hours(asset),
    });
  });

  // S18 6.2 - defensive fix mirroring the labour pool fix: only match
  // assignments whose asset_id actually resolves to a productive asset.
  // asset_id is asset-module-owned identity (unlike labour's category-
  // based staff_type_id), so this join needs no fallback - an asset_id
  // either resolves here or it belongs to build_non_productive_asset_pool.
  const raw_assignments = safe_array(asset_group_assignments)
    .filter((assignment) => assignment?.is_active !== false)
    .filter((assignment) => asset_map.has(assignment.asset_id || ""));

  const enriched_assignments = raw_assignments.map((assignment) => {
    const asset_id = assignment.asset_id || "";
    const asset_row = asset_map.get(asset_id);

    const assignment_percent = safe_number(assignment.assignment_percent);
    const clamped_percent = Math.max(0, assignment_percent);

    const available_asset_cost = safe_number(asset_row?.available_asset_cost);
    const available_asset_hours = safe_number(asset_row?.available_asset_hours);

    const assigned_asset_cost =
      available_asset_cost * (clamped_percent / 100);

    const assigned_asset_hours =
      available_asset_hours * (clamped_percent / 100);

    return {
      ...assignment,
      assignment_id:
        assignment.assignment_id ||
        assignment.asset_assignment_id ||
        `${assignment.group_id}_${asset_id}`,
      asset_id,
      asset_name:
        assignment.asset_name ||
        asset_row?.asset_name ||
        "Productive asset",
      assignment_percent: clamped_percent,
      assigned_asset_cost,
      assigned_asset_hours,
      allocation_status: "assigned",
    };
  });

  const available_asset_cost = asset_rows.reduce(
    (sum, asset) => sum + get_total_asset_cost(asset),
    0
  );

  const available_asset_hours = asset_rows.reduce(
    (sum, asset) => sum + get_total_asset_hours(asset),
    0
  );

  const assigned_asset_cost = enriched_assignments.reduce(
    (sum, assignment) => sum + safe_number(assignment.assigned_asset_cost),
    0
  );

  const assigned_asset_hours = enriched_assignments.reduce(
    (sum, assignment) => sum + safe_number(assignment.assigned_asset_hours),
    0
  );

  const assigned_percent_by_asset = new Map();

  enriched_assignments.forEach((assignment) => {
    const asset_id = assignment.asset_id;

    if (!asset_id) {
      return;
    }

    assigned_percent_by_asset.set(
      asset_id,
      safe_number(assigned_percent_by_asset.get(asset_id)) +
        safe_number(assignment.assignment_percent)
    );
  });

  let over_allocated_asset_cost = 0;
  let over_allocated_asset_hours = 0;
  let max_asset_assignment_percent = 0;

  assigned_percent_by_asset.forEach((assigned_percent, asset_id) => {
    max_asset_assignment_percent = Math.max(
      max_asset_assignment_percent,
      assigned_percent
    );

    if (assigned_percent <= 100) {
      return;
    }

    const asset_row = asset_map.get(asset_id);
    const over_percent = assigned_percent - 100;

    over_allocated_asset_cost +=
      safe_number(asset_row?.available_asset_cost) * (over_percent / 100);

    over_allocated_asset_hours +=
      safe_number(asset_row?.available_asset_hours) * (over_percent / 100);
  });

  const remaining_asset_cost = available_asset_cost - assigned_asset_cost;
  const remaining_asset_hours = available_asset_hours - assigned_asset_hours;

  let allocation_status = "balanced";

  if (over_allocated_asset_cost > 0 || over_allocated_asset_hours > 0) {
    allocation_status = "over_allocated";
  } else if (remaining_asset_cost > 1 || remaining_asset_hours > 1) {
    allocation_status = "under_allocated";
  }

  return {
    productive_asset_pool: {
      pool_id: "productive_asset_pool",
      pool_name: "Productive Asset Pool",
      available_asset_cost,
      available_asset_hours,
      assigned_asset_cost,
      assigned_asset_hours,
      remaining_asset_cost,
      remaining_asset_hours,
      over_allocated_asset_cost,
      over_allocated_asset_hours,
      max_asset_assignment_percent,
      allocation_status,
    },

    asset_group_assignments: enriched_assignments,

    total_available_asset_cost: available_asset_cost,
    total_available_asset_hours: available_asset_hours,
    total_assigned_asset_cost: assigned_asset_cost,
    total_assigned_asset_hours: assigned_asset_hours,
    total_remaining_asset_cost: remaining_asset_cost,
    total_remaining_asset_hours: remaining_asset_hours,
    total_over_allocated_asset_cost: over_allocated_asset_cost,
    total_over_allocated_asset_hours: over_allocated_asset_hours,
    asset_pool_status: allocation_status,
  };
}

export function build_non_productive_asset_pool({
  asset_recovery_rows,
  asset_group_assignments,
}) {
  const asset_rows = safe_array(asset_recovery_rows).filter((asset) => {
    return asset?.asset_type === "support";
  });

  const asset_map = new Map();

  asset_rows.forEach((asset) => {
    const asset_id = get_asset_id(asset);

    if (!asset_id) {
      return;
    }

    asset_map.set(asset_id, {
      asset_id,
      asset_name: get_asset_name(asset),
      available_asset_cost: get_total_asset_cost(asset),
    });
  });

  const raw_assignments = safe_array(asset_group_assignments)
    .filter((assignment) => assignment?.is_active !== false)
    .filter((assignment) => asset_map.has(assignment.asset_id || ""));

  const enriched_assignments = raw_assignments.map((assignment) => {
    const asset_id = assignment.asset_id || "";
    const asset_row = asset_map.get(asset_id);

    const assignment_percent = Math.max(
      0,
      safe_number(assignment.assignment_percent)
    );

    const available_asset_cost = safe_number(asset_row?.available_asset_cost);

    const assigned_asset_cost =
      available_asset_cost * (assignment_percent / 100);

    return {
      ...assignment,
      assignment_id:
        assignment.assignment_id ||
        assignment.asset_assignment_id ||
        `${assignment.group_id}_${asset_id}`,
      asset_id,
      asset_name:
        assignment.asset_name ||
        asset_row?.asset_name ||
        "Non-productive asset",
      assignment_percent,
      assigned_asset_cost,
      allocation_status: "assigned",
    };
  });

  const available_non_productive_asset_cost = asset_rows.reduce(
    (sum, asset) => sum + get_total_asset_cost(asset),
    0
  );

  const assigned_non_productive_asset_cost = enriched_assignments.reduce(
    (sum, assignment) => sum + safe_number(assignment.assigned_asset_cost),
    0
  );

  const assigned_percent_by_asset = new Map();

  enriched_assignments.forEach((assignment) => {
    const asset_id = assignment.asset_id;

    if (!asset_id) {
      return;
    }

    assigned_percent_by_asset.set(
      asset_id,
      safe_number(assigned_percent_by_asset.get(asset_id)) +
        safe_number(assignment.assignment_percent)
    );
  });

  let over_allocated_non_productive_asset_cost = 0;
  let max_non_productive_asset_assignment_percent = 0;

  assigned_percent_by_asset.forEach((assigned_percent, asset_id) => {
    max_non_productive_asset_assignment_percent = Math.max(
      max_non_productive_asset_assignment_percent,
      assigned_percent
    );

    if (assigned_percent <= 100) {
      return;
    }

    const asset_row = asset_map.get(asset_id);
    const over_percent = assigned_percent - 100;

    over_allocated_non_productive_asset_cost +=
      safe_number(asset_row?.available_asset_cost) * (over_percent / 100);
  });

  const remaining_non_productive_asset_cost =
    available_non_productive_asset_cost - assigned_non_productive_asset_cost;

  let allocation_status = "balanced";

  if (over_allocated_non_productive_asset_cost > 0) {
    allocation_status = "over_allocated";
  } else if (remaining_non_productive_asset_cost > 1) {
    allocation_status = "under_allocated";
  }

  return {
    non_productive_asset_pool: {
      pool_id: "non_productive_asset_pool",
      pool_name: "Non-Productive Asset Pool",
      available_asset_cost: available_non_productive_asset_cost,
      assigned_asset_cost: assigned_non_productive_asset_cost,
      remaining_asset_cost: remaining_non_productive_asset_cost,
      over_allocated_asset_cost: over_allocated_non_productive_asset_cost,
      max_assignment_percent: max_non_productive_asset_assignment_percent,
      allocation_status,
    },

    non_productive_asset_group_assignments: enriched_assignments,

    total_available_non_productive_asset_cost:
      available_non_productive_asset_cost,
    total_assigned_non_productive_asset_cost:
      assigned_non_productive_asset_cost,
    total_remaining_non_productive_asset_cost:
      remaining_non_productive_asset_cost,
    total_over_allocated_non_productive_asset_cost:
      over_allocated_non_productive_asset_cost,
    non_productive_asset_pool_status: allocation_status,
  };
}
