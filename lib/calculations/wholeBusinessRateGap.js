// lib/calculations/wholeBusinessRateGap.js
// R3 slice 5 items 17 and 19, batch A (Business Modelling brief Addendum 37 items 1, 2 and 5).
// Pure helper, no imports: the whole-business (earning groups) group minimum rate, full cost rate and revenue per SEAT hour, and the two gaps.
// The Business Modelling page calls it, and the batch B trace nodes will call the same function, so page and node cannot drift apart.
//
// Rules (owner decisions, Addendum 37):
//   - earning groups only: seat_hours above 0 (a group with no seat hours is a support group and is ignored, not listed as excluded)
//   - an earning group is INCLUDED only if its minimum rate, full cost rate and modelled revenue are all numeric; otherwise it is EXCLUDED from
//     all three averages and returned with its id and reason. A missing figure is never treated as 0.
//   - each rate is a seat-hours-weighted mean: group minimum rate = sum(rate x seat hours) / sum(seat hours); full cost rate likewise;
//     revenue per seat hour = sum(modelled revenue) / sum(seat hours)
//   - round once, to the cent, at the end; the two gaps are plain subtraction of the rounded rates (revenue minus minimum, revenue minus full cost)
//   - support-group cost is not an input and is not in any figure
// group = { group_id, group_name, seat_hours, min_rate, full_cost_rate, modelled_revenue, covered_hours }
// covered_hours is only used for the total and the covered_differs flag; seat hours are the denominator of all three rates.

export const COVERED_DIFFERS_TOLERANCE_HOURS = 0.1;

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toCent(value) {
  return Math.round(value * 100) / 100;
}

export function calculateWholeBusinessRateGap(groups) {
  const list = Array.isArray(groups) ? groups : [];
  const included = [];
  const excluded = [];

  list.forEach((group) => {
    const seat_hours = numberOrNull(group?.seat_hours);
    if (seat_hours === null || !(seat_hours > 0)) {
      return;
    }
    const min_rate = numberOrNull(group.min_rate);
    const full_cost_rate = numberOrNull(group.full_cost_rate);
    const modelled_revenue = numberOrNull(group.modelled_revenue);
    const missing = [];
    if (min_rate === null) missing.push("group minimum rate");
    if (full_cost_rate === null) missing.push("full cost rate");
    if (modelled_revenue === null) missing.push("revenue");
    if (missing.length > 0) {
      excluded.push({ group_id: group.group_id, group_name: group.group_name, reason: `missing ${missing.join(", ")}` });
      return;
    }
    included.push({
      group_id: group.group_id,
      seat_hours,
      covered_hours: numberOrNull(group.covered_hours),
      min_rate,
      full_cost_rate,
      modelled_revenue,
    });
  });

  const total_seat_hours = included.reduce((sum, g) => sum + g.seat_hours, 0);
  const total_covered_hours = included.reduce((sum, g) => sum + (g.covered_hours ?? 0), 0);
  const covered_differs = included.some(
    (g) => g.covered_hours === null || Math.abs(g.covered_hours - g.seat_hours) > COVERED_DIFFERS_TOLERANCE_HOURS
  );
  const base = {
    included_group_ids: included.map((g) => g.group_id),
    excluded_groups: excluded,
    total_seat_hours,
    total_covered_hours,
    covered_differs,
  };

  if (included.length === 0 || !(total_seat_hours > 0)) {
    return { ...base, available: false, min_rate: null, full_cost_rate: null, revenue_per_seat_hour: null, gap_to_min_rate: null, gap_to_full_cost_rate: null };
  }

  const min_rate = toCent(included.reduce((sum, g) => sum + g.min_rate * g.seat_hours, 0) / total_seat_hours);
  const full_cost_rate = toCent(included.reduce((sum, g) => sum + g.full_cost_rate * g.seat_hours, 0) / total_seat_hours);
  const revenue_per_seat_hour = toCent(included.reduce((sum, g) => sum + g.modelled_revenue, 0) / total_seat_hours);

  return {
    ...base,
    available: true,
    min_rate,
    full_cost_rate,
    revenue_per_seat_hour,
    gap_to_min_rate: toCent(revenue_per_seat_hour - min_rate),
    gap_to_full_cost_rate: toCent(revenue_per_seat_hour - full_cost_rate),
  };
}
