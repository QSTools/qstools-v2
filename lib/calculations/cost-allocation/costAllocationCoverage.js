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

// Same definition of "productive" used elsewhere in this codebase
// (costAllocationLabourAdapter.js's is_productive_staff) - an
// assignment counts as productive if it explicitly contributes to
// recovery hours, or its labour_class says productive.
function is_productive_assignment(assignment = {}) {
  if (assignment?.contributes_to_recovery_hours === true) {
    return true;
  }

  if (assignment?.contributes_to_recovery_hours === false) {
    return false;
  }

  return String(assignment?.labour_class || "").toLowerCase() === "productive";
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
    // Only productive labour assignments count here - the available
    // (denominator) set is productive-only by definition, so a
    // support-type assignment (e.g. Owner/Director) must never be
    // counted here either. This was the exact cause of coverage
    // exceeding 100%.
    if (!is_productive_assignment(assignment)) {
      return;
    }

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

// S18 6.3 fix: previously guarded against double-counting a
// non-productive asset via `assignment?.asset_type === "support"`, but
// assignment records never actually carry an asset_type field - asset_id
// is the join key by design (see build_non_productive_asset_pool in
// costAllocationPoolBuilders.js), so that guard was always dead code.
// Now checks membership in the productive-only available_asset_ids set
// instead - the same available/assigned membership pattern used
// throughout this file. Without this, a non-productive asset assignment
// (creatable since S18 6.2) could push asset_coverage_percent above
// 100%, the same bug class already fixed for staff coverage above.
function get_assigned_asset_ids(asset_group_assignments = [], available_asset_ids) {
  const assigned_ids = new Set();
  safe_array(asset_group_assignments).forEach((assignment) => {
    const asset_id = assignment.asset_id || "";

    if (!asset_id || !available_asset_ids.has(asset_id)) {
      return;
    }

    if (safe_number(assignment.assignment_percent) > 0) {
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
  const assigned_asset_ids = get_assigned_asset_ids(
    asset_group_assignments,
    available_asset_ids
  );

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

function get_available_labour_group_ids_combined(
  productive_labour_type_rows = [],
  support_labour_type_rows = []
) {
  const available_ids = new Set();

  [...safe_array(productive_labour_type_rows), ...safe_array(support_labour_type_rows)].forEach(
    (row) => {
      const staff_type_id = get_staff_type_id(row);
      if (staff_type_id) {
        available_ids.add(staff_type_id);
      }
    }
  );

  return available_ids;
}

function get_assigned_labour_group_ids_any(
  labour_group_assignments = [],
  available_labour_group_ids
) {
  const assigned_ids = new Set();

  safe_array(labour_group_assignments).forEach((assignment) => {
    const staff_type_id =
      assignment.staff_type_id ||
      assignment.labour_type_id ||
      assignment.labour_type_key ||
      "";

    if (
      staff_type_id &&
      available_labour_group_ids.has(staff_type_id) &&
      safe_number(assignment.assignment_percent) > 0
    ) {
      assigned_ids.add(staff_type_id);
    }
  });

  return assigned_ids;
}

function get_available_asset_ids_any(asset_recovery_rows = []) {
  const available_ids = new Set();

  safe_array(asset_recovery_rows).forEach((asset) => {
    const asset_id = get_asset_id(asset);
    if (asset_id) {
      available_ids.add(asset_id);
    }
  });

  return available_ids;
}

function get_assigned_asset_ids_any(asset_group_assignments = [], available_asset_ids) {
  const assigned_ids = new Set();

  safe_array(asset_group_assignments).forEach((assignment) => {
    const asset_id = assignment.asset_id || "";

    if (
      asset_id &&
      available_asset_ids.has(asset_id) &&
      safe_number(assignment.assignment_percent) > 0
    ) {
      assigned_ids.add(asset_id);
    }
  });

  return assigned_ids;
}

// S18 6.3 - mandatory "everything assigned" coverage. Combines
// productive AND non-productive labour groups and assets into one
// denominator, and counts an assignment of either kind in the
// numerator. This answers a different question than
// staff_coverage_percent/asset_coverage_percent above ("have we
// assigned everything" vs "can we trust the recovery rate") - kept as
// a separate, additive metric per S18 Section 5.2, specifically so
// nothing that already consumes those two fields downstream (Recovery
// Summary, Rate Builder, Business Outcome) changes meaning.
//
// Matches the same "group-first" granularity as
// calculate_group_first_coverage above (counts labour TYPES and
// individual assets, not literal headcount) for internal consistency
// with the existing coverage architecture.
export function calculate_full_attribution_coverage({
  productive_labour_type_rows,
  support_labour_type_rows,
  labour_group_assignments,
  asset_recovery_rows,
  asset_group_assignments,
}) {
  const available_labour_group_ids = get_available_labour_group_ids_combined(
    productive_labour_type_rows,
    support_labour_type_rows
  );
  const assigned_labour_group_ids = get_assigned_labour_group_ids_any(
    labour_group_assignments,
    available_labour_group_ids
  );

  const available_asset_ids = get_available_asset_ids_any(asset_recovery_rows);
  const assigned_asset_ids = get_assigned_asset_ids_any(
    asset_group_assignments,
    available_asset_ids
  );

  const total_labour_group_count_all = available_labour_group_ids.size;
  const assigned_labour_group_count_all = assigned_labour_group_ids.size;
  const unassigned_labour_group_count_all = Math.max(
    0,
    total_labour_group_count_all - assigned_labour_group_count_all
  );

  const total_asset_count_all = available_asset_ids.size;
  const assigned_asset_count_all = assigned_asset_ids.size;
  const unassigned_asset_count_all = Math.max(
    0,
    total_asset_count_all - assigned_asset_count_all
  );

  const total_attribution_units =
    total_labour_group_count_all + total_asset_count_all;
  const assigned_attribution_units =
    assigned_labour_group_count_all + assigned_asset_count_all;

  const full_cost_attribution_coverage_percent = calculate_coverage_percent(
    assigned_attribution_units,
    total_attribution_units
  );

  return {
    total_labour_group_count_all,
    assigned_labour_group_count_all,
    unassigned_labour_group_count_all,
    total_asset_count_all,
    assigned_asset_count_all,
    unassigned_asset_count_all,
    total_attribution_units,
    assigned_attribution_units,
    full_cost_attribution_coverage_percent,
  };
}