// lib/selectors/businessModellingLeverSelectors.js
//
// Display shaping for Business Modelling's Card 1 + rate lever rows
// (S26 brief). Pure shaping only - the two lever calculations imported
// below own the actual maths (lib/calculations/businessModellingLeverCalculations.js).
//
// Card 1's headline reuses Business Outcome's own real
// headline_real_capacity figure directly (the same number already shown
// and trusted on /business-outcome) rather than a second calculation.

import {
  applyGroupRateLever,
  applyGroupRateLevers,
  calculateIsolatedGroupBreakeven,
  calculateProportionalGroupTargets,
} from "@/lib/calculations/businessModellingLeverCalculations";

function to_number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round_currency(value) {
  return Math.round(to_number(value) * 100) / 100;
}

export function buildLiveLeverHeadline(per_source, rate_target_by_group_id = {}) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return { available: false };
  }

  const group_real_capacity = per_source.real_capacity?.group_real_capacity || [];
  const materials_naive_revenue = per_source.materials?.real_capacity_naive_revenue ?? 0;
  const materials_true_cost = per_source.materials?.true_cost ?? 0;
  const unassigned_total = per_source.unassigned?.total ?? 0;
  const real_pnl_revenue = per_source.headline_real_capacity?.total_modelled_revenue ?? 0;

  const rate_delta_by_group_id = {};
  let has_any_target = false;

  group_real_capacity.forEach((g) => {
    const target_rate = rate_target_by_group_id[g.group_id];
    const has_target = target_rate !== undefined && target_rate !== null && target_rate !== "";
    if (!has_target || to_number(g.group_recovery_hours) <= 0) return;

    has_any_target = true;
    const current_rate = to_number(g.modelled_revenue) / to_number(g.group_recovery_hours);
    rate_delta_by_group_id[g.group_id] = to_number(target_rate) - current_rate;
  });

  if (!has_any_target) {
    const headline = per_source.headline_real_capacity;
    return {
      available: true,
      is_live: false,
      total_net_profit: headline.total_net_profit,
      total_modelled_revenue: real_pnl_revenue,
      real_pnl_revenue,
      all_sources: headline.all_sources,
      carried_count: headline.being_carried_count,
      total_source_count: headline.total_group_count,
      all_good: headline.all_good,
      shows_large_jump_warning: false,
      revenue_jump_percent: 0,
    };
  }

  const applied = applyGroupRateLevers({
    group_real_capacity,
    materials_naive_revenue,
    materials_true_cost,
    unassigned_total,
    rate_delta_by_group_id,
  });

  const all_sources = [
    ...applied.groups.map((g) => ({
      key: g.group_id,
      name: g.group_name,
      net_profit: g.final_net_profit,
      verdict: g.final_net_profit >= 0 ? "paying_its_way" : "being_carried",
    })),
    {
      key: "materials",
      name: "Materials / COG",
      net_profit: applied.materials_final_net_profit,
      verdict: applied.materials_final_net_profit >= 0 ? "paying_its_way" : "being_carried",
    },
  ];

  const carried_count = all_sources.filter((s) => s.verdict === "being_carried").length;

  const revenue_jump_percent =
    real_pnl_revenue > 0
      ? round_currency(
          ((applied.total_modelled_revenue - real_pnl_revenue) / real_pnl_revenue) * 100
        )
      : 0;

  return {
    available: true,
    is_live: true,
    total_net_profit: applied.total_net_profit,
    total_modelled_revenue: applied.total_modelled_revenue,
    real_pnl_revenue,
    all_sources,
    carried_count,
    total_source_count: all_sources.length,
    all_good: carried_count === 0,
    shows_large_jump_warning: revenue_jump_percent > 20,
    revenue_jump_percent,
  };
}

export function buildBreakevenSummary(per_source) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return { available: false };
  }

  const group_real_capacity = per_source.real_capacity?.group_real_capacity || [];
  const first_group = group_real_capacity.find((g) => to_number(g.group_recovery_hours) > 0);

  if (!first_group) {
    return { available: false, reason: "No operating group has recovery hours recorded yet" };
  }

  const materials_naive_revenue = per_source.materials?.real_capacity_naive_revenue ?? 0;
  const materials_true_cost = per_source.materials?.true_cost ?? 0;
  const unassigned_total = per_source.unassigned?.total ?? 0;

  const result = calculateIsolatedGroupBreakeven({
    group_real_capacity,
    materials_naive_revenue,
    materials_true_cost,
    unassigned_total,
    target_group_id: first_group.group_id,
  });

  return {
    available: true,
    current_total_net_profit: result.current_total_net_profit,
    required_revenue_delta: result.required_revenue_delta,
    is_at_or_above_breakeven: result.current_total_net_profit >= 0,
  };
}

export function buildGroupLeverRows(per_source, rate_target_by_group_id = {}) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return [];
  }

  const group_real_capacity = per_source.real_capacity?.group_real_capacity || [];
  const materials_naive_revenue = per_source.materials?.real_capacity_naive_revenue ?? 0;
  const materials_true_cost = per_source.materials?.true_cost ?? 0;
  const unassigned_total = per_source.unassigned?.total ?? 0;

  return group_real_capacity.map((g) => {
    const has_hours = to_number(g.group_recovery_hours) > 0;

    const breakeven = has_hours
      ? calculateIsolatedGroupBreakeven({
          group_real_capacity,
          materials_naive_revenue,
          materials_true_cost,
          unassigned_total,
          target_group_id: g.group_id,
        })
      : { available: false, reason: "This group has no recovery hours recorded" };

    const target_rate = rate_target_by_group_id[g.group_id];
    const has_target = target_rate !== undefined && target_rate !== null && target_rate !== "";

    let target_result = null;
    if (has_target && has_hours && breakeven.available) {
      const rate_delta_per_hour = to_number(target_rate) - to_number(breakeven.current_rate_per_hour);
      const applied = applyGroupRateLever({
        group_real_capacity,
        materials_naive_revenue,
        materials_true_cost,
        unassigned_total,
        target_group_id: g.group_id,
        rate_delta_per_hour,
      });
      target_result = {
        total_net_profit: applied.total_net_profit,
        is_above_breakeven: to_number(target_rate) >= to_number(breakeven.breakeven_rate_per_hour),
      };
    }

    return {
      group_id: g.group_id,
      group_name: g.group_name,
      group_recovery_hours: g.group_recovery_hours,
      current_rate_per_hour: breakeven.available ? breakeven.current_rate_per_hour : null,
      breakeven_rate_per_hour: breakeven.available ? breakeven.breakeven_rate_per_hour : null,
      available: breakeven.available === true,
      unavailable_reason: breakeven.available ? null : breakeven.reason,
      target_rate: has_target ? to_number(target_rate) : null,
      target_result,
    };
  });
}

export function buildProportionalSuggestions(per_source) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return { available: false };
  }

  const group_real_capacity = per_source.real_capacity?.group_real_capacity || [];
  const materials_naive_revenue = per_source.materials?.real_capacity_naive_revenue ?? 0;
  const materials_true_cost = per_source.materials?.true_cost ?? 0;
  const unassigned_total = per_source.unassigned?.total ?? 0;

  return calculateProportionalGroupTargets({
    group_real_capacity,
    materials_naive_revenue,
    materials_true_cost,
    unassigned_total,
  });
}