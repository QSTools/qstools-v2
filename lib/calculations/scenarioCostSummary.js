// R3 slice 4 batch C3b (Business Modelling brief, Addendum 31). PURE summary for the scenario-cost line on the Cost Allocation page.
// It adds no maths of its own: the non-productive total comes from non_productive_total() in scenarioAdds.js, the SAME function that feeds the
// General Overheads line (batch C2a), so the line and the overhead cannot disagree. Productive adds are listed with their group (describe_add).
// Inputs are never mutated. With nothing to show it returns the same frozen empty result each call. ASCII only.

import { non_productive_total, is_valid_stored_add } from "./scenarioAdds.js";
import { describe_add } from "./scenarioAddForm.js";

const NO_ITEMS = Object.freeze([]);
const EMPTY_SUMMARY = Object.freeze({
  has_any: false,
  non_productive_total: 0,
  non_productive_count: 0,
  productive_items: NO_ITEMS,
});

// adds: the stored added[] entries. group_names: { group_id: group_name } (may be empty).
export function build_scenario_cost_summary(adds, group_names) {
  if (!Array.isArray(adds) || adds.length === 0) return EMPTY_SUMMARY;
  const valid = adds.filter((add) => is_valid_stored_add(add));
  if (valid.length === 0) return EMPTY_SUMMARY;

  const productive_items = valid
    .filter((add) => add.is_productive)
    .map((add) => ({
      id: add.id,
      kind: add.kind,
      name: add.name,
      description: describe_add(add, group_names),
    }));

  return {
    has_any: true,
    non_productive_total: non_productive_total(valid),
    non_productive_count: valid.filter((add) => !add.is_productive).length,
    productive_items: productive_items.length === 0 ? NO_ITEMS : productive_items,
  };
}
