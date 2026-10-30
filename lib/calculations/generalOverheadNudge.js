// lib/calculations/generalOverheadNudge.js
//
// R3 slice 3, batch 2 (Business Modelling brief, Addendum 8 item 6; Addendum 18 slice 3 items 1, 2, 6). Pure. No imports, no hooks, no storage.
// The per-category overhead nudge: a percentage per overhead CATEGORY, applied AFTER the P&L rebuild (the hook calls this with the state it
// has just rebuilt; the saved state is never changed). Returns a nudged COPY of the state plus a per-category summary.
//
//   nudged amount of an eligible line = line amount x (1 + pct / 100)
//
// Eligible line = a line in the nudged category (its EFFECTIVE category, so a reclassified line follows its override) that is NOT:
//   - flagged as containing asset finance interest (its active amount is the P&L amount less the Assets figure, so scaling the P&L
//     amount would not scale what is carried), or
//   - already distributed to an asset pool (its effective allocation type is an asset pool type or asset finance interest).
// "Locked" lines in the old lever page (BM-2, rule R5) are exactly these two kinds; there is no is_lever field in the code.
//
// The caller supplies two functions so this file stays pure and testable in plain node:
//   calculate(state)        -> { overhead_rows }  (the real calculate_general_overheads with the Assets interest total already bound)
//   classify_row(row, state) -> { category_key, eligible }  (effective category and the eligibility rule above, from the selectors)
//
// Row kinds (as calculate_general_overheads builds them): fixed rows (key = the state field name), synced P&L rows
// (is_synced_from_pnl, key = synced_overhead_id), custom rows (is_custom, key = custom_overhead_id).
// Summary field orphan: true when the category has a nudge but no eligible line carries a non-zero amount, so the nudge resolves to zero
// (Addendum 2 item 8: a target that is gone resolves to zero with a flag). It is separate from flag, which is the stored record's flag
// (baseline_changed). The wording for both is written in batch 5.

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function apply_overhead_nudges({ overhead_state, nudges, calculate, classify_row }) {
  const categories = nudges && typeof nudges === "object" ? Object.keys(nudges) : [];

  // An empty layer is the identity: the very same object comes back and nothing is calculated.
  if (!overhead_state || categories.length === 0) {
    return { state: overhead_state, applied: false, by_category: {}, total_effect: 0 };
  }

  const rows = (calculate(overhead_state) || {}).overhead_rows || [];

  const by_category = {};
  for (const category_key of categories) {
    const pct = to_number(nudges[category_key] && nudges[category_key].pct);
    by_category[category_key] = {
      pct,
      base_total: 0,
      effect: 0,
      lines: 0,
      orphan: true,
      flag: (nudges[category_key] && nudges[category_key].flag) || "",
    };
  }

  const factor_fixed = {};
  const factor_synced = {};
  const factor_custom = {};

  for (const row of rows) {
    const verdict = classify_row(row, overhead_state);
    if (!verdict || verdict.eligible !== true) continue;
    const summary = by_category[verdict.category_key];
    if (!summary) continue;

    const amount = to_number(row.amount);
    if (amount === 0) continue;

    summary.base_total += amount;
    summary.effect += (amount * summary.pct) / 100;
    summary.lines += 1;

    const factor = 1 + summary.pct / 100;
    if (row.is_synced_from_pnl === true) factor_synced[row.key] = factor;
    else if (row.is_custom === true) factor_custom[row.key] = factor;
    else factor_fixed[row.key] = factor;
  }

  let total_effect = 0;
  for (const category_key of categories) {
    const summary = by_category[category_key];
    summary.orphan = summary.lines === 0;
    total_effect += summary.effect;
  }

  // Build the nudged copy. Every field not touched here is carried over by the spread (project instruction 6b: never rebuild field by field).
  const next = { ...overhead_state };

  for (const field of Object.keys(factor_fixed)) {
    next[field] = to_number(overhead_state[field]) * factor_fixed[field];
  }

  if (Object.keys(factor_synced).length > 0 && Array.isArray(overhead_state.synced_pnl_overhead_items)) {
    next.synced_pnl_overhead_items = overhead_state.synced_pnl_overhead_items.map((item) =>
      factor_synced[item.synced_overhead_id] !== undefined
        ? { ...item, synced_overhead_amount: to_number(item.synced_overhead_amount) * factor_synced[item.synced_overhead_id] }
        : item
    );
  }

  if (Object.keys(factor_custom).length > 0 && Array.isArray(overhead_state.custom_overhead_items)) {
    next.custom_overhead_items = overhead_state.custom_overhead_items.map((item) =>
      factor_custom[item.custom_overhead_id] !== undefined
        ? { ...item, custom_overhead_amount: to_number(item.custom_overhead_amount) * factor_custom[item.custom_overhead_id] }
        : item
    );
  }

  return { state: next, applied: true, by_category, total_effect };
}
