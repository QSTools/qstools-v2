// lib/calculations/wholeBusinessGroupInputs.js
// R3 slice 5 batch B (Business Modelling brief Addendum 42 items 1 to 4).
// Pure, no hook imports. ONE shared function builds the per-group rows and the whole-business result, and BOTH the Business Modelling page
// and the whole-business trace nodes call it, so the page and the nodes cannot drift apart (owner decision, Addendum 42 item 3).
//
// Inputs are the three live lists the page already reads:
//   cost_rows      Cost Allocation output_contract.operational_group_cost_rows   (seat hours = group_recovery_hours, group_cost_per_hour, total_group_cost)
//   recovery_rows  Cost Allocation output_contract.operational_group_recovery_rows (minimum_recoverable_rate_per_hour)
//   capacity_rows  Business Outcome real_capacity.group_real_capacity            (covered hours = group_recovery_hours, modelled_revenue, true_cost)
// Revenue comes from calculateIndependentGroupBreakeven (the page's own breakeven result), NOT from the business_outcome.group.<id>.modelled_revenue
// node: on scenario_b that node is 0 for G03 while the page treats G03 as missing revenue (Addendum 40 F1).

import { calculateIndependentGroupBreakeven } from "./businessModellingIndependentCalculations.js";
import { calculateWholeBusinessRateGap } from "./wholeBusinessRateGap.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

// Item 18 (BM Addendum 50): a group's break-even floor = true_cost / covered hours, rounded ONCE to the cent. calculateIndependentGroupBreakeven gives the same
// figure only to within a cent (it adds two separately rounded numbers), and a floor must not move with the revenue figure, so the division is done here directly.
// Null (never 0) when the group has no covered hours or no numeric true_cost.
export function calculateGroupBreakevenRate(capacity) {
  const hours = Number(capacity?.group_recovery_hours);
  const raw = capacity?.true_cost;
  if (raw === null || raw === undefined || raw === "") return null;
  const cost = Number(raw);
  if (!Number.isFinite(cost) || !Number.isFinite(hours) || !(hours > 0)) return null;
  return Math.round((cost / hours) * 100) / 100;
}

// One row per Cost Allocation group row, in the same shape the page used before batch B (moved here unchanged).
export function buildWholeBusinessGroupRows({ cost_rows, recovery_rows, capacity_rows }) {
  const min_rate_by_id = new Map(asArray(recovery_rows).filter((r) => r).map((r) => [r.group_id, r.minimum_recoverable_rate_per_hour]));
  const capacity_by_id = new Map(asArray(capacity_rows).filter((g) => g).map((g) => [g.group_id, g]));

  return asArray(cost_rows)
    .filter((cost) => cost)
    .map((cost) => {
      const hours = Number(cost.group_recovery_hours) || 0;
      const capacity = capacity_by_id.get(cost.group_id);
      const charged = capacity ? calculateIndependentGroupBreakeven({ group: capacity }) : null;
      return {
        group_id: cost.group_id,
        group_name: cost.group_name,
        hours,
        has_hours: hours > 0,
        total_group_cost: Number(cost.total_group_cost) || 0,
        min_rate: min_rate_by_id.get(cost.group_id),
        full_cost_rate: cost.group_cost_per_hour,
        revenue_rate: charged && charged.available ? charged.current_rate_per_hour : null,
        covered_hours: capacity ? capacity.group_recovery_hours : null,
        modelled_revenue: charged && charged.available ? capacity.modelled_revenue : null,
        // Item 18 floor (BM Addendum 50): the group's break-even rate = true_cost / covered hours, from the same capacity row and the same
        // capacity row as revenue_rate. true_cost already holds the group's share of the spread support cost.
        true_cost: charged && charged.available ? capacity.true_cost : null,
        breakeven_rate: charged && charged.available ? calculateGroupBreakevenRate(capacity) : null,
      };
    });
}

// The per-group list the whole-business helper takes (calculateWholeBusinessRateGap).
export function buildWholeBusinessHelperGroups(rows) {
  return asArray(rows).map((r) => ({
    group_id: r.group_id,
    group_name: r.group_name,
    seat_hours: r.hours,
    min_rate: r.min_rate,
    full_cost_rate: r.full_cost_rate,
    modelled_revenue: r.modelled_revenue,
    covered_hours: r.covered_hours,
    true_cost: r.true_cost,
  }));
}

// rows (for the table) and whole (for the Whole business row, the gap line and the trace nodes), from the three live lists.
export function calculateWholeBusinessFromContracts({ cost_rows, recovery_rows, capacity_rows }) {
  const rows = buildWholeBusinessGroupRows({ cost_rows, recovery_rows, capacity_rows });
  const whole = calculateWholeBusinessRateGap(buildWholeBusinessHelperGroups(rows));
  return { rows, whole };
}
