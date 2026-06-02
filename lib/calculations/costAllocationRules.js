import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

import {
  build_active_maps,
  calculate_coverage_percent,
  get_active_groups,
  get_active_links,
  get_linked_sets,
} from "@/lib/calculations/cost-allocation/costAllocationMaps";

import {
  get_allocation_dependency_type,
  get_allocation_status,
} from "@/lib/calculations/cost-allocation/costAllocationStatus";

import {
  get_duplicate_link_warnings,
  get_orphan_warnings,
  get_structure_valid,
  has_component_required_recovery,
  validate_groups,
} from "@/lib/calculations/cost-allocation/costAllocationValidation";

import { build_cost_allocation_warnings } from "@/lib/calculations/cost-allocation/costAllocationWarnings";

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

function build_productive_labour_pool({
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

function build_productive_asset_pool({
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

function build_operational_group_cost_rows({
  active_groups,
  labour_group_assignments,
  asset_group_assignments,
  overhead_group_assignments,
}) {
  return safe_array(active_groups).map((group) => {
    const group_id = group.group_id || group.operational_group_id || "";

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
      (sum, assignment) => sum + safe_number(assignment.assigned_asset_hours),
      0
    );

    const assigned_overhead_amount = overhead_assignments.reduce(
      (sum, assignment) =>
        sum + safe_number(assignment.assigned_overhead_amount),
      0
    );

    const total_group_cost =
      assigned_labour_cost + assigned_asset_burden + assigned_overhead_amount;

    const group_cost_per_hour =
      assigned_labour_hours > 0
        ? total_group_cost / assigned_labour_hours
        : 0;

    return {
      group_id,
      group_name: group.group_name || "Unnamed operating group",

      assigned_labour_cost,
      assigned_labour_hours,

      assigned_asset_burden,
      assigned_asset_hours,

      assigned_overhead_amount,

      total_group_cost,
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

function build_overhead_pool({
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

export function calculate_cost_allocation(inputs = {}) {
  const active_staff = safe_array(inputs.active_staff);
  const active_assets = safe_array(inputs.active_assets);
  const asset_labour_links = safe_array(inputs.asset_labour_links);
  const operational_groups = safe_array(inputs.operational_groups);
  const productive_labour_type_rows = safe_array(
    inputs.productive_labour_type_rows
  );

  const labour_assignment_result = build_productive_labour_pool({
    productive_labour_type_rows,
    labour_group_assignments: inputs.labour_group_assignments,
  });

  const asset_assignment_result = build_productive_asset_pool({
    asset_recovery_rows: inputs.asset_recovery_rows,
    asset_group_assignments: inputs.asset_group_assignments,
  });

  const { active_staff_map, active_asset_map } = build_active_maps(
    active_staff,
    active_assets
  );

  const active_asset_labour_links = get_active_links(
    asset_labour_links,
    active_staff_map,
    active_asset_map
  );

  const active_operational_groups = get_active_groups(operational_groups);

  const { linked_staff_ids, linked_asset_ids } = get_linked_sets(
    active_asset_labour_links
  );

  const duplicate_link_warnings = get_duplicate_link_warnings(
    active_asset_labour_links
  );

  const { validated_groups, group_validation_warnings } = validate_groups({
    active_groups: active_operational_groups,
    active_asset_map,
    active_staff_map,
  });

  const active_staff_count = active_staff.length;
  const active_asset_count = active_assets.length;

  const linked_staff_count = linked_staff_ids.size;
  const linked_asset_count = linked_asset_ids.size;

  const unlinked_staff_count = Math.max(
    0,
    active_staff_count - linked_staff_count
  );

  const unlinked_asset_count = Math.max(
    0,
    active_asset_count - linked_asset_count
  );

  const total_operational_groups = validated_groups.length;

  const valid_operational_groups = validated_groups.filter(
    (group) => group.is_valid
  ).length;

  const invalid_operational_groups = Math.max(
    0,
    total_operational_groups - valid_operational_groups
  );

  const staff_coverage_percent = calculate_coverage_percent(
    linked_staff_count,
    active_staff_count
  );

  const asset_coverage_percent = calculate_coverage_percent(
    linked_asset_count,
    active_asset_count
  );

  const group_coverage_percent = calculate_coverage_percent(
    valid_operational_groups,
    total_operational_groups
  );

  const base_operational_group_cost_rows = build_operational_group_cost_rows({
    active_groups: validated_groups,
    labour_group_assignments:
      labour_assignment_result.labour_group_assignments,
    asset_group_assignments: asset_assignment_result.asset_group_assignments,
    overhead_group_assignments: [],
  });

  const overhead_assignment_result = build_overhead_pool({
    overhead_absorbed_cost: inputs.overhead_absorbed_cost,
    overhead_group_assignments: inputs.overhead_group_assignments,
    operational_group_cost_rows: base_operational_group_cost_rows,
  });

  const labour_pool_over_allocated =
    labour_assignment_result.labour_pool_status === "over_allocated";

  const asset_pool_over_allocated =
    asset_assignment_result.asset_pool_status === "over_allocated";

  const overhead_pool_over_allocated =
    overhead_assignment_result.overhead_pool_status === "over_allocated";

  const has_over_allocated_source_pool =
    labour_pool_over_allocated ||
    asset_pool_over_allocated ||
    overhead_pool_over_allocated;

  const active_recovery_model =
    inputs.active_recovery_model || inputs.recovery_model || "labour_only";

  const asset_recovery_selected =
    safe_number(inputs.asset_share_percent) > 0 ||
    inputs.asset_recovery_included === true;

  const base_structure_valid = get_structure_valid({
    active_recovery_model,
    asset_recovery_selected,
    duplicate_link_warnings,
    active_staff_count,
    active_asset_count,
    linked_staff_count,
    linked_asset_count,
    total_operational_groups,
    invalid_operational_groups,
  });

  const structure_valid =
    base_structure_valid && !has_over_allocated_source_pool;

  const orphan_warnings = get_orphan_warnings({
    active_staff,
    active_assets,
    linked_staff_ids,
    linked_asset_ids,
    active_groups: validated_groups,
  });

  const missing_recovery_plan_target =
    safe_number(inputs.recovery_plan_target_per_driver) <= 0 &&
    safe_number(inputs.required_recovery_rate) <= 0;

  const missing_component_required_recovery =
    !has_component_required_recovery(inputs.component_required_recovery);

  const has_low_staff_coverage =
    active_staff_count > 0 && staff_coverage_percent < 70;

  const has_low_asset_coverage =
    active_asset_count > 0 &&
    asset_recovery_selected &&
    asset_coverage_percent < 70;

  const has_low_group_coverage =
    total_operational_groups > 0 && group_coverage_percent < 70;

  const has_no_operational_groups = total_operational_groups === 0;

  const has_no_labour_cost =
    labour_assignment_result.total_available_labour_cost <= 0;

  const has_no_productive_labour_driver =
    productive_labour_type_rows.length === 0;

  const has_asset_structure_issue =
    asset_recovery_selected &&
    (active_asset_count === 0 ||
      linked_asset_count === 0 ||
      invalid_operational_groups > 0);

  const has_internal_capacity_shortfall = false;
  const external_delivery_required = false;

  const has_unassigned_cost =
    labour_assignment_result.total_remaining_labour_cost > 1 ||
    asset_assignment_result.total_remaining_asset_cost > 1 ||
    overhead_assignment_result.total_remaining_overhead_cost > 1;

  const has_productive_asset_zero_utilisation = false;
  const has_asset_without_labour_driver_group = false;
  const has_labour_without_productive_capacity_group = false;

  const allocation_dependency_type = get_allocation_dependency_type({
    has_internal_capacity_shortfall,
    external_delivery_required,
    has_asset_structure_issue,
  });

  const source_pool_warnings = [];

  if (labour_pool_over_allocated) {
    source_pool_warnings.push({
      warning_key: "productive_labour_pool_over_allocated",
      message:
        "Productive Labour Pool is over-allocated. Reduce assigned labour percentage before relying on this allocation.",
    });
  }

  if (asset_pool_over_allocated) {
    source_pool_warnings.push({
      warning_key: "productive_asset_pool_over_allocated",
      message:
        "Productive Asset Pool is over-allocated. Reduce asset assignment percentages before relying on this allocation.",
    });
  }

  if (overhead_pool_over_allocated) {
    source_pool_warnings.push({
      warning_key: "overhead_pool_over_allocated",
      message:
        "Overhead Pool is over-allocated. Reduce assigned overhead before relying on this allocation.",
    });
  }

  const built_warnings = build_cost_allocation_warnings({
    recovery_summary_ready: inputs.recovery_summary_ready,
    missing_recovery_plan_target,
    missing_component_required_recovery,
    structure_valid,
    unlinked_staff_count,
    unlinked_asset_count,
    has_low_staff_coverage,
    has_low_asset_coverage,
    has_low_group_coverage,
    has_internal_capacity_shortfall,
    external_delivery_required,
    external_delivery_enabled: inputs.external_delivery_enabled === true,
    has_asset_structure_issue,
    has_no_labour_cost,
    has_no_productive_labour_driver,
    has_productive_asset_zero_utilisation,
    has_asset_without_labour_driver_group,
    has_labour_without_productive_capacity_group,
    has_unassigned_cost,
    has_no_operational_groups,
    duplicate_link_warnings,
    invalid_operational_groups,
  });

  const setup_warnings = [
    ...safe_array(built_warnings.setup_warnings),
    ...source_pool_warnings,
  ];

  const structural_warnings = safe_array(built_warnings.structural_warnings);

  const allocation_warnings = [...setup_warnings, ...structural_warnings];

  const base_allocation_status = get_allocation_status({
    recovery_summary_ready: inputs.recovery_summary_ready,
    missing_recovery_plan_target,
    missing_component_required_recovery,
    structure_valid,
    has_asset_structure_issue,
    has_internal_capacity_shortfall,
    external_delivery_enabled: inputs.external_delivery_enabled === true,
    has_low_coverage:
      has_low_staff_coverage || has_low_asset_coverage || has_low_group_coverage,
  });

  const allocation_status = has_over_allocated_source_pool
    ? "blocked"
    : base_allocation_status;

  const operational_group_cost_rows = build_operational_group_cost_rows({
    active_groups: validated_groups,
    labour_group_assignments:
      labour_assignment_result.labour_group_assignments,
    asset_group_assignments: asset_assignment_result.asset_group_assignments,
    overhead_group_assignments:
      overhead_assignment_result.overhead_group_assignments,
  });

  const total_grouped_labour_cost =
    labour_assignment_result.total_assigned_labour_cost;

  const total_grouped_asset_cost =
    asset_assignment_result.total_assigned_asset_cost;

  const total_grouped_overhead_cost =
    overhead_assignment_result.total_assigned_overhead_cost;

  const total_grouped_operating_cost =
    total_grouped_labour_cost +
    total_grouped_asset_cost +
    total_grouped_overhead_cost;

  const unassigned_labour_cost =
    labour_assignment_result.total_remaining_labour_cost;

  const unassigned_asset_cost =
    asset_assignment_result.total_remaining_asset_cost;

  const unassigned_overhead_cost =
    overhead_assignment_result.total_remaining_overhead_cost;

  const total_unassigned_cost =
    unassigned_labour_cost + unassigned_asset_cost + unassigned_overhead_cost;

  return {
    ...inputs,

    active_recovery_model,
    allocation_status,
    allocation_dependency_type,

    setup_warnings,
    structural_warnings,
    allocation_warnings,

    active_asset_labour_links,
    active_operational_groups: validated_groups,

    linked_staff_count,
    unlinked_staff_count,
    linked_asset_count,
    unlinked_asset_count,

    total_operational_groups,
    valid_operational_groups,
    invalid_operational_groups,

    duplicate_link_warnings,
    orphan_warnings,
    group_validation_warnings,

    structure_valid,
    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,

    external_delivery_enabled: inputs.external_delivery_enabled === true,
    external_delivery_required,
    internal_capacity_shortfall: has_internal_capacity_shortfall,

    productive_labour_type_rows,
    productive_labour_pool: labour_assignment_result.productive_labour_pool,
    labour_group_assignments:
      labour_assignment_result.labour_group_assignments,

    total_available_labour_cost:
      labour_assignment_result.total_available_labour_cost,
    total_available_labour_hours:
      labour_assignment_result.total_available_labour_hours,
    total_assigned_labour_cost:
      labour_assignment_result.total_assigned_labour_cost,
    total_assigned_labour_hours:
      labour_assignment_result.total_assigned_labour_hours,
    total_remaining_labour_cost:
      labour_assignment_result.total_remaining_labour_cost,
    total_remaining_labour_hours:
      labour_assignment_result.total_remaining_labour_hours,
    total_over_allocated_labour_cost:
      labour_assignment_result.total_over_allocated_labour_cost,
    total_over_allocated_labour_hours:
      labour_assignment_result.total_over_allocated_labour_hours,
    labour_pool_status: labour_assignment_result.labour_pool_status,

    productive_asset_pool: asset_assignment_result.productive_asset_pool,
    asset_group_assignments:
      asset_assignment_result.asset_group_assignments,

    total_available_asset_cost:
      asset_assignment_result.total_available_asset_cost,
    total_available_asset_hours:
      asset_assignment_result.total_available_asset_hours,
    total_assigned_asset_cost:
      asset_assignment_result.total_assigned_asset_cost,
    total_assigned_asset_hours:
      asset_assignment_result.total_assigned_asset_hours,
    total_remaining_asset_cost:
      asset_assignment_result.total_remaining_asset_cost,
    total_remaining_asset_hours:
      asset_assignment_result.total_remaining_asset_hours,
    total_over_allocated_asset_cost:
      asset_assignment_result.total_over_allocated_asset_cost,
    total_over_allocated_asset_hours:
      asset_assignment_result.total_over_allocated_asset_hours,
    asset_pool_status: asset_assignment_result.asset_pool_status,

    overhead_pool: overhead_assignment_result.overhead_pool,
    overhead_group_assignments:
      overhead_assignment_result.overhead_group_assignments,

    total_available_overhead_cost:
      overhead_assignment_result.total_available_overhead_cost,
    total_assigned_overhead_cost:
      overhead_assignment_result.total_assigned_overhead_cost,
    total_remaining_overhead_cost:
      overhead_assignment_result.total_remaining_overhead_cost,
    total_over_allocated_overhead_cost:
      overhead_assignment_result.total_over_allocated_overhead_cost,
    overhead_pool_status: overhead_assignment_result.overhead_pool_status,

    labour_pool_over_allocated,
    asset_pool_over_allocated,
    overhead_pool_over_allocated,
    has_over_allocated_source_pool,

    operational_group_cost_rows,

    total_grouped_labour_cost,
    total_grouped_asset_cost,
    total_grouped_overhead_cost,
    total_grouped_operating_cost,

    unassigned_labour_cost,
    unassigned_asset_cost,
    unassigned_overhead_cost,
    total_unassigned_cost,

    cost_allocation_ready:
      allocation_status === "ready" ||
      allocation_status === "ready_with_dependency",
  };
}