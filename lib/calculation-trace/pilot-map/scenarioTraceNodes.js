// Mirra v6.1 - Calculation Trace - Scenario added cost (R3 slice 4 batch C3b, Business Modelling brief Addendum 31)
// One node for the figure the Cost Allocation page shows in its scenario-cost line: the annual cost of every NON-productive scenario add (office hire, idle
// vehicle), which batch C2a injects into General Overheads as one custom line, after the nudge. The value is the General Overheads hook's own
// scenario_overhead_cost (the same amount that line carries); this file never recalculates it.
//
// ROOT INPUT and EXPLAIN-ONLY: the amount is already inside general_overheads.total_general_overheads (and so inside every total downstream), so this node
// has no inputs and feeds no total (no edge is drawn to a total, which would imply a second derivation).
// The node exists ONLY while Model mode holds a non-productive add (amount above zero). With Model mode off, an empty scenario, or only productive adds,
// nothing is emitted, so the standing trace totals do not move. A null or missing amount emits nothing (never a silent 0).

function safeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildScenarioAddedCostNodes(live) {
  const amount = safeNumber(live?.scenario_added_cost);
  if (amount === null || !(amount > 0)) {
    return [];
  }

  return [
    {
      node_id: "general_overheads.scenario_added_cost",
      display_label: "Scenario non-productive adds (General Overheads, Model mode)",
      module_name: "general-overheads",
      is_root_input: true,
      value_format: "currency",
      formula_text:
        "scenario_added_cost = sum of annual_cost over every NON-productive add in the Model mode scenario (staff and assets), summed in whole cents (scenarioAdds.js non_productive_total). It enters General Overheads as one custom line 'Scenario: non-productive adds' (category other_unallocated, allocation business_overhead) AFTER the percentage nudge, so a nudge never scales it, and Cost Allocation then spreads it across the working groups by recovery hours. Only present in Model mode with at least one non-productive add. EXPLAIN ONLY - already inside general_overheads.total_general_overheads and every total below it, never added to a total.",
      brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 26, 28 and 31",
      last_verified_against: "R3 slice 4 batch C3b (2026-11-04): unit test s4_cost_line; live check against the screen is C4",
      source_file: "hooks/useGeneralOverheads.js",
      implementation_status: "live_traced_via_hook",
      inputs: [],
      resolve: () => amount,
    },
  ];
}
