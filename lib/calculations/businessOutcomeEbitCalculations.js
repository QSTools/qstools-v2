// Shared EBIT calculation - built 2026-09-12, extracted from
// BusinessOutcomeEbitByUnitTable.jsx so the per-source table and any
// summary display (e.g. a prominent headline metric) use exactly one
// calculation, not two that could silently drift apart - the same
// "reuse the engine" principle used throughout this codebase.
//
// Verified live 2026-09-12: total_net_profit here matches the page's
// own headline net profit exactly (Groups + Materials - Unassigned),
// not approximately.
//
// DELIBERATELY always View A: real_capacity, materials.real_capacity_net_profit,
// and unassigned.total are all View A fields (per_source.real_capacity is
// the View A cascade result, never per_source.view_b). This function has
// no view_mode_ab awareness at all, matching the blurb and Health Gauge's
// own stability principle - confirmed live 2026-09-12 by toggling View A/B
// on the page and checking the EBIT summary card's numbers stayed
// unchanged. Do not add View B branching here without a specific reason.

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateEbitByUnit({ real_capacity, materials, unassigned, all_assets, overhead_interest_annual } = {}) {
  const groups = real_capacity?.group_real_capacity;

  if (!Array.isArray(groups) || groups.length === 0) {
    return { available: false, rows: [], total_net_profit: null, total_interest: null, total_ebit: null };
  }

  // EBITDA added 2026-09-12, same session as the Fixed Asset Register
  // depreciation feature. Deliberately uses g.asset_depreciation_annual
  // (the REAL depreciation figure) regardless of any asset's own
  // include_depreciation_in_cost toggle - that toggle only affects
  // pricing/true_cost elsewhere, not this informational figure. See
  // FIXED_ASSET_REGISTER_IMPORT_SCOPING_BRIEF_2026-09-12.txt.
  const rows = groups.map((g) => ({
    group_name: g.group_name,
    net_profit: to_number(g.final_net_profit) || 0,
    interest: to_number(g.asset_interest_annual) || 0,
    depreciation: to_number(g.asset_depreciation_annual) || 0,
    ebit: (to_number(g.final_net_profit) || 0) + (to_number(g.asset_interest_annual) || 0),
    ebitda:
      (to_number(g.final_net_profit) || 0) +
      (to_number(g.asset_interest_annual) || 0) +
      (to_number(g.asset_depreciation_annual) || 0),
  }));

  // F-8 (2026-10-18): interest on an asset that sits on no source row (a support asset, whether in a pure
  // support group or a mixed unit, or an unassigned asset) is inside net profit as cost but was never added
  // back, so EBIT and EBITDA were understated by exactly that interest. When the caller passes every active
  // asset, the remainder is added back as one row, so total interest = every active asset's interest.
  // Without all_assets the result is unchanged (older callers).
  //
  // F-10b (2026-10-27): the same remainder rule now covers DEPRECIATION. Depreciation on an asset that sits on
  // no source row (a support asset, whether in a pure support group or a mixed unit, or an unassigned asset, or
  // the unassigned share of a part-assigned asset) was never added back, so EBITDA was understated by exactly
  // that figure. Remainder = every active asset's estimated_annual_depreciation less the depreciation already on
  // the source rows (each asset x its assignment share), added back as one row, so total depreciation = every
  // active asset's depreciation. Real depreciation regardless of include_depreciation_in_cost, null counts as 0,
  // exactly as for the source rows. EBIT is untouched by it (depreciation is added back after EBIT).
  if (Array.isArray(all_assets)) {
    const all_asset_interest = all_assets.reduce((sum, a) => sum + (to_number(a?.asset_interest_annual) || 0), 0);
    const row_interest = rows.reduce((sum, r) => sum + r.interest, 0);
    const interest_not_on_a_source = Math.round((all_asset_interest - row_interest) * 100) / 100;
    const all_asset_depreciation = all_assets.reduce((sum, a) => sum + (to_number(a?.estimated_annual_depreciation) || 0), 0);
    const row_depreciation = rows.reduce((sum, r) => sum + r.depreciation, 0);
    const depreciation_not_on_a_source = Math.round((all_asset_depreciation - row_depreciation) * 100) / 100;
    const remainder_interest = interest_not_on_a_source > 0.5 ? interest_not_on_a_source : 0;
    const remainder_depreciation = depreciation_not_on_a_source > 0.5 ? depreciation_not_on_a_source : 0;
    if (remainder_interest > 0 || remainder_depreciation > 0) {
      rows.push({
        group_name: "Support and unassigned assets (interest and depreciation)",
        net_profit: 0,
        interest: remainder_interest,
        depreciation: remainder_depreciation,
        ebit: remainder_interest,
        ebitda: remainder_interest + remainder_depreciation,
      });
    }
  }

  // F-11 (2026-10-27): interest still sitting in General Overheads (overdraft, bank, non-asset loan interest, and
  // the remainder of a flagged P&L interest row after the Assets figure is taken off) is inside net profit as a
  // cost, so EBIT adds it back too. Asset interest is NOT in this figure (General Overheads removes it from the
  // flagged row), so nothing is counted twice. Omitted or 0 = unchanged (older callers).
  const interest_in_overheads = Math.round((to_number(overhead_interest_annual) || 0) * 100) / 100;
  if (interest_in_overheads > 0.005) {
    rows.push({
      group_name: "Interest in overheads (non-asset)",
      net_profit: 0,
      interest: interest_in_overheads,
      depreciation: 0,
      ebit: interest_in_overheads,
      ebitda: interest_in_overheads,
    });
  }

  const materials_net_profit = materials?.real_capacity_net_profit;
  if (Number.isFinite(Number(materials_net_profit))) {
    rows.push({
      group_name: "Materials / COGS",
      net_profit: Number(materials_net_profit),
      interest: 0,
      depreciation: 0,
      ebit: Number(materials_net_profit),
      ebitda: Number(materials_net_profit),
    });
  }

  const unassigned_total = unassigned?.total;
  if (Number.isFinite(Number(unassigned_total)) && Number(unassigned_total) !== 0) {
    rows.push({
      group_name: "Unassigned cost (no source)",
      net_profit: -Number(unassigned_total),
      interest: 0,
      depreciation: 0,
      ebit: -Number(unassigned_total),
      ebitda: -Number(unassigned_total),
    });
  }

  const total_net_profit = rows.reduce((sum, r) => sum + r.net_profit, 0);
  const total_interest = rows.reduce((sum, r) => sum + r.interest, 0);
  const total_depreciation = rows.reduce((sum, r) => sum + r.depreciation, 0);
  const total_ebit = rows.reduce((sum, r) => sum + r.ebit, 0);
  const total_ebitda = rows.reduce((sum, r) => sum + r.ebitda, 0);

  return {
    available: true,
    rows,
    total_net_profit: to_number(total_net_profit),
    total_interest: to_number(total_interest),
    total_depreciation: to_number(total_depreciation),
    total_ebit: to_number(total_ebit),
    total_ebitda: to_number(total_ebitda),
  };
}