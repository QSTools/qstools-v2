// Mirra v6.1 - Calculation Trace - Group rate gap nodes (R3 slice 5 batch 1b, Business Modelling brief Addenda 35 and 36)
// Two nodes per earning working group, for the figures the Business Modelling page shows beside the existing cost_allocation.group.<id>.group_cost_per_hour
// (the "full cost rate", which is reused, not rebuilt here):
//   cost_allocation.group.<id>.minimum_recoverable_rate_per_hour   the "group minimum rate" (Cost Allocation recovery rows)
//   business_outcome.group.<id>.revenue_per_hour                   the "revenue per hour" (Business Outcome real-capacity group row)
// Each node resolves from the SAME field the page reads. The revenue figure goes through calculateIndependentGroupBreakeven, the very function the page
// calls (it is pure and has no imports), so node and page cannot drift apart. Nothing is recalculated here.
//
// A node exists only where the page shows a number: the group has recovery hours above 0 (minimum rate) or the breakeven result is available (revenue).
// A missing, blank or non-numeric value emits nothing, never a silent 0 (null-preserving safeNumber).

import { calculateIndependentGroupBreakeven } from "../../calculations/businessModellingIndependentCalculations.js";

function safeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildGroupMinimumRateNodes(live) {
  const cost_rows = asArray(live?.cost_allocation?.operational_group_cost_rows);
  const recovery_by_id = new Map(
    asArray(live?.cost_allocation?.operational_group_recovery_rows)
      .filter((row) => row && row.group_id)
      .map((row) => [row.group_id, row])
  );

  return cost_rows.flatMap((cost) => {
    const group_id = cost?.group_id;
    if (!group_id) {
      return [];
    }
    const hours = safeNumber(cost.group_recovery_hours);
    if (hours === null || !(hours > 0)) {
      return [];
    }
    const rate = safeNumber(recovery_by_id.get(group_id)?.minimum_recoverable_rate_per_hour);
    if (rate === null) {
      return [];
    }
    const label = cost.group_name || group_id;

    return [
      {
        node_id: `cost_allocation.group.${group_id}.minimum_recoverable_rate_per_hour`,
        display_label: `${label} - Group Minimum Rate Per Recovery Hour`,
        module_name: "cost-allocation",
        is_root_input: false,
        value_format: "currency_per_unit",
        formula_text:
          "minimum_recoverable_rate_per_hour = labour_recovery_rate + asset_recovery_rate + overhead_recovery_rate, each the group's PRODUCTIVE cost of that kind divided by its group_recovery_hours (hooks/useCostAllocation.js corrected_recovery_rows, from the Cost Allocation group cost rows). Non-productive labour and asset cost assigned to the group is NOT in it (it is in group_cost_per_hour). BOUNDARY node traced via the hook's known output: no edge to total_group_cost, which also holds non-productive cost, so an edge would imply a derivation that does not exist. Shown on the Business Modelling page as Group minimum rate.",
        brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 8 item 1, 35 and 36",
        last_verified_against: "R3 slice 5 batch 1b (2026-11-04): unit test s5_group_rate_nodes; live check against the Business Modelling page",
        source_file: "hooks/useCostAllocation.js",
        implementation_status: "live_traced_via_hook",
        inputs: [],
        resolve: () => rate,
      },
    ];
  });
}

export function buildGroupRevenuePerHourNodes(live) {
  const capacity_rows = asArray(live?.business_outcome?.real_capacity?.group_real_capacity);
  const source_group_ids = new Set(
    [
      ...asArray(live?.business_outcome?.labour_groups).map((g) => g?.group_id),
      ...asArray(live?.business_outcome?.asset_groups).map((g) => g?.group_id),
    ].filter(Boolean)
  );

  return capacity_rows.flatMap((capacity) => {
    const group_id = capacity?.group_id;
    if (!group_id) {
      return [];
    }
    const charged = calculateIndependentGroupBreakeven({ group: capacity });
    if (!charged || !charged.available) {
      return [];
    }
    const rate = safeNumber(charged.current_rate_per_hour);
    if (rate === null) {
      return [];
    }
    const label = capacity.group_name || group_id;

    return [
      {
        node_id: `business_outcome.group.${group_id}.revenue_per_hour`,
        display_label: `${label} - Revenue Per Hour (Business Outcome, modelled)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency_per_unit",
        formula_text:
          "revenue_per_hour = group modelled revenue / group covered hours, to the cent (calculateIndependentGroupBreakeven current_rate_per_hour, fed by the Business Outcome real_capacity group row: modelled_revenue and group_recovery_hours). Covered hours are the hours labour can cover in an asset-hours group (plus dry hire hours), so they can be lower than the seat hours Cost Allocation divides by; in other groups they are the recovery hours. A blend when the group has several staff types. Modelled at the charged rates, not invoiced revenue. BOUNDARY node: the covered-hours step is not its own node; the one input is the group modelled_revenue roll-up when the group has one. Shown on the Business Modelling page as Revenue per hour.",
        brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 8 item 1, 35 and 36",
        last_verified_against: "R3 slice 5 batch 1b (2026-11-04): unit test s5_group_rate_nodes; live check against the Business Modelling page",
        source_file: "hooks/useBusinessOutcomePerSourceRevenue.js",
        implementation_status: "live_traced_via_hook",
        inputs: source_group_ids.has(group_id) ? [`business_outcome.group.${group_id}.modelled_revenue`] : [],
        resolve: () => rate,
      },
    ];
  });
}

export function buildGroupRateGapNodes(live) {
  return [...buildGroupMinimumRateNodes(live), ...buildGroupRevenuePerHourNodes(live)];
}