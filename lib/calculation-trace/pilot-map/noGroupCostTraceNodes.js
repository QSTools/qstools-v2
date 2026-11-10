// Mirra v6.1 - Calculation Trace - Cost in no working group (Business Modelling brief Addendum 64 finding 6a, Addendum 66 item 8)
// One node for the figure the Business Modelling page shows in its "Cost in no working group" sentence: Cost Allocation's own total_unassigned_cost,
// as published in its output contract (live.cost_allocation). This file never recalculates it; it only rounds to the cent through the same function
// the page uses (noGroupCostAmount), so node and page cannot drift apart.
//
// ROOT INPUT and EXPLAIN-ONLY: the amount is already carried by Cost Summary's total cost burden, so this node has no inputs and feeds no total
// (no edge is drawn, so no dangling endpoint is possible).
// The node exists ONLY while the amount is above zero cents. With nothing unassigned, nothing is emitted, so the standing trace totals do not move.
// A null or missing amount emits nothing (never a silent 0).

import { noGroupCostAmount } from "../../calculations/wholeBusinessNoGroupNote.js";

export function buildNoGroupCostTraceNodes(live) {
  const amount = noGroupCostAmount(live?.cost_allocation?.total_unassigned_cost);
  if (amount === null) {
    return [];
  }

  return [
    {
      node_id: "cost_allocation.total_unassigned_cost",
      display_label: "Cost in no working group (Cost Allocation)",
      module_name: "cost-allocation",
      is_root_input: true,
      value_format: "currency",
      formula_text:
        "total_unassigned_cost = Cost Allocation's own published total of the cost that sits in no working group (output contract total_unassigned_cost), rounded to the cent. It is the amount named in the sentence 'Cost in no working group' on the Business Modelling page, and it is outside the group cost shown on that page. Only present while the amount is above zero. EXPLAIN ONLY - Cost Summary already carries it in the total cost burden; it is never added to a total here.",
      brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 64 finding 6a and 66 item 8",
      last_verified_against: "unit test s9_no_group_note; live check against the Business Modelling page, Cost Allocation and Cost Summary",
      source_file: "hooks/useCostAllocation.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => amount,
    },
  ];
}
