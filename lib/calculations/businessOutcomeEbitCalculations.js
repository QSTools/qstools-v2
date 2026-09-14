// Shared EBIT calculation - built 2026-09-12, extracted from
// BusinessOutcomeEbitByUnitTable.jsx so the per-source table and any
// summary display (e.g. a prominent headline metric) use exactly one
// calculation, not two that could silently drift apart - the same
// "reuse the engine" principle used throughout this codebase.
//
// Verified live 2026-09-12: total_net_profit here matches the page's
// own headline net profit exactly (Groups + Materials - Unassigned),
// not approximately.

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateEbitByUnit({ real_capacity, materials, unassigned } = {}) {
  const groups = real_capacity?.group_real_capacity;

  if (!Array.isArray(groups) || groups.length === 0) {
    return { available: false, rows: [], total_net_profit: null, total_interest: null, total_ebit: null };
  }

  const rows = groups.map((g) => ({
    group_name: g.group_name,
    net_profit: to_number(g.final_net_profit) || 0,
    interest: to_number(g.asset_interest_annual) || 0,
    ebit: (to_number(g.final_net_profit) || 0) + (to_number(g.asset_interest_annual) || 0),
  }));

  const materials_net_profit = materials?.real_capacity_net_profit;
  if (Number.isFinite(Number(materials_net_profit))) {
    rows.push({
      group_name: "Materials / COGS",
      net_profit: Number(materials_net_profit),
      interest: 0,
      ebit: Number(materials_net_profit),
    });
  }

  const unassigned_total = unassigned?.total;
  if (Number.isFinite(Number(unassigned_total)) && Number(unassigned_total) !== 0) {
    rows.push({
      group_name: "Unassigned cost (no source)",
      net_profit: -Number(unassigned_total),
      interest: 0,
      ebit: -Number(unassigned_total),
    });
  }

  const total_net_profit = rows.reduce((sum, r) => sum + r.net_profit, 0);
  const total_interest = rows.reduce((sum, r) => sum + r.interest, 0);
  const total_ebit = rows.reduce((sum, r) => sum + r.ebit, 0);

  return {
    available: true,
    rows,
    total_net_profit: to_number(total_net_profit),
    total_interest: to_number(total_interest),
    total_ebit: to_number(total_ebit),
  };
}