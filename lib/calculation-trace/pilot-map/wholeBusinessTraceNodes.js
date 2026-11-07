// Mirra v6.1 - Calculation Trace - Whole business nodes (R3 slice 5 batch B, Business Modelling brief Addenda 37 item 3 and 42 items 1 to 4)
// Nodes for every figure in the Whole business (earning groups) row on the Business Modelling page:
//   cost_allocation.group.<id>.group_recovery_hours           seat hours, one per group with seat hours above 0 (G03 on scenario_b included)
//   business_modelling.whole_business.min_rate                group minimum rate, seat-hours-weighted
//   business_modelling.whole_business.full_cost_rate          full cost rate, seat-hours-weighted
//   business_modelling.whole_business.revenue_per_seat_hour   total modelled revenue / total seat hours
//   business_modelling.whole_business.gap_to_min_rate         revenue per hour minus group minimum rate (displayed, rounded rates)
//   business_modelling.whole_business.gap_to_full_cost_rate   revenue per hour minus full cost rate (displayed, rounded rates)
//   business_modelling.whole_business.total_seat_hours        sum of seat hours of the INCLUDED groups
//   business_modelling.whole_business.total_covered_hours     sum of covered hours of the INCLUDED groups
// Every whole-business node resolves from calculateWholeBusinessFromContracts, the SAME function the page calls, fed from the same three live
// lists, so node and page cannot drift apart. Nothing is recalculated here. The whole-business nodes exist only when the page shows the row
// (whole.available). Edges are drawn only from INCLUDED groups, so a group left out for a missing figure (G03 on scenario_b) feeds nothing.
// total_covered_hours is a BOUNDARY node with no inputs: covered hours is a Business Outcome field with no per-group node, and adding one is
// not part of batch B (Addendum 42 item 4).

import { calculateWholeBusinessFromContracts } from "../../calculations/wholeBusinessGroupInputs.js";

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

function readLists(live) {
  return {
    cost_rows: asArray(live?.cost_allocation?.operational_group_cost_rows),
    recovery_rows: asArray(live?.cost_allocation?.operational_group_recovery_rows),
    capacity_rows: asArray(live?.business_outcome?.real_capacity?.group_real_capacity),
  };
}

export function buildGroupSeatHoursNodes(live) {
  return readLists(live).cost_rows.flatMap((cost) => {
    const group_id = cost?.group_id;
    if (!group_id) {
      return [];
    }
    const hours = safeNumber(cost.group_recovery_hours);
    if (hours === null || !(hours > 0)) {
      return [];
    }
    const label = cost.group_name || group_id;
    return [
      {
        node_id: `cost_allocation.group.${group_id}.group_recovery_hours`,
        display_label: `${label} - Recovery (Seat) Hours`,
        module_name: "cost-allocation",
        is_root_input: false,
        value_format: "number",
        formula_text:
          "group_recovery_hours = the paid-for seat hours of the group, as Cost Allocation divides its group costs by (operational_group_cost_rows). One node per group with seat hours above 0. BOUNDARY node traced via the hook's known output: the hours come from the group's assignments in Cost Allocation. Shown on the Business Modelling page as Recovery hours, and the weight of every whole-business rate.",
        brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 37 item 3 and 42 items 1 to 4",
        last_verified_against: "R3 slice 5 batch B: unit test s5_whole_business_nodes; live check against the Business Modelling page",
        source_file: "hooks/useCostAllocation.js",
        implementation_status: "live_traced_via_hook",
        inputs: [],
        resolve: () => hours,
      },
    ];
  });
}

export function buildWholeBusinessNodes(live) {
  const { whole } = calculateWholeBusinessFromContracts(readLists(live));
  if (!whole || !whole.available) {
    return [];
  }
  const included = asArray(whole.included_group_ids).filter(Boolean);
  const hours_ids = included.map((id) => `cost_allocation.group.${id}.group_recovery_hours`);
  const min_ids = included.map((id) => `cost_allocation.group.${id}.minimum_recoverable_rate_per_hour`);
  const full_ids = included.map((id) => `cost_allocation.group.${id}.group_cost_per_hour`);
  const revenue_ids = included.map((id) => `business_outcome.group.${id}.revenue_per_hour`);
  const id = (field) => `business_modelling.whole_business.${field}`;

  const base = {
    module_name: "business-modelling",
    is_root_input: false,
    brief_reference: "BUSINESS_MODELLING_BRIEF Addenda 37 and 42",
    last_verified_against: "R3 slice 5 batch B: unit test s5_whole_business_nodes; live check against the Business Modelling page",
    source_file: "lib/calculations/wholeBusinessRateGap.js",
    implementation_status: "live_verified_field",
  };
  const scope = "Earning groups only (seat hours above 0); a group with a missing figure is left out of all three averages and feeds nothing here; support-group cost is not in it. Shown in the Whole business row on the Business Modelling page.";

  return [
    {
      ...base,
      node_id: id("min_rate"),
      display_label: "Whole Business - Group Minimum Rate Per Seat Hour",
      value_format: "currency_per_unit",
      formula_text: `min_rate = sum(group minimum rate x seat hours) / sum(seat hours) over the included groups, rounded once to the cent (calculateWholeBusinessRateGap). ${scope}`,
      inputs: [...min_ids, ...hours_ids],
      resolve: () => safeNumber(whole.min_rate),
    },
    {
      ...base,
      node_id: id("full_cost_rate"),
      display_label: "Whole Business - Full Cost Rate Per Seat Hour",
      value_format: "currency_per_unit",
      formula_text: `full_cost_rate = sum(group cost per hour x seat hours) / sum(seat hours) over the included groups, rounded once to the cent. The group cost per hour includes non-productive cost assigned to the group. ${scope}`,
      inputs: [...full_ids, ...hours_ids],
      resolve: () => safeNumber(whole.full_cost_rate),
    },
    {
      ...base,
      node_id: id("revenue_per_seat_hour"),
      display_label: "Whole Business - Revenue Per Seat Hour (Modelled)",
      value_format: "currency_per_unit",
      formula_text: `revenue_per_seat_hour = sum(group modelled revenue) / sum(seat hours) over the included groups, rounded once to the cent. The inputs drawn are each group's revenue_per_hour node, whose source is the same group modelled revenue; the whole-business figure divides that revenue by seat hours, not by covered hours. ${scope}`,
      inputs: [...revenue_ids, ...hours_ids],
      resolve: () => safeNumber(whole.revenue_per_seat_hour),
    },
    {
      ...base,
      node_id: id("gap_to_min_rate"),
      display_label: "Whole Business - Revenue Per Hour Minus Group Minimum Rate",
      value_format: "currency",
      formula_text: "gap_to_min_rate = revenue_per_seat_hour minus min_rate, each as displayed (rounded to the cent), so the page adds up to the cent. Arithmetic only: a positive number is above the group minimum rate, a negative number is below it.",
      inputs: [id("revenue_per_seat_hour"), id("min_rate")],
      resolve: () => safeNumber(whole.gap_to_min_rate),
    },
    {
      ...base,
      node_id: id("gap_to_full_cost_rate"),
      display_label: "Whole Business - Revenue Per Hour Minus Full Cost Rate",
      value_format: "currency",
      formula_text: "gap_to_full_cost_rate = revenue_per_seat_hour minus full_cost_rate, each as displayed (rounded to the cent). Arithmetic only: a positive number is above the full cost rate, a negative number is below it.",
      inputs: [id("revenue_per_seat_hour"), id("full_cost_rate")],
      resolve: () => safeNumber(whole.gap_to_full_cost_rate),
    },
    {
      ...base,
      node_id: id("total_seat_hours"),
      display_label: "Whole Business - Total Recovery (Seat) Hours",
      value_format: "number",
      formula_text: `total_seat_hours = sum of the seat hours of the included groups (the denominator of all three whole-business rates). ${scope}`,
      inputs: [...hours_ids],
      resolve: () => safeNumber(whole.total_seat_hours),
    },
    {
      ...base,
      node_id: id("total_covered_hours"),
      display_label: "Whole Business - Total Covered Hours",
      value_format: "number",
      formula_text: `total_covered_hours = sum of the covered hours of the included groups (Business Outcome real_capacity group_recovery_hours: the hours labour can cover in an asset-hours group, plus dry hire hours). BOUNDARY node with no inputs: covered hours has no per-group node. It can be lower than total_seat_hours; the page says so when any group differs by more than 0.1 hours. ${scope}`,
      inputs: [],
      resolve: () => safeNumber(whole.total_covered_hours),
    },
  ];
}

export function buildWholeBusinessTraceNodes(live) {
  return [...buildGroupSeatHoursNodes(live), ...buildWholeBusinessNodes(live)];
}
