// lib/calculations/scenarioOverheadLine.js
//
// R3 slice 4, batch C2a (Business Modelling brief, Addendum 26 items 2 and 3). PURE: no imports, no hooks, no storage.
// A NON-PRODUCTIVE scratch add (an office hire, an idle vehicle) is carried by the whole productive part of the business, weighted by recovery hours.
// Cost Allocation already spreads overhead that way (costAllocationOverheadPoolBuilder.js, owner decision 2026-09-29), so the add's annual cost enters as
// ONE extra custom overhead line on a COPY of the General Overheads state. No new maths: the real calculation, summaries and Cost Allocation then carry it.
// It is injected AFTER the per-category nudge (so a nudge never scales it) and the saved state is never changed.
//
// The line is built so the real selectors cannot misroute it:
//   - fixed label with no user text (a name containing "fuel", "registration", "tyre", "insurance" or "interest" would be sent to an asset pool or counted as interest),
//   - explicit system allocation override "business_overhead" (the override wins over the name rules),
//   - category other_unallocated (a custom line's default), so it is not mixed into a real category total.
// With nothing to add the very same state object comes back and nothing is built.

export const SCENARIO_OVERHEAD_ID = "scenario_added_cost";
export const SCENARIO_OVERHEAD_LABEL = "Scenario: non-productive adds";
export const SCENARIO_OVERHEAD_ALLOCATION_TYPE = "business_overhead";
export const SCENARIO_OVERHEAD_CATEGORY = "other_unallocated";

export function inject_scenario_overhead({ overhead_state, amount }) {
  const value = Number(amount);
  if (!overhead_state || typeof overhead_state !== "object" || !Number.isFinite(value) || value <= 0) {
    return { state: overhead_state, applied: false, amount: 0 };
  }
  const cents = Math.round(value * 100) / 100;
  const existing_items = Array.isArray(overhead_state.custom_overhead_items) ? overhead_state.custom_overhead_items : [];
  const items = existing_items.filter((item) => !item || item.custom_overhead_id !== SCENARIO_OVERHEAD_ID);
  items.push({
    custom_overhead_id: SCENARIO_OVERHEAD_ID,
    custom_overhead_name: SCENARIO_OVERHEAD_LABEL,
    custom_overhead_amount: cents,
    overhead_category_key: SCENARIO_OVERHEAD_CATEGORY,
    is_scenario: true,
  });
  // Every field not touched here is carried over by the spread (project instruction 6b: never rebuild field by field).
  const state = {
    ...overhead_state,
    custom_overhead_items: items,
    system_allocation_overrides: {
      ...(overhead_state.system_allocation_overrides ?? {}),
      [SCENARIO_OVERHEAD_ID]: SCENARIO_OVERHEAD_ALLOCATION_TYPE,
    },
  };
  return { state, applied: true, amount: cents };
}
