// lib/calculations/businessModellingAdditiveModel.js
//
// Business Modelling (v6.0 redesign, step 1) - additive lever model. Pure.
// Decision (2026-09-24): modelled net profit = TODAY's real headline plus the
// sum of the effects of ONLY the rows touched. Untouched rows stay at achieved.
//   effect = (target - start_rate) x basis
// (staff/asset: $/hr x covered hours; materials: % x COGS/100)
// Levers are { [row_id]: string|number }; blank or non-numeric = untouched.

function r2(v) {
  const x = Number(v);
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0;
}

export function applyAdditiveLevers(rows, levers, today_net_profit) {
  const effects = {};
  const ignored = [];
  let total = 0;

  (rows || []).forEach((row) => {
    const raw = levers ? levers[row.row_id] : undefined;
    if (raw === undefined || raw === null || String(raw).trim() === "") return;

    const target = Number(raw);
    if (!Number.isFinite(target)) {
      ignored.push({ row_id: row.row_id, reason: "not a number" });
      return;
    }
    if (!row.leverable || row.start_rate === null) {
      ignored.push({ row_id: row.row_id, reason: "no covered hours / no basis" });
      return;
    }

    const effect = row.is_cost_row
      ? (row.start_rate - target) * row.basis
      : (target - row.start_rate) * row.basis;
    effects[row.row_id] = effect;
    total += effect;
  });

  const rounded_effects = {};
  Object.keys(effects).forEach((k) => {
    rounded_effects[k] = r2(effects[k]);
  });

  return {
    effects: rounded_effects,
    ignored,
    total_effect: r2(total),
    today_net_profit: r2(today_net_profit),
    modelled_net_profit: r2(Number(today_net_profit) + total),
  };
}