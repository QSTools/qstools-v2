// Mirra v6.0 - Calculation Trace - Cost Allocation Nodes
// Orphaned subgraph (2026-09-27): Cost Allocation feeds Rate Builder /
// Business Outcome / Business Modelling, not the current Business Summary
// root, so these nodes are NOT yet reachable from the page's upstream
// trace path. They exist in the graph (visible via getTraceIntegrityReport
// / getTraceNodesByModule) so this live-resolver work doesn't need to be
// redone once Rate Builder/Business Outcome wiring connects a real root
// to them. See CALCULATION_TRACE_VERIFICATION_LAYER_FUTURE_BUILD_BRIEF_
// 2026-09-26.txt Section 7 (session 9 addendum) for the decision record.
//
// Reuses the exact identity helpers Cost Allocation itself uses
// (costAllocationSharedHelpers.js) so a staff_type_id / asset_id here can
// never drift from what the real allocation code resolves.

import {
  get_staff_type_id,
  get_staff_type_name,
  get_total_annual_cost,
  get_asset_id,
  get_asset_name,
  get_total_asset_cost,
} from "@/lib/calculations/cost-allocation/costAllocationSharedHelpers";

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildLabourTypeSourceNodes(live) {
  const rows = Array.isArray(live?.cost_allocation?.productive_labour_type_rows)
    ? live.cost_allocation.productive_labour_type_rows
    : [];

  return rows.flatMap((row) => {
    const staff_type_id = get_staff_type_id(row);
    if (!staff_type_id) {
      return [];
    }

    const label = get_staff_type_name(row);

    return [
      {
        node_id: `cost_allocation.labour_type.${staff_type_id}`,
        display_label: `${label} - Available Labour Cost (Cost Allocation)`,
        module_name: "cost-allocation",
        is_root_input: true,
        value_format: "currency",
        formula_text:
          "This labour type's available annual cost, before any group assignment. May feed more than one operational group - see 'Also feeds'.",
        brief_reference: "Dynamic Cost Allocation node - built live from productive_labour_type_rows",
        last_verified_against: "Session 10, calculation trace Cost Allocation extension",
        source_file: "lib/calculations/cost-allocation/costAllocationLabourPoolBuilders.js",
        implementation_status: "live_verified_field",
        inputs: [],
        resolve: () => safeNumber(get_total_annual_cost(row)),
      },
    ];
  });
}

export function buildAssetSourceNodes(live) {
  const rows = Array.isArray(live?.cost_allocation?.asset_recovery_rows)
    ? live.cost_allocation.asset_recovery_rows
    : [];

  return rows.flatMap((row) => {
    const asset_id = get_asset_id(row);
    if (!asset_id) {
      return [];
    }

    const label = get_asset_name(row);

    return [
      {
        node_id: `cost_allocation.asset.${asset_id}`,
        display_label: `${label} - Available Asset Cost (Cost Allocation)`,
        module_name: "cost-allocation",
        is_root_input: true,
        value_format: "currency",
        formula_text:
          "This asset's available annual recovery cost, before any group assignment. May feed more than one operational group - see 'Also feeds'.",
        brief_reference: "Dynamic Cost Allocation node - built live from asset_recovery_rows",
        last_verified_against: "Session 10, calculation trace Cost Allocation extension",
        source_file: "lib/calculations/cost-allocation/costAllocationAssetPoolBuilders.js",
        implementation_status: "live_verified_field",
        inputs: [],
        resolve: () => safeNumber(get_total_asset_cost(row)),
      },
    ];
  });
}

export function buildOverheadPoolNode(live) {
  const overhead_pool = live?.cost_allocation?.overhead_pool;
  if (!overhead_pool) {
    return [];
  }

  return [
    {
      node_id: "cost_allocation.overhead_pool",
      display_label: "Overhead Pool (Cost Allocation)",
      module_name: "cost-allocation",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "Overhead available for allocation, split across active operational groups by labour-cost weight, asset-burden weight, or equal split. Upstream source (overhead_absorbed_cost / Rate Builder) is not yet traced - boundary node.",
      brief_reference: "Dynamic Cost Allocation node - built live from overhead_pool",
      last_verified_against: "Session 10, calculation trace Cost Allocation extension",
      source_file: "lib/calculations/cost-allocation/costAllocationOverheadPoolBuilder.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => safeNumber(overhead_pool.available_overhead_cost),
    },
  ];
}

export function buildOperationalGroupNodes(live) {
  const rows = Array.isArray(live?.cost_allocation?.operational_group_cost_rows)
    ? live.cost_allocation.operational_group_cost_rows
    : [];

  return rows.flatMap((row) => {
    const group_id = row?.group_id;
    if (!group_id) {
      return [];
    }

    const label = row.group_name || group_id;

    const labour_input_ids = Array.isArray(row.labour_group_assignments)
      ? row.labour_group_assignments
          .map((assignment) => assignment?.staff_type_id)
          .filter(Boolean)
          .map((staff_type_id) => `cost_allocation.labour_type.${staff_type_id}`)
      : [];

    const asset_input_ids = Array.isArray(row.asset_group_assignments)
      ? row.asset_group_assignments
          .map((assignment) => assignment?.asset_id)
          .filter(Boolean)
          .map((asset_id) => `cost_allocation.asset.${asset_id}`)
      : [];

    const overhead_input_ids =
      Array.isArray(row.overhead_group_assignments) && row.overhead_group_assignments.length > 0
        ? ["cost_allocation.overhead_pool"]
        : [];

    const total_cost_node_id = `cost_allocation.group.${group_id}.total_group_cost`;

    return [
      {
        node_id: total_cost_node_id,
        display_label: `${label} - Total Group Cost`,
        module_name: "cost-allocation",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "total_group_cost = labour_recovery_cost + asset_recovery_cost + overhead_recovery_cost + non_productive_labour_cost + non_productive_asset_cost",
        brief_reference: "Dynamic Cost Allocation node - built live from operational_group_cost_rows",
        last_verified_against: "Session 10, calculation trace Cost Allocation extension",
        source_file: "lib/calculations/cost-allocation/costAllocationGroupCostBuilder.js",
        implementation_status: "live_verified_field",
        inputs: [...labour_input_ids, ...asset_input_ids, ...overhead_input_ids],
        resolve: () => safeNumber(row.total_group_cost),
      },
      {
        node_id: `cost_allocation.group.${group_id}.group_cost_per_hour`,
        display_label: `${label} - Cost Per Recovery Hour`,
        module_name: "cost-allocation",
        is_root_input: false,
        value_format: "currency_per_unit",
        formula_text: "group_cost_per_hour = total_group_cost / group_recovery_hours",
        brief_reference: "Dynamic Cost Allocation node - built live from operational_group_cost_rows",
        last_verified_against: "Session 10, calculation trace Cost Allocation extension",
        source_file: "lib/calculations/cost-allocation/costAllocationGroupCostBuilder.js",
        implementation_status: "live_verified_field",
        inputs: [total_cost_node_id],
        resolve: () => safeNumber(row.group_cost_per_hour),
      },
    ];
  });
}