import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

export const DEFAULT_DIVISION_ID = "main_operations";

function create_default_division() {
  return {
    division_id: DEFAULT_DIVISION_ID,
    division_name: "Main Operations",
    division_description: "Default operating division",
    is_active: true,
    sort_order: 1,
  };
}

function get_division_id(division = {}) {
  return division.division_id || division.id || "";
}

function get_group_division_id(group = {}) {
  return group.division_id || DEFAULT_DIVISION_ID;
}

export function get_active_divisions(divisions = []) {
  const rows = safe_array(divisions).filter(
    (division) => division?.is_active !== false
  );

  const has_default_division = rows.some(
    (division) => get_division_id(division) === DEFAULT_DIVISION_ID
  );

  const active_divisions = has_default_division
    ? rows
    : [create_default_division(), ...rows];

  return active_divisions.map((division, index) => ({
    ...division,
    division_id: get_division_id(division) || DEFAULT_DIVISION_ID,
    division_name:
      division.division_name ||
      division.name ||
      (get_division_id(division) === DEFAULT_DIVISION_ID
        ? "Main Operations"
        : "Unnamed division"),
    division_description: division.division_description || "",
    is_active: division.is_active !== false,
    sort_order: safe_number(division.sort_order || index + 1),
  }));
}

export function normalise_groups_to_divisions({
  operational_groups,
  active_divisions,
}) {
  const active_division_ids = new Set(
    safe_array(active_divisions)
      .map((division) => division?.division_id)
      .filter(Boolean)
  );

  return safe_array(operational_groups).map((group) => {
    const requested_division_id = get_group_division_id(group);

    const division_id = active_division_ids.has(requested_division_id)
      ? requested_division_id
      : DEFAULT_DIVISION_ID;

    return {
      ...group,
      division_id,
    };
  });
}

export function build_division_cost_rows({
  active_divisions,
  operational_group_cost_rows,
}) {
  const group_rows = safe_array(operational_group_cost_rows);

  return safe_array(active_divisions).map((division) => {
    const division_id = division?.division_id || DEFAULT_DIVISION_ID;

    const child_group_rows = group_rows.filter((group_row) => {
      return (group_row?.division_id || DEFAULT_DIVISION_ID) === division_id;
    });

    const assigned_labour_cost = child_group_rows.reduce(
      (sum, group) => sum + safe_number(group.assigned_labour_cost),
      0
    );

    const assigned_labour_hours = child_group_rows.reduce(
      (sum, group) => sum + safe_number(group.assigned_labour_hours),
      0
    );

    const assigned_asset_burden = child_group_rows.reduce(
      (sum, group) => sum + safe_number(group.assigned_asset_burden),
      0
    );

    const assigned_asset_hours = child_group_rows.reduce(
      (sum, group) => sum + safe_number(group.assigned_asset_hours),
      0
    );

    const assigned_overhead_amount = child_group_rows.reduce(
      (sum, group) => sum + safe_number(group.assigned_overhead_amount),
      0
    );

    const total_division_cost =
      assigned_labour_cost + assigned_asset_burden + assigned_overhead_amount;

    const division_cost_per_hour =
      assigned_labour_hours > 0
        ? total_division_cost / assigned_labour_hours
        : 0;

    const operating_group_count = child_group_rows.length;

    const valid_group_count = child_group_rows.filter((group) => {
      return group?.allocation_status === "assigned";
    }).length;

    const is_valid = operating_group_count > 0 && valid_group_count > 0;

    return {
      division_id,
      division_name: division?.division_name || "Unnamed division",
      division_description: division?.division_description || "",

      operating_group_count,
      valid_group_count,
      invalid_group_count: Math.max(0, operating_group_count - valid_group_count),

      assigned_labour_cost,
      assigned_labour_hours,

      assigned_asset_burden,
      assigned_asset_hours,

      assigned_overhead_amount,

      total_division_cost,
      division_cost_per_hour,

      group_ids: child_group_rows
        .map((group) => group?.group_id)
        .filter(Boolean),

      is_valid,
      allocation_status: is_valid ? "assigned" : "review_required",
    };
  });
}

export function get_division_summary({
  active_divisions,
  division_cost_rows,
  calculate_coverage_percent,
}) {
  const total_divisions = safe_array(active_divisions).length;

  const valid_divisions = safe_array(division_cost_rows).filter(
    (division) => division?.is_valid
  ).length;

  const invalid_divisions = Math.max(0, total_divisions - valid_divisions);

  const division_coverage_percent =
    typeof calculate_coverage_percent === "function"
      ? calculate_coverage_percent(valid_divisions, total_divisions)
      : total_divisions > 0
        ? (valid_divisions / total_divisions) * 100
        : 0;

  return {
    total_divisions,
    valid_divisions,
    invalid_divisions,
    division_coverage_percent,
  };
}