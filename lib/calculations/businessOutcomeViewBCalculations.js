// Duplicated intentionally from useBusinessOutcomePerSourceRevenue.js
// rather than importing/exporting - importing FROM the hook here while
// the hook imports build_materials_source/apply_revenue_ceiling_v2/
// apply_real_capacity_v2 FROM this file creates a genuine circular
// module dependency (each file depends on the other), which caused a
// dev-server hang when first wired in (2026-09 session). This matches
// the project's own existing precedent of duplicating small helpers
// across files instead of cross-importing (see useBusinessOutcomePerSourceRevenue.js's
// own verdict_for, duplicated from businessOutcomeAssetSplitCalculations.js
// for the identical reason, per S29's final principle).
function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function verdict_for(net_profit) {
  return net_profit >= 0 ? "paying_its_way" : "being_carried";
}

function group_rows_by_group_id(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = row.group_id || `ungrouped_${row.group_name}`;
    if (!map.has(key)) {
      map.set(key, { group_id: row.group_id, group_name: row.group_name, rows: [], modelled_revenue: 0, true_cost: 0 });
    }
    const g = map.get(key);
    g.rows.push(row);
    g.modelled_revenue += row.modelled_revenue ?? 0;
    g.true_cost += row.true_cost ?? 0;
  });
  return Array.from(map.values());
}

// =============================================================================
// S26 VIEW B - "Materials shares equally"
//
// Materials treated as a genuine third peer alongside labour/asset groups,
// instead of the residual View A computes. Parallel and additive only:
// nothing in useBusinessOutcomePerSourceRevenue.js's existing View A logic
// (apply_revenue_ceiling, apply_real_capacity, the `materials` object built
// from the naive residual) is touched, imported-and-wrapped, or altered.
//
// Verified against 3 hand-derived cases (2026-09 session) before being
// wired into the hook:
//   Case 1 (real revenue $1,843,663): cascade correctly wipes nearly all
//     positive naive profit across all 6 peers, materials included,
//     landing total final profit at ~$20, matching real revenue - real cost.
//   Case 2 (hypothetical $2.5M revenue): correctly surfaces a shortfall
//     View A shows as fully healthy - the gap this view exists to reveal.
//   Case 3 (materials at 0% naive profit, boundary): correctly excluded
//     from v0, no divide-by-zero, final profit stays exactly $0.
// =============================================================================

/**
 * Builds the materials row in the same shape as a labour_sources/
 * asset_sources row, so it can flow through group_rows_by_group_id and
 * the v2 cascade below without any special-casing.
 */
export function build_materials_source(total_cogs, residual_overhead, materials_markup_percent) {
  const true_cost = round_currency(total_cogs + Math.max(residual_overhead, 0));
  const modelled_revenue = round_currency(total_cogs * (1 + materials_markup_percent / 100));
  const net_profit = round_currency(modelled_revenue - true_cost);

  return {
    source_id: "materials",
    source_name: "Materials / COGS",
    group_id: "materials",
    group_name: "Materials / COGS",
    direct_cost: round_currency(total_cogs),
    overhead_share: round_currency(Math.max(residual_overhead, 0)),
    true_cost,
    current_markup_percent: materials_markup_percent,
    modelled_revenue,
    net_profit,
    minimum_recoverable_markup_percent: null,
    verdict: verdict_for(net_profit),
    is_modelled: true,
  };
}

/**
 * VIEW B ceiling check - extends apply_revenue_ceiling to three peer
 * types instead of two.
 *
 * CALLER MUST PASS CLONED labour_sources/asset_sources ROWS, not the
 * originals from View A's build_labour_sources/build_asset_sources
 * output - this function mutates rows in place (implied_revenue,
 * implied_net_profit, implied_verdict), and both views currently use
 * IDENTICAL field names for this. Passing the original rows would
 * silently overwrite View A's numbers. Clone at the call site:
 *   const view_b_labour = labour_sources.map((row) => ({ ...row }));
 */
export function apply_revenue_ceiling_v2(labour_sources, asset_sources, materials_source, total_revenue_reference) {
  const labour_total = labour_sources.reduce((sum, row) => sum + to_number(row.modelled_revenue), 0);
  const asset_total = asset_sources.reduce((sum, row) => sum + to_number(row.modelled_revenue), 0);
  const materials_total = to_number(materials_source.modelled_revenue);
  const combined_total = labour_total + asset_total + materials_total;

  const is_breached = combined_total > total_revenue_reference;

  if (!is_breached || combined_total <= 0) {
    return {
      is_breached: false,
      overage: 0,
      all_peers_modelled_total: round_currency(combined_total),
      scale_factor: 1,
    };
  }

  const overage = round_currency(combined_total - total_revenue_reference);
  const scale_factor = total_revenue_reference / combined_total;

  [...labour_sources, ...asset_sources, materials_source].forEach((row) => {
    if (row.modelled_revenue === null) {
      row.implied_revenue = null;
      row.implied_net_profit = null;
      row.implied_verdict = null;
      return;
    }
    const implied_revenue = round_currency(row.modelled_revenue * scale_factor);
    const implied_net_profit = round_currency(implied_revenue - row.true_cost);
    row.implied_revenue = implied_revenue;
    row.implied_net_profit = implied_net_profit;
    row.implied_verdict = verdict_for(implied_net_profit);
  });

  return {
    is_breached: true,
    overage,
    all_peers_modelled_total: round_currency(combined_total),
    scale_factor,
  };
}

/**
 * VIEW B real-capacity cascade - materials is a genuine peer group inside
 * the SAME two-phase mechanism as the original apply_real_capacity, not a
 * special case with its own floor.
 *
 * CALLER MUST PASS CLONED labour_sources/asset_sources ROWS - same reason
 * as apply_revenue_ceiling_v2 above (real_capacity_net_profit,
 * real_capacity_verdict field names also collide with View A's).
 *
 * shortfall here is GLOBAL - total modelled revenue across ALL peers vs
 * real total revenue - unlike the original's materials-specific
 * (materials_true_cost - materials_naive_revenue). No flooring at the
 * end: materials_real_capacity_net_profit can be negative, same as any
 * operating group can be today.
 */
export function apply_real_capacity_v2(labour_sources, asset_sources, materials_source, total_revenue_reference) {
  const all_sources = [...labour_sources, ...asset_sources, materials_source];
  const groups = group_rows_by_group_id(all_sources);

  groups.forEach((g) => {
    g.naive_net_profit = g.modelled_revenue - g.true_cost;
  });

  const total_modelled_revenue_all = groups.reduce((sum, g) => sum + g.modelled_revenue, 0);
  const shortfall = Math.max(0, round_currency(total_modelled_revenue_all - total_revenue_reference));

  const surplus = Math.max(0, round_currency(total_revenue_reference - total_modelled_revenue_all));
  const v0 = groups.reduce((sum, g) => (g.naive_net_profit > 0 ? sum + g.naive_net_profit : sum), 0);
  const phase1_absorbed = Math.min(shortfall, v0);
  const phase1_factor = v0 > 0 ? phase1_absorbed / v0 : 0;
  const leftover = round_currency(shortfall - phase1_absorbed);

  groups.forEach((g) => {
    const after_phase1 = g.naive_net_profit > 0 ? g.naive_net_profit * (1 - phase1_factor) : g.naive_net_profit;
    const phase2_deduction =
      leftover > 0 && total_modelled_revenue_all > 0
        ? leftover * (g.modelled_revenue / total_modelled_revenue_all)
        : 0;
    g.final_net_profit = round_currency(after_phase1 - phase2_deduction);
    g.total_adjustment = round_currency(g.naive_net_profit - g.final_net_profit);
  });

  groups.forEach((g) => {
    const inner_v0 = g.rows.reduce((sum, row) => {
      if (row.net_profit === null || row.net_profit <= 0) return sum;
      return sum + row.net_profit;
    }, 0);

    const inner_absorbed = Math.min(Math.max(g.total_adjustment, 0), inner_v0);
    const inner_factor = inner_v0 > 0 ? inner_absorbed / inner_v0 : 0;
    const inner_leftover = round_currency(g.total_adjustment - inner_absorbed);
    const group_row_revenue_total = g.rows.reduce((sum, row) => sum + (row.modelled_revenue ?? 0), 0);

    g.rows.forEach((row) => {
      if (row.net_profit === null) {
        row.real_capacity_net_profit = null;
        row.real_capacity_verdict = null;
        return;
      }
      const inner_after_phase1 = row.net_profit > 0 ? row.net_profit * (1 - inner_factor) : row.net_profit;
      const inner_phase2_deduction =
        inner_leftover > 0 && group_row_revenue_total > 0
          ? inner_leftover * ((row.modelled_revenue ?? 0) / group_row_revenue_total)
          : 0;

      const real_capacity_net_profit = round_currency(inner_after_phase1 - inner_phase2_deduction);
      row.real_capacity_net_profit = real_capacity_net_profit;
      row.real_capacity_verdict = verdict_for(real_capacity_net_profit);

      if (row.group_id === "materials") {
        const achieved_revenue = row.true_cost + real_capacity_net_profit;
        row.minimum_recoverable_markup_percent =
          row.true_cost > 0 ? round_currency(((achieved_revenue / row.true_cost) - 1) * 100) : null;
      }
    });
  });

  const materials_row = groups.find((g) => g.group_id === "materials").rows[0];

  return {
    shortfall: round_currency(shortfall),
    surplus,
    v0: round_currency(v0),
    phase1_absorbed: round_currency(phase1_absorbed),
    phase1_factor,
    leftover,
    materials_real_capacity_net_profit: materials_row.real_capacity_net_profit,
    materials_real_capacity_verdict: materials_row.real_capacity_verdict,
    materials_minimum_recoverable_markup_percent: materials_row.minimum_recoverable_markup_percent,
    group_real_capacity: groups.map((g) => ({
      group_id: g.group_id,
      group_name: g.group_name,
      naive_net_profit: round_currency(g.naive_net_profit),
      final_net_profit: g.final_net_profit,
      total_adjustment: g.total_adjustment,
    })),
  };
}
