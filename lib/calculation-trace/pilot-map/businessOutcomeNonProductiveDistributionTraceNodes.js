// Mirra v6.0 - Calculation Trace - Business Outcome Non-Productive Cost
// Distribution ("How the Business Runs") Nodes
// Session 13 (continued). distribute_non_productive_cost, defined inline
// in useBusinessOutcomePerSourceRevenue.js (~L689) - how a pure-support
// working unit''s own unrecovered cost (e.g. Accountant, Office Staff,
// nothing billable) gets spread across productive units, versus shown as
// its own visible row ("Each Part On Its Own" vs "How the Business Runs" -
// the two framings named in the hook''s own comments).
//
// RUNS ONCE, SHARED BY BOTH CASCADES: confirmed by reading the call site -
// distribute_non_productive_cost is called exactly once, and the SAME
// non_productive_cost_by_group_id map is passed into BOTH
// apply_real_capacity (View A) and apply_real_capacity_v2 (View B). There
// is no separate View A/View B version of this mechanism, unlike
// real_capacity and assumed_capacity above.
//
// TWO DIFFERENT PATHS a group''s own non-productive cost can take, and the
// exposed data does NOT say per-group which one applied:
//   - PURE-SUPPORT groups (zero productive labour AND zero productive
//     asset cost) always get pooled and spread.
//   - MIXED units (has both productive and non-productive cost) follow a
//     policy: "spread_as_overhead" pools them the same as pure-support;
//     "charge_to_self" (the default) keeps the cost entirely on that
//     group, never touching the pool.
//   - The pool, once totalled, is spread across all PRODUCTIVE groups
//     weighted by labour cost (if any recipient has productive labour
//     cost), else asset burden (an equal-split fallback exists in the code but is unreachable - F1).
// Because which path a given group took is not exposed, this file does
// NOT wire an edge from the pool node into every group''s non_productive_cost
// node - that would misrepresent charge_to_self groups, whose cost never
// touches the pool at all. The pool is modelled as a standalone,
// informational figure instead; both paths are described in the group
// node''s own formula_text.
//
// What IS unambiguous, and correctly wired: each group''s resulting
// non_productive_cost (whichever path produced it) genuinely feeds that
// group''s true_cost inside BOTH cascades - see the small correction this
// session makes to businessOutcomeRealCapacityTraceNodes.js''s existing
// group real_capacity nodes, adding this node as an extra input.

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildBusinessOutcomeNonProductiveDistributionPoolNode(live) {
  const pool_total = live?.business_outcome?.non_productive_cost_distributed_total;
  const pure_support_input_ids = (Array.isArray(live?.business_outcome?.pure_support_groups)
    ? live.business_outcome.pure_support_groups
    : []
  )
    .filter((entry) => entry?.group_id)
    .map((entry) => `business_outcome.non_productive_distribution.pure_support.${entry.group_id}`);
  if (pool_total === undefined || pool_total === null) {
    return [];
  }

  return [
    {
      node_id: "business_outcome.non_productive_distribution.pool",
      display_label: "Non-Productive Cost Pool (Business Outcome)",
      module_name: "business-outcome",
      is_root_input: false,
      value_format: "currency",
      formula_text:
        "Sum of every pure-support group''s own_non_productive_cost, plus any mixed unit''s own_non_productive_cost where the mixed_unit_non_productive_policy setting is spread_as_overhead (default is charge_to_self, which never reaches this pool at all). Spread back across every PRODUCTIVE group weighted by labour cost, else by asset burden (the code also has an equal-split fallback, but it is unreachable - a group only receives a share if it has productive labour or asset cost) - see each group''s own non_productive_cost node for its resulting share. Which specific groups paid into this pool is not exposed on the output_contract beyond the pure_support_groups list (see the dedicated pure-support nodes) - a mixed unit under spread_as_overhead also pays in but is not separately listed.",
      brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (distribute_non_productive_cost, ~L689)",
      last_verified_against: "Session 13, calculation trace Business Outcome Non-Productive Distribution extension",
      source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
      implementation_status: "live_verified_field",
      inputs: pure_support_input_ids,
      resolve: () => safeNumber(pool_total),
    },
  ];
}

export function buildBusinessOutcomePureSupportGroupNodes(live) {
  const pure_support_groups = Array.isArray(live?.business_outcome?.pure_support_groups)
    ? live.business_outcome.pure_support_groups
    : [];

  return pure_support_groups.flatMap((entry) => {
    const group_id = entry?.group_id;
    if (!group_id) {
      return [];
    }

    return [
      {
        node_id: `business_outcome.non_productive_distribution.pure_support.${group_id}`,
        display_label: `${entry.group_name || group_id} - Pure-Support Unit Own Cost (Business Outcome)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "This working unit has zero productive labour and zero productive asset cost assigned - it never gets a row of its own in build_labour_sources/build_asset_sources, so without this tracking it would be architecturally invisible downstream. Its own (undistributed) non-productive cost, always pooled and spread across productive groups (see business_outcome.non_productive_distribution.pool).",
        brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (distribute_non_productive_cost)",
        last_verified_against: "Session 13, calculation trace Business Outcome Non-Productive Distribution extension",
        source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
        implementation_status: "live_verified_field",
        inputs: [`cost_allocation.group.${group_id}.total_group_cost`],
        resolve: () => safeNumber(entry.own_non_productive_cost),
      },
    ];
  });
}

export function buildBusinessOutcomeGroupNonProductiveCostNodes(live) {
  const group_real_capacity = Array.isArray(live?.business_outcome?.real_capacity?.group_real_capacity)
    ? live.business_outcome.real_capacity.group_real_capacity
    : [];

  return group_real_capacity.flatMap((g) => {
    const group_id = g?.group_id;
    if (!group_id) {
      return [];
    }

    return [
      {
        node_id: `business_outcome.group.${group_id}.non_productive_cost`,
        display_label: `${g.group_name || group_id} - Non-Productive Cost Share (Business Outcome)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "This group''s own non-productive cost, from ONE of two paths depending on that group''s own status and policy (not distinguishable from the exposed data): (a) this group is itself pure-support or a spread_as_overhead mixed unit, and this is its share of business_outcome.non_productive_distribution.pool by labour/asset-cost weight; or (b) this group is a charge_to_self mixed unit, and this is simply its own raw non-productive cost, never pooled. Whichever path produced it, this value is added directly into the group''s true_cost inside BOTH the View A and View B real_capacity cascades - shared by both, computed once.",
        brief_reference: "hooks/useBusinessOutcomePerSourceRevenue.js (distribute_non_productive_cost)",
        last_verified_against: "Session 13, calculation trace Business Outcome Non-Productive Distribution extension",
        source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
        implementation_status: "live_verified_field",
        inputs: [],
        resolve: () => safeNumber(g.non_productive_cost),
      },
    ];
  });
}