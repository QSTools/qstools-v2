// Mirra v6.1 - Calculation Trace - Dry Hire (F-7) Nodes
// F-7 step 2 (2026-10-27). Dry hire shipped 2026-10-26 (commit 17a5957) without
// trace nodes; the 2026-10-16 definition of done says a calculated figure is not
// done until it has one. An asset assignment ticked "earns without operator" is
// hired out with no operator: Cost Allocation adds its hours to the group's
// recovery hours, Business Outcome bills it at its own Rate Builder price x its
// own hours.
//
// Nodes (every working group that has an id; the value is 0 when nothing is ticked):
//   cost_allocation.group.<id>.earns_without_operator_hours
//       sum of the ticked assignments' asset hours (costAllocationGroupCostBuilder.js)
//   cost_allocation.group.<id>.operated_recovery_hours
//       recovery hours less dry hire (asset-driven groups) - the hours the group's
//       labour can actually cover; equals group_recovery_hours for other drivers
//   business_outcome.group.<id>.dry_hire_revenue
//       sum of the group's ticked asset rows' modelled revenue; null (blank) when
//       a ticked row has no Rate Builder price, never a silent low number
//
// DISPLAY / EXPLAIN nodes: none of these feeds a total. The ticked rows' revenue is
// already inside asset_source.<g>.<asset>.modelled_revenue and the group totals.
// Baseline only (no Business Modelling overrides), like the other BO nodes.

// Null/undefined stay null (same rule as idleCostTraceNodes.js).
function safeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function unique(list) {
  return [...new Set(list)];
}

function asset_node_ids(assignments, only_ticked) {
  return unique(
    (Array.isArray(assignments) ? assignments : [])
      .filter((a) => !only_ticked || a?.earns_without_operator === true)
      .map((a) => a?.asset_id)
      .filter(Boolean)
      .map((id) => `cost_allocation.asset.${id}`)
  );
}

function labour_node_ids(assignments) {
  return unique(
    (Array.isArray(assignments) ? assignments : [])
      .map((a) => a?.staff_type_id)
      .filter(Boolean)
      .map((id) => `cost_allocation.labour_type.${id}`)
  );
}

export function buildDryHireCostAllocationNodes(live) {
  const rows = Array.isArray(live?.cost_allocation?.operational_group_cost_rows)
    ? live.cost_allocation.operational_group_cost_rows
    : [];

  return rows.flatMap((row) => {
    const group_id = row?.group_id;
    if (!group_id) {
      return [];
    }
    const label = row.group_name || group_id;
    const common = {
      module_name: "cost-allocation",
      is_root_input: false,
      value_format: "number",
      brief_reference: "DRY_HIRE_UNATTENDED_ASSETS_FUTURE_BUILD_BRIEF Addendum 1; COST_ALLOCATION_BRIEF Addendum 3",
      last_verified_against: "F-7 step 2, dry hire trace nodes (2026-10-27)",
      source_file: "lib/calculations/cost-allocation/costAllocationGroupCostBuilder.js",
      implementation_status: "live_verified_field",
    };

    return [
      {
        ...common,
        node_id: `cost_allocation.group.${group_id}.earns_without_operator_hours`,
        display_label: `${label} - Dry Hire Hours (Cost Allocation)`,
        formula_text:
          "earns_without_operator_hours = sum of asset_hours over this group's asset assignments ticked 'earns without operator' (dry hire). These hours are ADDED to the group's recovery hours when the group recovers on asset hours (asset_driven_recovery_hours = operated_recovery_hours + earns_without_operator_hours), and are left out of required hours, the labour cap, the coverage gap and idle labour. 0 when nothing is ticked. A ticked row in a group that does not recover on asset hours still shows its hours here but they are not added to the recovery hours.",
        inputs: asset_node_ids(row.asset_group_assignments, true),
        resolve: () => safeNumber(row.earns_without_operator_hours),
      },
      {
        ...common,
        node_id: `cost_allocation.group.${group_id}.operated_recovery_hours`,
        display_label: `${label} - Operated Recovery Hours (Cost Allocation)`,
        formula_text:
          "operated_recovery_hours = group recovery hours less dry-hire hours, for asset-driven groups: the lesser of the hours the operated assets need (longest asset, or the sum when they run one after another) and the assigned labour hours (labour cap), or the longest operated asset when the group has no labour. For groups on another recovery driver it equals group_recovery_hours. Labour utilisation divides this figure by assigned labour hours.",
        inputs: unique([...asset_node_ids(row.asset_group_assignments, false), ...labour_node_ids(row.labour_group_assignments)]),
        resolve: () => safeNumber(row.operated_recovery_hours),
      },
    ];
  });
}

export function buildDryHireBusinessOutcomeNodes(live) {
  const asset_groups = Array.isArray(live?.business_outcome?.asset_groups)
    ? live.business_outcome.asset_groups
    : [];

  return asset_groups.flatMap((group) => {
    const group_id = group?.group_id;
    if (!group_id) {
      return [];
    }
    // Only rows the asset-source builder also turns into a node (asset_id and group_id),
    // so every edge resolves.
    const rows = (Array.isArray(group.assets) ? group.assets : []).filter(
      (r) => r?.asset_id && r?.group_id
    );
    const ticked = rows.filter((r) => r.earns_without_operator === true);
    const label = group.group_name || group_id;

    return [
      {
        node_id: `business_outcome.group.${group_id}.dry_hire_revenue`,
        display_label: `${label} - Dry Hire Revenue (Business Outcome)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency",
        formula_text:
          "dry_hire_revenue = sum of modelled_revenue over this group's asset rows ticked 'earns without operator'. Each ticked row earns its Rate Builder per-asset price x its OWN hours (no labour cap, no share of the group blended rate). A ticked row with no Rate Builder per-asset price earns nothing and is flagged: the figure is then blank, not a low number. 0 when nothing is ticked. EXPLAIN ONLY - already inside the group's modelled revenue and net profit, never added to a total.",
        brief_reference: "BUSINESS_OUTCOME_BRIEF Addendum 3 (F-7); DRY_HIRE_UNATTENDED_ASSETS_FUTURE_BUILD_BRIEF Addendum 1",
        last_verified_against: "F-7 step 2, dry hire trace nodes (2026-10-27)",
        source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
        implementation_status: "live_verified_field",
        inputs: ticked.map((r) => `business_outcome.asset_source.${r.group_id}.${r.asset_id}.modelled_revenue`),
        resolve: () => {
          if (ticked.length === 0) {
            return 0;
          }
          let total = 0;
          for (const r of ticked) {
            const v = safeNumber(r.modelled_revenue);
            if (v === null) {
              return null;
            }
            total += v;
          }
          return Math.round(total * 100) / 100;
        },
      },
    ];
  });
}
