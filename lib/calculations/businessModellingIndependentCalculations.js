// lib/calculations/businessModellingIndependentCalculations.js
//
// Business Modelling - INDEPENDENT breakeven & levers (S31 brief).
//
// Replaces the cascade-based functions in businessModellingLeverCalculations.js
// for all NEW modelling work. Per S31 Section 2 (locked): Business Modelling
// must not reference the retired cascade (apply_real_capacity /
// run_group_level_cascade) anywhere. Every function below evaluates ONE
// source against ONLY its own true_cost and its own driver quantity - never
// another group's numbers, never materials' numbers, never a business-wide
// total.
//
// businessModellingLeverCalculations.js is NOT deleted by this file - it is
// superseded. Existing callers should migrate to these functions; the old
// file can be removed once nothing references it (see S31 Section 4, the
// legacy "proportional fix" feature is retired outright, not migrated).

function to_number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round_currency(value) {
  return Math.round(to_number(value) * 100) / 100;
}

function safe_divide(numerator, denominator) {
  const bottom = to_number(denominator);
  return bottom === 0 ? 0 : to_number(numerator) / bottom;
}

// ---------------------------------------------------------------------
// OPERATING GROUP (labour/asset) - independent breakeven & rate lever
// ---------------------------------------------------------------------

// group = { group_id, group_name, modelled_revenue, true_cost, group_recovery_hours }
//
// Independent target: this group's OWN true_cost, divided by its OWN
// recovery hours. No other group, no materials, no business-wide total
// enters this calculation at any point.
export function calculateIndependentGroupBreakeven({ group }) {
  if (!group) {
    return {
      group_id: null,
      available: false,
      reason: "Group not found",
      required_rate_delta_per_hour: null,
      breakeven_rate_per_hour: null,
    };
  }

  const group_recovery_hours = to_number(group.group_recovery_hours);

  if (group_recovery_hours <= 0) {
    return {
      group_id: group.group_id,
      available: false,
      reason:
        "This group has no recovery hours recorded - an independent rate cannot be calculated for it",
      required_rate_delta_per_hour: null,
      breakeven_rate_per_hour: null,
    };
  }

  const modelled_revenue = to_number(group.modelled_revenue);
  const true_cost = to_number(group.true_cost);

  const independent_target_revenue = true_cost;
  const current_net_profit = round_currency(modelled_revenue - true_cost);
  const required_revenue_delta = round_currency(true_cost - modelled_revenue);
  const required_rate_delta_per_hour = round_currency(
    safe_divide(required_revenue_delta, group_recovery_hours)
  );
  const current_rate_per_hour = round_currency(
    safe_divide(modelled_revenue, group_recovery_hours)
  );
  const breakeven_rate_per_hour = round_currency(
    current_rate_per_hour + required_rate_delta_per_hour
  );

  return {
    group_id: group.group_id,
    available: true,
    independent_target_revenue,
    current_net_profit,
    is_at_or_above_breakeven: current_net_profit >= 0,
    required_revenue_delta,
    required_rate_delta_per_hour,
    current_rate_per_hour,
    breakeven_rate_per_hour,
  };
}

export function applyIndependentGroupRateLever({ group, rate_delta_per_hour }) {
  if (!group) {
    return null;
  }

  const group_recovery_hours = to_number(group.group_recovery_hours);
  const revenue_delta = to_number(rate_delta_per_hour) * group_recovery_hours;
  const modelled_revenue = round_currency(
    to_number(group.modelled_revenue) + revenue_delta
  );
  const true_cost = to_number(group.true_cost);
  const net_profit = round_currency(modelled_revenue - true_cost);

  return {
    group_id: group.group_id,
    group_name: group.group_name,
    modelled_revenue,
    true_cost,
    net_profit,
    verdict: net_profit >= 0 ? "paying_its_way" : "being_carried",
  };
}

export function applyIndependentGroupRateLevers({
  groups,
  rate_delta_by_group_id = {},
}) {
  const applied_groups = (groups || []).map((g) => {
    const delta_per_hour = to_number(rate_delta_by_group_id[g.group_id]);
    return applyIndependentGroupRateLever({ group: g, rate_delta_per_hour: delta_per_hour });
  }).filter(Boolean);

  const total_modelled_revenue = round_currency(
    applied_groups.reduce((sum, g) => sum + g.modelled_revenue, 0)
  );
  const total_net_profit = round_currency(
    applied_groups.reduce((sum, g) => sum + g.net_profit, 0)
  );

  return {
    groups: applied_groups,
    total_modelled_revenue,
    total_net_profit,
  };
}

// ---------------------------------------------------------------------
// MATERIALS / COG - independent breakeven & markup-on-cost lever
// ---------------------------------------------------------------------
//
// materials = { cogs, true_cost, modelled_revenue }
//   - cogs: raw supplier cost (materials.build_up.cogs upstream, i.e.
//     materials.true_cost - residual_overhead, already computed by the
//     Business Outcome selector - pass that value in as `cogs`).
//   - true_cost: cogs + materials' attributed share of overhead. This is
//     the number materials must recover to independently break even.
//   - modelled_revenue: today's naive/residual revenue figure (or, once
//     a markup is applied, cogs * (1 + markup_percent / 100)).
//
// Markup is expressed on COGS specifically (user's stated mental model -
// a percentage added on top of what was paid to suppliers), not on
// true_cost.

export function calculateIndependentMaterialsBreakeven({ materials }) {
  if (!materials) {
    return { available: false, reason: "Materials data not found" };
  }

  const cogs = to_number(materials.cogs);
  const true_cost = to_number(materials.true_cost);
  const modelled_revenue = to_number(materials.modelled_revenue);

  if (cogs <= 0) {
    return {
      available: false,
      reason: "No materials/COGS cost recorded - a markup lever cannot be calculated",
    };
  }

  const current_net_profit = round_currency(modelled_revenue - true_cost);
  const current_markup_percent = round_currency(
    (safe_divide(modelled_revenue, cogs) - 1) * 100
  );

  const breakeven_markup_percent = round_currency(
    (safe_divide(true_cost, cogs) - 1) * 100
  );

  const required_markup_delta_percent = round_currency(
    breakeven_markup_percent - current_markup_percent
  );

  return {
    available: true,
    cogs,
    true_cost,
    independent_target_revenue: true_cost,
    current_net_profit,
    is_at_or_above_breakeven: current_net_profit >= 0,
    current_markup_percent,
    breakeven_markup_percent,
    required_markup_delta_percent,
  };
}

export function applyMaterialsMarkupLever({ materials, markup_percent }) {
  if (!materials) {
    return null;
  }

  const cogs = to_number(materials.cogs);
  const true_cost = to_number(materials.true_cost);
  const modelled_revenue = round_currency(cogs * (1 + to_number(markup_percent) / 100));
  const net_profit = round_currency(modelled_revenue - true_cost);

  return {
    cogs,
    true_cost,
    markup_percent: to_number(markup_percent),
    modelled_revenue,
    net_profit,
    verdict: net_profit >= 0 ? "paying_its_way" : "being_carried",
  };
}

// ---------------------------------------------------------------------
// GAUGE INPUT (S31 Section 9) - smoothed vs independent target ratio
// ---------------------------------------------------------------------
//
// smoothed_target_revenue: pass in per_source.headline_real_capacity's
// existing total (Business Outcome's already-verified cascade total) -
// this function does NOT recalculate that side, it only sums the
// independent side and forms the ratio.
export function calculateGaugeInput({
  groups,
  materials,
  smoothed_target_revenue,
}) {
  const independent_group_total = (groups || []).reduce(
    (sum, g) => sum + to_number(g.true_cost),
    0
  );
  const independent_materials_total = to_number(materials?.true_cost);
  const independent_target_revenue_total = round_currency(
    independent_group_total + independent_materials_total
  );

  const health_ratio =
    independent_target_revenue_total > 0
      ? round_currency(
          to_number(smoothed_target_revenue) / independent_target_revenue_total
        )
      : null;

  return {
    available: independent_target_revenue_total > 0,
    smoothed_target_revenue: to_number(smoothed_target_revenue),
    independent_target_revenue_total,
    health_ratio,
  };
}