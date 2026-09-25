// lib/calculations/businessModellingSourceRows.js
//
// Business Modelling (v6.0 redesign, step 1) - flattens Business Outcome's
// per_source into one row per lever-able source. Pure: no hooks, no imports.
// Decision D-view (2026-09-24): View A achieved figures are the base.
//   row achieved revenue = true_cost + non_productive_share + real_capacity_net_profit
//   staff rows: per staff type (basis = that row's hours)
//   asset rows: ONE row per working unit (basis = the unit's COVERED hours,
//     never seat hours - asset rate is set at unit level, S28 not built)
//   materials: START 0% markup (paid at cost), basis = COGS / 100 so that
//     effect = (target% - 0) x basis follows the same formula as rates.

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function r2(v) {
  return Math.round(n(v) * 100) / 100;
}

function row_status(basis, achieved_revenue, no_basis_status) {
  if (basis <= 0) return no_basis_status;
  if (achieved_revenue < 0) return "carrying_loss";
  return "active";
}

export function buildSourceRows(per_source, overhead_categories = []) {
  if (!per_source?.available || per_source.data_status !== "ready") {
    return { available: false, rows: [] };
  }

  const units = per_source.real_capacity?.group_real_capacity || [];
  const hours_by_unit = {};
  units.forEach((g) => {
    hours_by_unit[g.group_id] = n(g.group_recovery_hours);
  });

  const rows = [];

  // Overheads (v6.0 step 5b) - category-level cost rows, read-only from
  // General Overheads. is_cost_row: true tells applyAdditiveLevers to
  // invert the effect (raising the total LOWERS net profit). basis is a
  // constant 1 so effect = (start_rate - target) in plain dollars, not a
  // rate x quantity like every other row kind.
  (overhead_categories || []).forEach((category) => {
    const category_total = n(category.total_amount);
    rows.push({
      row_id: "overhead:" + category.category_key,
      kind: "overhead",
      unit_id: category.category_key,
      unit_name: category.category_label,
      source_name: category.category_label,
      label: category.category_label,
      basis: 1,
      basis_unit: "\$ total",
      achieved_revenue: r2(-category_total),
      start_rate: category_total,
      floor_rate: 0,
      ceiling_rate: null,
      status: "active",
      leverable: true,
      is_cost_row: true,
    });
  });

  (per_source.labour_groups || []).forEach((g) => {
    (g.staff || []).forEach((s) => {
      const basis = hours_by_unit[g.group_id] > 0 ? n(s.hours) : 0;
      const achieved_revenue = n(s.true_cost) + n(s.non_productive_share) + n(s.real_capacity_net_profit);
      const status = row_status(basis, achieved_revenue, "no_covered_hours");
      rows.push({
        row_id: "staff:" + g.group_id + ":" + s.staff_type_id,
        kind: "staff",
        unit_id: g.group_id,
        unit_name: g.group_name,
        source_name: s.staff_type_name,
        label: g.group_name + " / " + s.staff_type_name,
        basis,
        basis_unit: "hours",
        achieved_revenue: r2(achieved_revenue),
        start_rate: basis > 0 ? achieved_revenue / basis : null,
        floor_rate: basis > 0 ? (n(s.true_cost) + n(s.non_productive_share)) / basis : null, group_min_rate: n(s.minimum_recoverable_rate_per_hour),
        ceiling_rate: n(s.charge_out_rate),
        status,
        leverable: status === "active" || status === "carrying_loss",
      });
    });
  });

  (per_source.asset_groups || []).forEach((g) => {
    const assets = g.assets || [];
    if (assets.length === 0) return;
    const basis = n(hours_by_unit[g.group_id]);
    const achieved_revenue = assets.reduce(
      (sum, a) => sum + n(a.true_cost) + n(a.non_productive_share) + n(a.real_capacity_net_profit),
      0
    );
    const entered_revenue = assets.reduce((sum, a) => sum + n(a.modelled_revenue), 0);
    const status = row_status(basis, achieved_revenue, "no_covered_hours");
    rows.push({
      row_id: "assets:" + g.group_id,
      kind: "assets",
      unit_id: g.group_id,
      unit_name: g.group_name,
      source_name: assets.map((a) => a.asset_name).join(" + "),
      label: g.group_name + " / assets",
      basis,
      basis_unit: "hours",
      achieved_revenue: r2(achieved_revenue),
      start_rate: basis > 0 ? achieved_revenue / basis : null,
      floor_rate: basis > 0 ? assets.reduce((sum, a) => sum + n(a.true_cost) + n(a.non_productive_share), 0) / basis : null, group_min_rate: n(assets[0].minimum_recoverable_rate_per_hour),
      ceiling_rate: basis > 0 ? entered_revenue / basis : null,
      status,
      leverable: status === "active" || status === "carrying_loss",
    });
  });

  const cogs = n(per_source.materials?.build_up?.cogs);
  const materials_cost = n(per_source.materials?.true_cost);
  const entered_markup = per_source.view_b?.materials?.current_markup_percent;
  rows.push({
    row_id: "materials",
    kind: "materials",
    unit_id: "materials",
    unit_name: "Materials / COG",
    source_name: "Materials markup on COGS",
    label: "Materials / COG",
    basis: cogs / 100,
    basis_unit: "percent of COGS",
    achieved_revenue: r2(materials_cost),
    start_rate: 0,
    floor_rate: 0,
    ceiling_rate: entered_markup === undefined || entered_markup === null ? null : n(entered_markup),
    status: cogs > 0 ? "active" : "no_cogs",
    leverable: cogs > 0,
  });

  return {
    available: true,
    rows,
    today_net_profit: r2(per_source.headline_real_capacity?.total_net_profit),
    real_revenue: r2(per_source.headline_real_capacity?.total_modelled_revenue),
    achieved_total: r2(rows.reduce((sum, r) => sum + r.achieved_revenue, 0)),
  };
}