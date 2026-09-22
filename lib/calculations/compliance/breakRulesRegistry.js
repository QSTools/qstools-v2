import { get_nz_break_entitlement } from "@/lib/calculations/compliance/breakRules/nz";

// Jurisdiction code -> break entitlement rule function. Each rule function
// takes a work period in hours and returns
// { paid_rest_minutes, unpaid_meal_minutes }.
// Add a new jurisdiction by adding a new rule file and one entry here -
// nothing in Labour's own calculation should need to change. NZ is a
// single-country lookup; a future US entry would need country+state,
// and AU would need country+award/industry - design the key accordingly
// when those are added, not before.
const BREAK_RULE_REGISTRY = {
  NZ: get_nz_break_entitlement,
};

const DEFAULT_JURISDICTION = "NZ";

export function get_break_entitlement(work_period_hours, jurisdiction) {
  const code = jurisdiction || DEFAULT_JURISDICTION;
  const rule_fn =
    BREAK_RULE_REGISTRY[code] || BREAK_RULE_REGISTRY[DEFAULT_JURISDICTION];
  return rule_fn(work_period_hours);
}