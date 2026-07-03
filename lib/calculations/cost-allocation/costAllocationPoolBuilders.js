import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

function get_staff_type_id(row = {}) {
  return (
    row.staff_type_id ||
    row.labour_type_id ||
    row.labour_type_key ||
    row.staff_id ||
    row.id ||
    ""
  );
}

function get_staff_type_name(row = {}) {
  return (
    row.staff_type_name ||
    row.labour_type_label ||
    row.staff_name ||
    row.name ||
    "Productive labour group"
  );
}

function get_weighted_hourly_rate(row = {}) {
  return safe_number(
    row.weighted_productive_hourly_rate ??
      row.weighted_hourly_cost_rate ??
      row.weighted_recovery_rate ??
      row.productive_labour_cost_rate ??
      0
  );
}

function get_total_productive_hours(row = {}) {
  return safe_number(
    row.total_productive_hours ??
      row.productive_hours ??
      row.available_labour_hours ??
      0
  );
}

function get_total_annual_cost(row = {}) {
  const explicit_cost = safe_number(
    row.total_annual_cost ??
      row.total_labour_cost ??
      row.total_productive_labour_cost ??
      row.available_labour_cost ??
      0
  );

  if (explicit_cost > 0) {
    return explicit_cost;
  }

  return get_total_productive_hours(row) * get_weighted_hourly_rate(row);
}

function get_asset_id(row = {}) {
  return row.asset_id || row.id || "";
}

function get_asset_name(row = {}) {
  return row.asset_name || row.name || "Productive asset";
}

function get_total_asset_cost(row = {}) {
  return safe_number(
    row.asset_recovery_cost_annual ??
      row.total_asset_cost_annual ??
      row.cost_allocation_asset_cost_annual ??
      row.available_asset_cost ??
      0
  );
}

function get_total_asset_hours(row = {}) {
  return safe_number(
    row.asset_recovery_hours_used ??
      row.utilisation_hours_annual ??
      row.utilisation_hours ??
      row.available_asset_hours ??
      0
  );
}

export function build_productive_labour_pool({
  productive_labour_type_rows,
  labour_group_assignments,
}) {
  const labour_rows = safe_array(productive_labour_type_rows);
  const raw_assignments = safe_array(labour_group_assignments).filter(
    (assignment) => assignment?.is_active !== false
  );

  const labour_rate_map = new Map();

  labour_rows.forEach((row) => {
    const staff_type_id = get_staff_type_id(row);

    if (!staff_type_id) {
      return;
    }

    labour_rate_map.set(staff_type_id, {
      staff_type_id,
      staff_type_name: get_staff_type_name(row),
      weighted_hourly_cost_rate: get_weighted_hourly_rate(row),
      available_hours: get_total_productive_hours(row),
      available_cost: get_total_annual_cost(row),
    });
  });

  const enriched_assignments = raw_assignments.map((assignment) => {
    const staff_type_id =
      assignment.staff_type_id ||
      assignment.labour_type_id ||
      assignment.labour_type_key ||
      "";

    const labour_row = labour_rate_map.get(staff_type_id);

    const assignment_percent = Math.max(
      0,
      Math.round(safe_number(assignment.assignment_percent))
    );

    const available_hours = safe_number(labour_row?.available_hours);
    const available_cost = safe_number(labour_row?.available_cost);

    const assigned_hours =
      assignment.assigned_hours !== undefined
        ? safe_number(assignment.assigned_hours)
        : available_hours * (assignment_percent / 100);

    const weighted_hourly_cost_rate = safe_number(
      assignment.weighted_hourly_cost_rate ??
        labour_row?.weighted_hourly_cost_rate ??
        0
    );

    const assigned_cost =
      assignment.assigned_cost !== undefined
        ? safe_number(assignment.assigned_cost)
        : available_cost > 0
          ? available_cost * (assignment_percent / 100)
          : assigned_hours * weighted_hourly_cost_rate;

    return {
      ...assignment,
      assignment_id:
        assignment.assignment_id ||
        assignment.labour_assignment_id ||
        `${assignment.group_id}_${staff_type_id}`,
      staff_type_id,
      staff_type_name:
        assignment.staff_type_name ||
        labour_row?.staff_type_name ||
        "Productive labour group",
      assignment_percent,
      assigned_hours,
      assigned_cost,
      weighted_hourly_cost_rate,
      allocation_status: "assigned",
    };
  });

  const available_labour_hours = labour_rows.reduce(
    (sum, row) => sum + get_total_productive_hours(row),
    0
  );

  const available_labour_cost = labour_rows.reduce(
    (sum, row) => sum + get_total_annual_cost(row),
    0
  );

  const assigned_labour_hours = enriched_assignments.reduce(
    (sum, assignment) => sum + safe_number(assignment.assigned_hours),
    0
  );

  const assigned_labour_cost = enriched_assignments.reduce(
    (sum, assignment) => sum + safe_number(assignment.assigned_cost),
    0
  );

  const assigned_percent_by_labour_group = new Map();

  enriched_assignments.forEach((assignment) => {
    const staff_type_id = assignment.staff_type_id;

    if (!staff_type_id) {
      return;
    }

    assigned_percent_by_labour_group.set(
      staff_type_id,
      safe_number(assigned_percent_by_labour_group.get(staff_type_id)) +
        safe_number(assignment.assignment_percent)
    );
  });

  let over_allocated_labour_hours = 0;
  let over_allocated_labour_cost = 0;
  let max_labour_assignment_percent = 0;

  assigned_percent_by_labour_group.forEach(
    (assigned_percent, staff_type_id) => {
      max_labour_assignment_percent = Math.max(
        max_labour_assignment_percent,
        assigned_percent
      );

      if (assigned_percent <= 100) {
        return;
      }

      const labour_row = labour_rate_map.get(staff_type_id);
      const over_percent = assigned_percent - 100;

      over_allocated_labour_hours +=
        safe_number(labour_row?.available_hours) * (over_percent / 100);

      over_allocated_labour_cost +=
        safe_number(labour_row?.available_cost) * (over_percent / 100);
    }
  );

  const remaining_labour_hours =
    available_labour_hours - assigned_labour_hours;

  const remaining_labour_cost = available_labour_cost - assigned_labour_cost;

  let allocation_status = "balanced";

  if (over_allocated_labour_hours > 0 || over_allocated_labour_cost > 0) {
    allocation_status = "over_allocated";
  } else if (remaining_labour_hours > 1 || remaining_labour_cost > 1) {
    allocation_status = "under_allocated";
  }

  return {
    productive_labour_pool: {
      pool_id: "productive_labour_pool",
      pool_name: "Productive Labour Pool",
      available_labour_cost,
      available_labour_hours,
      assigned_labour_cost,
      assigned_labour_hours,
      remaining_labour_cost,
      remaining_labour_hours,
      over_allocated_labour_cost,
      over_allocated_labour_hours,
      max_labour_assignment_percent,
      allocation_status,
    },

    labour_group_assignments: enriched_assignments,

    total_available_labour_cost: available_labour_cost,
    total_available_labour_hours: available_labour_hours,
    total_assigned_labour_cost: assigned_labour_cost,
    total_assigned_labour_hours: assigned_labour_hours,
    total_remaining_labour_cost: remaining_labour_cost,
    total_remaining_labour_hours: remaining_labour_hours,
    total_over_allocated_labour_cost: over_allocated_labour_cost,
    total_over_allocated_labour_hours: over_allocated_labour_hours,
    labour_pool_status: allocation_status,
  };
}

export function build_productive_asset_pool({
  asset_recovery_rows,
  asset_group_assignments,
}) {
  const asset_rows = safe_array(asset_recovery_rows).filter((asset) => {
    return asset?.asset_type !== "support";
  });

  const raw_assignments = safe_array(asset_group_assignments).filter(
    (assignment) => assignment?.is_active !== false
  );

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

export function build_operational_group_cost_rows({
  active_groups,
  labour_group_assignments,
  asset_group_assignments,
  overhead_group_assignments,
}) {
  return safe_array(active_groups).map((group) => {
    const group_id = group.group_id || group.operational_group_id || "";
    const division_id = group.division_id || "main_operations";

    const labour_assignments = safe_array(labour_group_assignments).filter(
      (assignment) => assignment.group_id === group_id
    );

    const asset_assignments = safe_array(asset_group_assignments).filter(
      (assignment) => assignment.group_id === group_id
    );

    const overhead_assignments = safe_array(overhead_group_assignments).filter(
      (assignment) => assignment.group_id === group_id
    );

    const assigned_labour_cost = labour_assignments.reduce(
      (sum, assignment) => sum + safe_number(assignment.assigned_cost),
      0
    );

    const assigned_labour_hours = labour_assignments.reduce(
      (sum, assignment) => sum + safe_number(assignment.assigned_hours),
      0
    );

    const assigned_asset_burden = asset_assignments.reduce(
      (sum, assignment) => sum + safe_number(assignment.assigned_asset_cost),
      0
    );

    const assigned_asset_hours = asset_assignments.reduce(
      (maximum, assignment) =>
        Math.max(maximum, safe_number(assignment.assigned_asset_hours)),
      0
    );

    const assigned_overhead_amount = overhead_assignments.reduce(
      (sum, assignment) =>
        sum + safe_number(assignment.assigned_overhead_amount),
      0
    );

    const group_recovery_hour_source =
      group.group_recovery_hour_source || "labour_hours";

    const manual_group_recovery_hours = safe_number(
      group.manual_group_recovery_hours
    );

    const group_recovery_hours =
      group_recovery_hour_source === "asset_hours"
        ? assigned_asset_hours
        : group_recovery_hour_source === "manual_hours"
          ? manual_group_recovery_hours
          : assigned_labour_hours;

    const labour_source_recovery_rate =
      assigned_labour_hours > 0
        ? assigned_labour_cost / assigned_labour_hours
        : 0;

    const labour_recovery_cost =
      group_recovery_hours > 0 && labour_source_recovery_rate > 0
        ? labour_source_recovery_rate * group_recovery_hours
        : assigned_labour_cost;

    const asset_recovery_cost = assigned_asset_burden;
    const overhead_recovery_cost = assigned_overhead_amount;

    const total_group_cost =
      labour_recovery_cost + asset_recovery_cost + overhead_recovery_cost;

    const labour_recovery_rate =
      group_recovery_hours > 0 ? labour_recovery_cost / group_recovery_hours : 0;

    const asset_recovery_rate =
      group_recovery_hours > 0 ? asset_recovery_cost / group_recovery_hours : 0;

    const overhead_recovery_rate =
      group_recovery_hours > 0
        ? overhead_recovery_cost / group_recovery_hours
        : 0;

    const group_cost_per_hour =
      group_recovery_hours > 0 ? total_group_cost / group_recovery_hours : 0;
    const asset_utilisation_percent =
      assigned_asset_hours > 0
        ? (group_recovery_hours / assigned_asset_hours) * 100
        : 0;

    const labour_utilisation_percent =
      assigned_labour_hours > 0
        ? (group_recovery_hours / assigned_labour_hours) * 100
        : 0;

    return {
      group_id,
      division_id,
      group_name: group.group_name || "Unnamed operating group",

      assigned_labour_cost,
      assigned_labour_hours,
      labour_source_recovery_rate,
      labour_recovery_cost,

      assigned_asset_burden,
      assigned_asset_hours,
      asset_recovery_cost,

      assigned_overhead_amount,
      overhead_recovery_cost,

      total_group_cost,
      group_recovery_hour_source,
      group_recovery_hours,
      manual_group_recovery_hours,
      labour_recovery_rate,
      asset_recovery_rate,
      overhead_recovery_rate,
      asset_utilisation_percent,
      labour_utilisation_percent,
      group_cost_per_hour,
      group_cost_per_unit: 0,

      labour_group_assignments: labour_assignments,
      asset_group_assignments: asset_assignments,
      overhead_group_assignments: overhead_assignments,

      allocation_status:
        total_group_cost > 0 ? "assigned" : "review_required",
    };
  });
}

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









