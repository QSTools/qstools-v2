import {
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

// F-4 (owner decision 2026-10-25): support-asset cost that is not assigned to any
// working unit is spread EVENLY across the active working units, so the numbers are
// complete. The caller flags it with a red warning. This is a default, not a fix: the
// owner should assign each support asset to a unit.
//
// Productive assets are NOT spread here. An unassigned productive asset is a blocking
// flag (has_unassigned_productive_asset in costAllocationRuleBuildContext.js).
//
// Pure function. The spread rows use the same shape as a normal non-productive asset
// assignment, so costAllocationGroupCostBuilder.js sums them with no special case.

export const UNASSIGNED_SPREAD_ASSET_ID = "unassigned_support_asset_spread";

const MINIMUM_SPREAD_COST = 0.005;

export function build_unassigned_support_asset_spread({
  remaining_support_asset_cost,
  active_groups,
}) {
  const groups = safe_array(active_groups).filter(
    (group) => group?.group_id || group?.operational_group_id
  );

  const remaining_cost = Math.max(0, safe_number(remaining_support_asset_cost));

  if (remaining_cost <= MINIMUM_SPREAD_COST) {
    return {
      spread_assignments: [],
      total_spread_cost: 0,
      spread_group_count: groups.length,
      spread_status: "none",
    };
  }

  // No working units to spread into: nothing can be spread, the cost stays unassigned.
  if (groups.length === 0) {
    return {
      spread_assignments: [],
      total_spread_cost: 0,
      spread_group_count: 0,
      spread_status: "no_working_units",
    };
  }

  const cost_per_group = remaining_cost / groups.length;
  const percent_per_group = 100 / groups.length;

  const spread_assignments = groups.map((group) => {
    const group_id = group.group_id || group.operational_group_id;

    return {
      assignment_id: `${group_id}_${UNASSIGNED_SPREAD_ASSET_ID}`,
      group_id,
      asset_id: UNASSIGNED_SPREAD_ASSET_ID,
      asset_name: "Unassigned support asset cost (spread evenly)",
      assignment_percent: percent_per_group,
      assigned_asset_cost: cost_per_group,
      is_active: true,
      allocation_status: "spread_unassigned",
      is_automatic: true,
      is_unassigned_spread: true,
    };
  });

  return {
    spread_assignments,
    total_spread_cost: remaining_cost,
    spread_group_count: groups.length,
    spread_status: "spread",
  };
}
