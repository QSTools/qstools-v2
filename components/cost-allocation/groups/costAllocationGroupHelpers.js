export function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

export function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

export function formatWholePercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

export function getGroupId(group) {
  return group?.group_id || group?.operational_group_id || group?.id || "";
}

export function getAssignmentId(assignment, fallback = "") {
  return (
    assignment?.assignment_id ||
    assignment?.labour_assignment_id ||
    assignment?.asset_assignment_id ||
    assignment?.overhead_assignment_id ||
    fallback
  );
}

export function getLabourGroupId(row) {
  return (
    row?.staff_type_id ||
    row?.labour_type_id ||
    row?.labour_type_key ||
    row?.id ||
    ""
  );
}

export function getLabourGroupName(row) {
  return (
    row?.staff_type_name ||
    row?.labour_type_label ||
    row?.labour_type_key ||
    row?.staff_type ||
    "Unclassified productive labour group"
  );
}

export function getAssetId(row) {
  return row?.asset_id || row?.id || "";
}

export function getAssetName(row) {
  return row?.asset_name || row?.name || "Productive asset";
}

// S18 6.2 - which pool an asset row belongs to. Defaults to "productive"
// so any row missing asset_type (shouldn't happen, but defensive) still
// renders in the existing, established section rather than vanishing.
export function getAssetRowType(row) {
  return row?.asset_type === "support" ? "support" : "productive";
}

export function getGroupRows(groups) {
  return Array.isArray(groups?.rows)
    ? groups.rows.filter((group) => group?.is_active !== false)
    : [];
}

export function getGroupCostRows(groups) {
  return Array.isArray(groups?.operational_group_cost_rows)
    ? groups.operational_group_cost_rows
    : [];
}

export function getLabourRows(labour_assignment) {
  const rows =
    labour_assignment?.productive_labour_rows ||
    labour_assignment?.productive_staff_type_rates ||
    [];

  return Array.isArray(rows) ? rows : [];
}

export function getAssetRows(asset_assignment) {
  const rows =
    asset_assignment?.productive_asset_rows ||
    asset_assignment?.asset_rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

// S18 6.2 - non-productive assets (ute, manager's car). Sourced from the
// card's support_asset_rows, which useCostAllocationAssignmentCards.js
// exposes filtered strictly to asset_type === "support" - matching what
// the "Non-productive assets" section label actually promises.
export function getSupportAssetRows(asset_assignment) {
  const rows =
    asset_assignment?.support_asset_rows ||
    asset_assignment?.non_productive_asset_rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

// S18 6.2 - combined view used only for resolving an existing assignment
// back to its source row (see findAssetRowById below). The two picker
// dropdowns in the UI still use getAssetRows()/getSupportAssetRows()
// separately so productive and non-productive stay visually distinct.
export function getAllAssetRows(asset_assignment) {
  return [...getAssetRows(asset_assignment), ...getSupportAssetRows(asset_assignment)];
}

export function findLabourRowById(labour_assignment, labour_group_id) {
  const rows = getLabourRows(labour_assignment);

  return rows.find((row) => getLabourGroupId(row) === labour_group_id) || null;
}

export function getLabourRowHours(row) {
  return Number(
    row?.total_productive_hours ??
      row?.available_hours ??
      row?.available_labour_hours ??
      row?.productive_hours ??
      row?.total_available_labour_hours ??
      0
  );
}

export function getLabourRowCost(row) {
  return Number(
    row?.total_labour_cost ??
      row?.total_annual_cost ??
      row?.available_cost ??
      row?.available_labour_cost ??
      row?.total_productive_labour_cost ??
      row?.total_available_labour_cost ??
      0
  );
}

export function getResolvedLabourAssignment({ assignment, labour_assignment }) {
  const staff_type_id =
    assignment?.staff_type_id ||
    assignment?.labour_type_id ||
    assignment?.labour_type_key ||
    "";

  const labour_row = findLabourRowById(labour_assignment, staff_type_id);

  const assignment_percent = Math.round(
    Number(assignment?.assignment_percent || 0)
  );

  const stored_assigned_hours = Number(
    assignment?.assigned_hours ??
      assignment?.assigned_labour_hours ??
      assignment?.productive_hours ??
      0
  );

  const stored_assigned_cost = Number(
    assignment?.assigned_cost ??
      assignment?.assigned_labour_cost ??
      assignment?.labour_cost ??
      0
  );

  const assigned_hours =
    stored_assigned_hours ||
    (labour_row
      ? getLabourRowHours(labour_row) * (assignment_percent / 100)
      : 0);

  const assigned_cost =
    stored_assigned_cost ||
    (labour_row
      ? getLabourRowCost(labour_row) * (assignment_percent / 100)
      : 0);

  const display_name = labour_row
    ? getLabourGroupName(labour_row)
    : assignment?.staff_type_name ||
      assignment?.labour_type_label ||
      "Old / unmatched labour group — remove and re-add";

  return {
    staff_type_id,
    labour_row,
    display_name,
    assignment_percent,
    assigned_hours,
    assigned_cost,
    is_unmatched: !labour_row,
  };
}

export function findAssetRowById(asset_assignment, asset_id) {
  const rows = getAllAssetRows(asset_assignment);

  return rows.find((row) => getAssetId(row) === asset_id) || null;
}

export function getAssetRowCost(row) {
  return Number(
    row?.asset_recovery_cost_annual ??
      row?.total_asset_cost_annual ??
      row?.cost_allocation_asset_cost_annual ??
      row?.available_asset_cost ??
      row?.total_available_asset_cost ??
      row?.asset_cost_annual ??
      row?.annual_asset_cost ??
      row?.total_annual_cost ??
      0
  );
}

export function getResolvedAssetAssignment({ assignment, asset_assignment }) {
  const asset_id = assignment?.asset_id || "";
  const asset_row = findAssetRowById(asset_assignment, asset_id);

  const assignment_percent = Math.round(
    Number(assignment?.assignment_percent || 0)
  );

  const stored_assigned_cost = Number(
    assignment?.assigned_asset_cost ??
      assignment?.assigned_cost ??
      assignment?.asset_cost ??
      0
  );

  const assigned_asset_cost =
    stored_assigned_cost ||
    (asset_row
      ? getAssetRowCost(asset_row) * (assignment_percent / 100)
      : 0);

  const display_name = asset_row
    ? getAssetName(asset_row)
    : assignment?.asset_name || "Old / unmatched asset — remove and re-add";

  const asset_type = asset_row ? getAssetRowType(asset_row) : "productive";

  return {
    asset_id,
    asset_row,
    asset_type,
    display_name,
    assignment_percent,
    assigned_asset_cost,
    is_unmatched: !asset_row,
  };
}

export function getAllLabourAssignments(labour_assignment) {
  const rows =
    labour_assignment?.assignments ||
    labour_assignment?.labour_group_assignments ||
    [];

  return Array.isArray(rows)
    ? rows.filter((assignment) => assignment?.is_active !== false)
    : [];
}

export function getLabourGroupAllocatedPercent(
  labour_assignment,
  labour_group_id
) {
  return getAllLabourAssignments(labour_assignment).reduce(
    (sum, assignment) => {
      const assigned_staff_type_id =
        assignment?.staff_type_id ||
        assignment?.labour_type_id ||
        assignment?.labour_type_key ||
        "";

      if (assigned_staff_type_id !== labour_group_id) {
        return sum;
      }

      return sum + Math.round(Number(assignment?.assignment_percent || 0));
    },
    0
  );
}

export function getLabourGroupRemainingPercent(
  labour_assignment,
  labour_group_id
) {
  const allocated_percent = getLabourGroupAllocatedPercent(
    labour_assignment,
    labour_group_id
  );

  return Math.max(0, 100 - allocated_percent);
}

export function getLabourAssignments(labour_assignment, group_id) {
  return getAllLabourAssignments(labour_assignment).filter(
    (assignment) => assignment?.group_id === group_id
  );
}

export function getAllAssetAssignments(asset_assignment) {
  const rows =
    asset_assignment?.assignments ||
    asset_assignment?.asset_group_assignments ||
    [];

  return Array.isArray(rows)
    ? rows.filter((assignment) => assignment?.is_active !== false)
    : [];
}

export function getAssetAllocatedPercent(asset_assignment, asset_id) {
  return getAllAssetAssignments(asset_assignment).reduce((sum, assignment) => {
    if (assignment?.asset_id !== asset_id) {
      return sum;
    }

    return sum + Math.round(Number(assignment?.assignment_percent || 0));
  }, 0);
}

export function getAssetRemainingPercent(asset_assignment, asset_id) {
  const allocated_percent = getAssetAllocatedPercent(asset_assignment, asset_id);

  return Math.max(0, 100 - allocated_percent);
}

export function getAssetAssignments(asset_assignment, group_id) {
  return getAllAssetAssignments(asset_assignment).filter(
    (assignment) => assignment?.group_id === group_id
  );
}

export function splitAssetAssignmentsByType(assignments, asset_assignment) {
  const productive = [];
  const support = [];

  (Array.isArray(assignments) ? assignments : []).forEach((assignment) => {
    const resolved = getResolvedAssetAssignment({ assignment, asset_assignment });

    if (resolved.asset_type === "support") {
      support.push(assignment);
    } else {
      productive.push(assignment);
    }
  });

  return { productive, support };
}

export function getOverheadAssignments(overhead_assignment, group_id) {
  const rows =
    overhead_assignment?.assignments ||
    overhead_assignment?.overhead_group_assignments ||
    [];

  return Array.isArray(rows)
    ? rows.filter(
        (assignment) =>
          assignment?.is_active !== false && assignment?.group_id === group_id
      )
    : [];
}