// lib/calculations/businessModellingLeverCalculations.js
//
// Business Modelling - Group Rate Lever & Isolated Breakeven (S26 brief).
//
// DELIBERATE, COMMENTED DUPLICATION of the OUTER (group-level) half of
// the two-phase cascade in hooks/useBusinessOutcomePerSourceRevenue.js's
// apply_real_capacity(). That function is not exported, and per S05's
// locked boundary Business Modelling must not change source module
// calculations - adding an export would change that file's public
// surface for a downstream consumer it was never designed around. Same
// precedent already set in this codebase's own
// lib/calculations/businessOutcomeAssetSplitCalculations.js (see that
// file's comment on getRecoveryDriverQuantity).
//
// Only the OUTER cascade is duplicated - not the inner per-source split.
// Business Modelling's cards work at group/materials level only, matching
// Business Outcome's own Card 1 (all_sources / group_real_capacity), so
// the inner per-staff/per-asset split is out of scope here.
//
// If Business Outcome's real apply_real_capacity() ever changes, this
// copy must be updated to match by hand - it is not auto-synced. Flag
// this file for review any time that function is touched.

function to_number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round_currency(value) {
  return Math.round(to_number(value) * 100) / 100;
}

// Mirrors STEP 1 (outer cascade) of apply_real_capacity() exactly.
// groups = [{ group_id, group_name, modelled_revenue, true_cost }]
function run_group_level_cascade(groups, materials_naive_revenue, materials_true_cost) {
  const working_groups = groups.map((g) => ({
    ...g,
    naive_net_profit: round_currency(g.modelled_revenue - g.true_cost),
  }));

  const shortfall = Math.max(0, materials_true_cost - materials_naive_revenue);

  const v0 = working_groups.reduce(
    (sum, g) => (g.naive_net_profit > 0 ? sum + g.naive_net_profit : sum),
    0
  );
  const phase1_absorbed = Math.min(shortfall, v0);
  const phase1_factor = v0 > 0 ? phase1_absorbed / v0 : 0;
  const leftover = round_currency(shortfall - phase1_absorbed);

  const total_group_modelled_revenue = working_groups.reduce(
    (sum, g) => sum + g.modelled_revenue,
    0
  );

  working_groups.forEach((g) => {
    const after_phase1 =
      g.naive_net_profit > 0 ? g.naive_net_profit * (1 - phase1_factor) : g.naive_net_profit;
    const phase2_deduction =
      leftover > 0 && total_group_modelled_revenue > 0
        ? leftover * (g.modelled_revenue / total_group_modelled_revenue)
        : 0;
    g.final_net_profit = round_currency(after_phase1 - phase2_deduction);
    g.total_adjustment = round_currency(g.naive_net_profit - g.final_net_profit);
  });

  const materials_final_revenue = Math.max(materials_naive_revenue, materials_true_cost);
  const materials_final_net_profit = round_currency(materials_final_revenue - materials_true_cost);

  const total_final_net_profit =
    working_groups.reduce((sum, g) => sum + g.final_net_profit, 0) + materials_final_net_profit;

  return {
    groups: working_groups,
    materials_final_net_profit,
    materials_naive_net_profit: round_currency(materials_naive_revenue - materials_true_cost),
    total_final_net_profit: round_currency(total_final_net_profit),
  };
}

export function applyGroupRateLever({
  group_real_capacity,
  materials_naive_revenue,
  materials_true_cost,
  unassigned_total,
  target_group_id,
  rate_delta_per_hour,
}) {
  const groups = (group_real_capacity || []).map((g) => {
    const is_target = g.group_id === target_group_id;
    const revenue_delta = is_target
      ? to_number(rate_delta_per_hour) * to_number(g.group_recovery_hours)
      : 0;

    return {
      group_id: g.group_id,
      group_name: g.group_name,
      modelled_revenue: to_number(g.modelled_revenue) + revenue_delta,
      true_cost: to_number(g.true_cost),
    };
  });

  const cascade = run_group_level_cascade(
    groups,
    to_number(materials_naive_revenue),
    to_number(materials_true_cost)
  );

  return {
    groups: cascade.groups,
    materials_final_net_profit: cascade.materials_final_net_profit,
    materials_naive_net_profit: cascade.materials_naive_net_profit,
    total_net_profit: round_currency(
      cascade.total_final_net_profit - to_number(unassigned_total)
    ),
  };
}

export function calculateIsolatedGroupBreakeven({
  group_real_capacity,
  materials_naive_revenue,
  materials_true_cost,
  unassigned_total,
  target_group_id,
}) {
  const target_group = (group_real_capacity || []).find(
    (g) => g.group_id === target_group_id
  );

  if (!target_group || to_number(target_group.group_recovery_hours) <= 0) {
    return {
      group_id: target_group_id,
      available: false,
      reason: !target_group
        ? "Group not found"
        : "This group has no recovery hours recorded - a rate lever cannot be calculated for it",
      required_rate_delta_per_hour: null,
      breakeven_rate_per_hour: null,
    };
  }

  const current_total_revenue =
    (group_real_capacity || []).reduce((sum, g) => sum + to_number(g.modelled_revenue), 0) +
    to_number(materials_naive_revenue);
  const current_total_cost =
    (group_real_capacity || []).reduce((sum, g) => sum + to_number(g.true_cost), 0) +
    to_number(materials_true_cost);
  const current_total_net_profit = round_currency(
    current_total_revenue - current_total_cost - to_number(unassigned_total)
  );

  const required_revenue_delta = round_currency(-current_total_net_profit);
  const required_rate_delta_per_hour = round_currency(
    required_revenue_delta / to_number(target_group.group_recovery_hours)
  );

  const current_rate_per_hour =
    to_number(target_group.group_recovery_hours) > 0
      ? round_currency(
          to_number(target_group.modelled_revenue) / to_number(target_group.group_recovery_hours)
        )
      : null;

  return {
    group_id: target_group_id,
    available: true,
    current_total_net_profit,
    required_revenue_delta,
    required_rate_delta_per_hour,
    current_rate_per_hour,
    breakeven_rate_per_hour:
      current_rate_per_hour !== null
        ? round_currency(current_rate_per_hour + required_rate_delta_per_hour)
        : null,
  };
}