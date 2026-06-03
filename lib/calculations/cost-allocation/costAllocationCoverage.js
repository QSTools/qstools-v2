import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

import { calculate_coverage_percent } from "@/lib/calculations/cost-allocation/costAllocationMaps";

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

function get_asset_id(row = {}) {
  return row.asset_id || row.id || "";
}

function get_available_labour_group_ids(productive_labour_type_rows = []) {
  const available_ids = new Set();

  safe_array(productive_labour_type_rows).forEach((row) => {
    const staff_type_id = get_staff_type_id(row);

    if (staff_type_id) {
      available_ids.add(staff_type_id);
    }
  });

  return available_ids;
}

function get_assigned_labour_group_ids(labour_group_assignments = []) {
  const assigned_ids = new Set();

  safe_array(labour_group_assignments).forEach((assignment) => {
    const staff_type_id =
      assignment.staff_type_id ||
      assignment.labour_type_id ||
      assignment.labour_type_key ||
      "";

    if (staff_type_id && safe_number(assignment.assignment_percent) > 0) {
      assigned_ids.add(staff_type_id);
    }
  });

  return assigned_ids;
}

function get_available_asset_ids(asset_recovery_rows = []) {
  const available_ids = new Set();

  safe_array(asset_recovery_rows)
    .filter((asset) => asset?.asset_type !== "support")
    .forEach((asset) => {
      const asset_id = get_asset_id(asset);

      if (asset_id) {
        available_ids.add(asset_id);
      }
    });

  return available_ids;
}

function get_assigned_asset_ids(asset_group_assignments = []) {
  const assigned_ids = new Set();

  safe_array(asset_group_assignments).forEach((assignment) => {
    const asset_id = assignment.asset_id || "";

    if (asset_id && safe_number(assignment.assignment_percent) > 0) {
      assigned_ids.add(asset_id);
    }
  });

  return assigned_ids;
}

export function calculate_group_first_coverage({
  productive_labour_type_rows,
  labour_group_assignments,
  asset_recovery_rows,
  asset_group_assignments,
  valid_operational_groups,
  total_operational_groups,
}) {
  const available_labour_group_ids = get_available_labour_group_ids(
    productive_labour_type_rows
  );

  const assigned_labour_group_ids = get_assigned_labour_group_ids(
    labour_group_assignments
  );

  const available_asset_ids = get_available_asset_ids(asset_recovery_rows);

  const assigned_asset_ids = get_assigned_asset_ids(asset_group_assignments);

  const productive_labour_group_count = available_labour_group_ids.size;
  const assigned_labour_group_count = assigned_labour_group_ids.size;

  const productive_asset_count = available_asset_ids.size;
  const assigned_productive_asset_count = assigned_asset_ids.size;

  const staff_coverage_percent = calculate_coverage_percent(
    assigned_labour_group_count,
    productive_labour_group_count
  );

  const asset_coverage_percent = calculate_coverage_percent(
    assigned_productive_asset_count,
    productive_asset_count
  );

  const group_coverage_percent = calculate_coverage_percent(
    safe_number(valid_operational_groups),
    safe_number(total_operational_groups)
  );

  return {
    productive_labour_group_count,
    assigned_labour_group_count,
    productive_asset_count,
    assigned_productive_asset_count,
    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,
  };
}