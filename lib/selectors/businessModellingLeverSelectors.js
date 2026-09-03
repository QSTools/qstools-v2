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
  calculateProportionalGroupTargets,
} from "@/lib/calculations/businessModellingLeverCalculations";
import {
  calculateIndependentGroupBreakeven,
  applyIndependentGroupRateLever,
  applyIndependentGroupRateLevers,
  calculateIndependentMaterialsBreakeven,
  applyMaterialsMarkupLever,
} from "@/lib/calculations/businessModellingIndependentCalculations";

function to_number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round_currency(value) {
  return Math.round(to_number(value) * 100) / 100;
}

export function buildLiveLeverHeadline(per_source, rate_target_by_group_id = {}, materials_markup_percent = null) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return { available: false };
  }

  const group_real_capacity = per_source.real_capacity?.group_real_capacity || [];
  const unassigned_total = per_source.unassigned?.total ?? 0;
  const real_pnl_revenue = per_source.headline_real_capacity?.total_modelled_revenue ?? 0;

  const materials_input = {
    cogs: per_source.materials?.build_up?.cogs ?? 0,
    true_cost: per_source.materials?.true_cost ?? 0,
    modelled_revenue: per_source.materials?.revenue ?? 0,
  };

  const rate_delta_by_group_id = {};
  group_real_capacity.forEach((g) => {
    const target_rate = rate_target_by_group_id[g.group_id];
    const has_target = target_rate !== undefined && target_rate !== null && target_rate !== "";
    if (!has_target || to_number(g.group_recovery_hours) <= 0) return;

    const current_rate = to_number(g.modelled_revenue) / to_number(g.group_recovery_hours);
    rate_delta_by_group_id[g.group_id] = to_number(target_rate) - current_rate;
  });

  const applied = applyIndependentGroupRateLevers({
    groups: group_real_capacity,
    rate_delta_by_group_id,
  });

  const has_materials_markup =
    materials_markup_percent !== null && materials_markup_percent !== undefined && materials_markup_percent !== "";

  const materials_result = has_materials_markup
    ? applyMaterialsMarkupLever({ materials: materials_input, markup_percent: materials_markup_percent })
    : {
        modelled_revenue: materials_input.modelled_revenue,
        net_profit: round_currency(materials_input.modelled_revenue - materials_input.true_cost),
        verdict:
          materials_input.modelled_revenue - materials_input.true_cost >= 0
            ? "paying_its_way"
            : "being_carried",
      };

  const all_sources = [
    ...applied.groups.map((g) => ({
      key: g.group_id,
      name: g.group_name,
      net_profit: g.net_profit,
      verdict: g.verdict,
    })),
    {
      key: "materials",
      name: "Materials / COG",
      net_profit: materials_result.net_profit,
      verdict: materials_result.verdict,
    },
  ];

  const carried_count = all_sources.filter((s) => s.verdict === "being_carried").length;

  const total_modelled_revenue = round_currency(
    applied.total_modelled_revenue + materials_result.modelled_revenue
  );
  const total_net_profit = round_currency(
    applied.total_net_profit + materials_result.net_profit - unassigned_total
  );

  const revenue_jump_percent =
    real_pnl_revenue > 0
      ? round_currency(((total_modelled_revenue - real_pnl_revenue) / real_pnl_revenue) * 100)
      : 0;

  return {
    available: true,
    is_live: true,
    total_net_profit,
    total_modelled_revenue,
    real_pnl_revenue,
    all_sources,
    carried_count,
    total_source_count: all_sources.length,
    all_good: carried_count === 0,
    shows_large_jump_warning: Math.abs(revenue_jump_percent) > 20,
    revenue_jump_percent,
  };
}

export function buildBreakevenSummary(per_source) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return { available: false };
  }

  const group_real_capacity = per_source.real_capacity?.group_real_capacity || [];
  const unassigned_total = per_source.unassigned?.total ?? 0;

  const materials_input = {
    cogs: per_source.materials?.build_up?.cogs ?? 0,
    true_cost: per_source.materials?.true_cost ?? 0,
    modelled_revenue: per_source.materials?.revenue ?? 0,
  };

  const group_deltas = group_real_capacity
    .filter((g) => to_number(g.group_recovery_hours) > 0)
    .map((g) => calculateIndependentGroupBreakeven({ group: g }))
    .filter((r) => r.available);

  if (group_deltas.length === 0 && to_number(materials_input.cogs) <= 0) {
    return { available: false, reason: "No operating group or materials data available yet" };
  }

  const materials_breakeven = calculateIndependentMaterialsBreakeven({ materials: materials_input });

  const current_total_net_profit = round_currency(
    group_deltas.reduce((sum, r) => sum + r.current_net_profit, 0) +
      (materials_breakeven.available ? materials_breakeven.current_net_profit : 0) -
      unassigned_total
  );

  const required_revenue_delta = round_currency(-current_total_net_profit);

  return {
    available: true,
    current_total_net_profit,
    required_revenue_delta,
    is_at_or_above_breakeven: current_total_net_profit >= 0,
  };
}

// S31: independent per-group rows - each row''s breakeven and target
// result come purely from that group''s own true_cost. No other group,
// no materials, no business-wide total is read anywhere in this function.
export function buildGroupLeverRows(per_source, rate_target_by_group_id = {}) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return [];
  }

  const group_real_capacity = per_source.real_capacity?.group_real_capacity || [];

  return group_real_capacity.map((g) => {
    const has_hours = to_number(g.group_recovery_hours) > 0;

    const breakeven = calculateIndependentGroupBreakeven({ group: g });

    const target_rate = rate_target_by_group_id[g.group_id];
    const has_target = target_rate !== undefined && target_rate !== null && target_rate !== "";

    let target_result = null;
    if (has_target && has_hours && breakeven.available) {
      const rate_delta_per_hour = to_number(target_rate) - to_number(breakeven.current_rate_per_hour);
      const applied = applyIndependentGroupRateLever({ group: g, rate_delta_per_hour });
      target_result = {
        net_profit: applied.net_profit,
        is_above_breakeven: to_number(target_rate) >= to_number(breakeven.breakeven_rate_per_hour),
      };
    }

    return {
      group_id: g.group_id,
      group_name: g.group_name,
      group_recovery_hours: g.group_recovery_hours,
      current_rate_per_hour: breakeven.available ? breakeven.current_rate_per_hour : null,
      breakeven_rate_per_hour: breakeven.available ? breakeven.breakeven_rate_per_hour : null,
      independent_target_revenue: breakeven.available ? breakeven.independent_target_revenue : null,
      is_at_or_above_breakeven: breakeven.available ? breakeven.is_at_or_above_breakeven : null,
      available: breakeven.available === true,
      unavailable_reason: breakeven.available ? null : breakeven.reason,
      target_rate: has_target ? to_number(target_rate) : null,
      target_result,
    };
  });
}

// S31 - NEW. Materials'' own accordion row, using the markup-on-cost
// lever. Mirrors buildGroupLeverRows'' shape so the UI can treat every
// row - groups and materials alike - the same way.
export function buildMaterialsLeverRow(per_source, materials_markup_percent = null) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return { available: false };
  }

  const materials_input = {
    cogs: per_source.materials?.build_up?.cogs ?? 0,
    true_cost: per_source.materials?.true_cost ?? 0,
    modelled_revenue: per_source.materials?.revenue ?? 0,
  };

  const breakeven = calculateIndependentMaterialsBreakeven({ materials: materials_input });

  if (!breakeven.available) {
    return { available: false, unavailable_reason: breakeven.reason };
  }

  const has_target =
    materials_markup_percent !== null && materials_markup_percent !== undefined && materials_markup_percent !== "";

  let target_result = null;
  if (has_target) {
    const applied = applyMaterialsMarkupLever({
      materials: materials_input,
      markup_percent: materials_markup_percent,
    });
    target_result = {
      net_profit: applied.net_profit,
      modelled_revenue: applied.modelled_revenue,
      is_above_breakeven: to_number(materials_markup_percent) >= to_number(breakeven.breakeven_markup_percent),
    };
  }

  return {
    group_id: "materials",
    group_name: "Materials / COG",
    cogs: breakeven.cogs,
    true_cost: breakeven.true_cost,
    current_markup_percent: breakeven.current_markup_percent,
    breakeven_markup_percent: breakeven.breakeven_markup_percent,
    independent_target_revenue: breakeven.independent_target_revenue,
    is_at_or_above_breakeven: breakeven.is_at_or_above_breakeven,
    available: true,
    unavailable_reason: null,
    target_markup_percent: has_target ? to_number(materials_markup_percent) : null,
    target_result,
  };
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