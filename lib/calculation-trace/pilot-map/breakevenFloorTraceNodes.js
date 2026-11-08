// Mirra v6.1 - Calculation Trace - Break-even floor nodes (R3 slice 5 item 18, Business Modelling brief Addendum 50)
// The floor is the BREAK-EVEN rate: a group's true cost (its own cost plus its share of the spread support cost) per hour (owner decision, Addendum 42 item 7).
//   business_outcome.group.<id>.breakeven_rate_per_hour             group floor = true_cost / covered hours, rounded once (calculateGroupBreakevenRate, the page's function)
//   business_modelling.whole_business.total_true_cost               sum of true_cost over the INCLUDED groups (boundary)
//   business_modelling.whole_business.breakeven_rate                total_true_cost / total seat hours, rounded once (owner decision, Addendum 50: seat hours)
//   business_modelling.whole_business.gap_to_breakeven_rate         revenue_per_seat_hour minus the displayed breakeven_rate
// Group nodes resolve from the same capacity row and function the page reads. The whole-business nodes resolve from calculateWholeBusinessFromContracts,
// the SAME function the page calls. Nothing is recalculated here. A node exists only where the page shows a number; a missing value emits nothing.
// The group floor and total_true_cost are BOUNDARY nodes: true_cost is a Business Outcome roll-up with no per-group node, so no edge is drawn
// to a node that does not hold it.

import { calculateIndependentGroupBreakeven } from "../../calculations/businessModellingIndependentCalculations.js";
import { calculateGroupBreakevenRate, calculateWholeBusinessFromContracts } from "../../calculations/wholeBusinessGroupInputs.js";

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

export function buildGroupBreakevenNodes(live) {
  return asArray(live?.business_outcome?.real_capacity?.group_real_capacity).flatMap((capacity) => {
    const group_id = capacity?.group_id;
    if (!group_id) {
      return [];
    }
    const result = calculateIndependentGroupBreakeven({ group: capacity });
    if (!result || !result.available) {
      return [];
    }
    const rate = calculateGroupBreakevenRate(capacity);
    if (rate === null) {
      return [];
    }
    const label = capacity.group_name || group_id;
    return [
      {
        node_id: `business_outcome.group.${group_id}.breakeven_rate_per_hour`,
        display_label: `${label} - Break-Even Rate Per Covered Hour (incl. share of support cost)`,
        module_name: "business-outcome",
        is_root_input: false,
        value_format: "currency_per_unit",
        formula_text:
          "breakeven_rate_per_hour = group true_cost / group covered hours, rounded once to the cent (calculateGroupBreakevenRate, fed by the Business Outcome real_capacity group row; the node exists where the group has covered hours). true_cost holds the group's own cost plus its share of the pure-support cost spread across the earning groups by seat hours (and any mixed-unit support cost under the spread_as_overhead policy), so this is higher than the group's own full cost rate. Covered hours can be lower than the seat hours Cost Allocation divides by; then this rate is per covered hour. BOUNDARY node: true_cost is a roll-up with no per-group node. This is the floor: the rate at which the group's revenue equals its true cost. Shown on the Business Modelling page as Break-even rate.",
        brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 42 item 7, 48, 49 and 50",
        last_verified_against: "R3 slice 5 item 18: unit test s5_breakeven_floor; live check against the Business Modelling page",
        source_file: "lib/calculations/businessModellingIndependentCalculations.js",
        implementation_status: "live_traced_via_hook",
        inputs: [],
        resolve: () => rate,
      },
    ];
  });
}

export function buildWholeBusinessBreakevenNodes(live) {
  const { whole } = calculateWholeBusinessFromContracts({
    cost_rows: asArray(live?.cost_allocation?.operational_group_cost_rows),
    recovery_rows: asArray(live?.cost_allocation?.operational_group_recovery_rows),
    capacity_rows: asArray(live?.business_outcome?.real_capacity?.group_real_capacity),
  });
  if (!whole || !whole.available || safeNumber(whole.breakeven_rate) === null) {
    return [];
  }
  const id = (field) => `business_modelling.whole_business.${field}`;
  const base = {
    module_name: "business-modelling",
    is_root_input: false,
    brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 42 item 7 and 50",
    last_verified_against: "R3 slice 5 item 18: unit test s5_breakeven_floor; live check against the Business Modelling page",
    source_file: "lib/calculations/wholeBusinessRateGap.js",
    implementation_status: "live_verified_field",
  };
  const scope = "Earning groups only (seat hours above 0); a group with a missing figure is left out and feeds nothing here; support-group cost is already inside the groups' true cost through the spread, so it is not added again.";
  return [
    {
      ...base,
      node_id: id("total_true_cost"),
      display_label: "Whole Business - Total True Cost (incl. spread support cost)",
      value_format: "currency",
      formula_text: `total_true_cost = sum of the Business Outcome true_cost of the included groups (each holds its own cost plus its share of the spread support cost). BOUNDARY node with no inputs: true_cost has no per-group node. ${scope}`,
      inputs: [],
      resolve: () => safeNumber(whole.total_true_cost),
    },
    {
      ...base,
      node_id: id("breakeven_rate"),
      display_label: "Whole Business - Break-Even Rate Per Seat Hour",
      value_format: "currency_per_unit",
      formula_text: `breakeven_rate = total_true_cost / total_seat_hours, rounded once to the cent. The denominator is SEAT hours, like the other three whole-business rates (owner decision, BM Addendum 50), so revenue per seat hour minus this rate is profit per seat hour. Where a group's covered hours are below its seat hours this can read lower than the seat-hours-weighted average of the group break-even rates, which are per covered hour. ${scope}`,
      inputs: [id("total_true_cost"), id("total_seat_hours")],
      resolve: () => safeNumber(whole.breakeven_rate),
    },
    {
      ...base,
      node_id: id("gap_to_breakeven_rate"),
      display_label: "Whole Business - Revenue Per Hour Minus Break-Even Rate",
      value_format: "currency",
      formula_text: "gap_to_breakeven_rate = revenue_per_seat_hour minus breakeven_rate, each as displayed (rounded to the cent). Arithmetic only: a positive number is above the break-even rate, a negative number is below it.",
      inputs: [id("revenue_per_seat_hour"), id("breakeven_rate")],
      resolve: () => safeNumber(whole.gap_to_breakeven_rate),
    },
  ];
}

export function buildBreakevenFloorTraceNodes(live) {
  return [...buildGroupBreakevenNodes(live), ...buildWholeBusinessBreakevenNodes(live)];
}
