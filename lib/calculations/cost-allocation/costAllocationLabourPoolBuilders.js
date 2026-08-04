import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";
import {
  get_staff_type_id,
  get_staff_type_name,
  get_total_annual_cost,
  get_total_productive_hours,
  get_weighted_hourly_rate,
  resolve_is_productive_assignment,
} from "@/lib/calculations/cost-allocation/costAllocationSharedHelpers";

export function build_productive_labour_pool({
  productive_labour_type_rows,
  labour_group_assignments,
}) {
  const labour_rows = safe_array(productive_labour_type_rows);

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

  // S18 fix: previously this took every active assignment regardless of
  // labour class, so a non-productive assignment (e.g. Owner/Director)
  // would fail to match labour_rate_map and silently compute to $0 cost
  // while still showing allocation_status: "assigned". Non-productive
  // assignments now belong exclusively to build_non_productive_labour_pool.
  const raw_assignments = safe_array(labour_group_assignments)
    .filter((assignment) => assignment?.is_active !== false)
    .filter((assignment) =>
      resolve_is_productive_assignment(assignment, labour_rate_map)
    );

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

// S18 6.1 - Non-Productive Labour Pool.
// Cost only. Deliberately exposes no hours or recovery-rate fields:
// non-productive labour never carries recovery hours and is never
// charged out. Uses the same labour_group_assignments array as the
// productive pool - partitioned by resolve_is_productive_assignment,
// not a separate storage array (see S18 Section 6.1 revision note).
export function build_non_productive_labour_pool({
  support_labour_type_rows,
  labour_group_assignments,
  productive_labour_type_rows,
}) {
  const support_rows = safe_array(support_labour_type_rows);
  const productive_rows = safe_array(productive_labour_type_rows);

  const productive_rate_map = new Map();

  productive_rows.forEach((row) => {
    const staff_type_id = get_staff_type_id(row);

    if (staff_type_id) {
      productive_rate_map.set(staff_type_id, true);
    }
  });

  const support_rate_map = new Map();

  support_rows.forEach((row) => {
    const staff_type_id = get_staff_type_id(row);

    if (!staff_type_id) {
      return;
    }

    support_rate_map.set(staff_type_id, {
      staff_type_id,
      staff_type_name: get_staff_type_name(row),
      available_cost: get_total_annual_cost(row),
    });
  });

  const raw_assignments = safe_array(labour_group_assignments)
    .filter((assignment) => assignment?.is_active !== false)
    .filter(
      (assignment) =>
        !resolve_is_productive_assignment(assignment, productive_rate_map)
    );

  const enriched_assignments = raw_assignments.map((assignment) => {
    const staff_type_id =
      assignment.staff_type_id ||
      assignment.labour_type_id ||
      assignment.labour_type_key ||
      "";

    const support_row = support_rate_map.get(staff_type_id);

    const assignment_percent = Math.max(
      0,
      Math.round(safe_number(assignment.assignment_percent))
    );

    const available_cost = safe_number(support_row?.available_cost);

    const assigned_cost =
      assignment.assigned_cost !== undefined
        ? safe_number(assignment.assigned_cost)
        : available_cost * (assignment_percent / 100);

    return {
      ...assignment,
      assignment_id:
        assignment.assignment_id ||
        assignment.labour_assignment_id ||
        `${assignment.group_id}_${staff_type_id}`,
      staff_type_id,
      staff_type_name:
        assignment.staff_type_name ||
        assignment.labour_type_label ||
        support_row?.staff_type_name ||
        "Non-productive labour",
      assignment_percent,
      assigned_cost,
      allocation_status: "assigned",
    };
  });

  const available_non_productive_labour_cost = support_rows.reduce(
    (sum, row) => sum + get_total_annual_cost(row),
    0
  );

  const assigned_non_productive_labour_cost = enriched_assignments.reduce(
    (sum, assignment) => sum + safe_number(assignment.assigned_cost),
    0
  );

  const assigned_percent_by_labour_type = new Map();

  enriched_assignments.forEach((assignment) => {
    const staff_type_id = assignment.staff_type_id;

    if (!staff_type_id) {
      return;
    }

    assigned_percent_by_labour_type.set(
      staff_type_id,
      safe_number(assigned_percent_by_labour_type.get(staff_type_id)) +
        safe_number(assignment.assignment_percent)
    );
  });

  let over_allocated_non_productive_labour_cost = 0;
  let max_non_productive_assignment_percent = 0;

  assigned_percent_by_labour_type.forEach((assigned_percent, staff_type_id) => {
    max_non_productive_assignment_percent = Math.max(
      max_non_productive_assignment_percent,
      assigned_percent
    );

    if (assigned_percent <= 100) {
      return;
    }

    const support_row = support_rate_map.get(staff_type_id);
    const over_percent = assigned_percent - 100;

    over_allocated_non_productive_labour_cost +=
      safe_number(support_row?.available_cost) * (over_percent / 100);
  });

  const remaining_non_productive_labour_cost =
    available_non_productive_labour_cost - assigned_non_productive_labour_cost;

  let allocation_status = "balanced";

  if (over_allocated_non_productive_labour_cost > 0) {
    allocation_status = "over_allocated";
  } else if (remaining_non_productive_labour_cost > 1) {
    allocation_status = "under_allocated";
  }

  return {
    non_productive_labour_pool: {
      pool_id: "non_productive_labour_pool",
      pool_name: "Non-Productive Labour Pool",
      available_labour_cost: available_non_productive_labour_cost,
      assigned_labour_cost: assigned_non_productive_labour_cost,
      remaining_labour_cost: remaining_non_productive_labour_cost,
      over_allocated_labour_cost: over_allocated_non_productive_labour_cost,
      max_assignment_percent: max_non_productive_assignment_percent,
      allocation_status,
    },

    non_productive_labour_group_assignments: enriched_assignments,

    total_available_non_productive_labour_cost:
      available_non_productive_labour_cost,
    total_assigned_non_productive_labour_cost:
      assigned_non_productive_labour_cost,
    total_remaining_non_productive_labour_cost:
      remaining_non_productive_labour_cost,
    total_over_allocated_non_productive_labour_cost:
      over_allocated_non_productive_labour_cost,
    non_productive_labour_pool_status: allocation_status,
  };
}
