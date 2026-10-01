// Mirra v6.0 - shared overhead split (RB-1, 2026-10-01)
//
// EXTRACTED from hooks/useBusinessOutcomePerSourceRevenue.js without any
// change to the arithmetic. Business Outcome and Rate Builder both call
// this so the labour/asset overhead split is defined in exactly one place.
//
// Cost Allocation has already computed assigned_overhead_amount for the
// group upstream. This only DIVIDES that already-correct figure between
// the group's labour and asset streams on cost share - it never
// recalculates overhead itself.

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function split_group_overhead(group) {
  const overhead = to_number(group?.assigned_overhead_amount);
  const labour_cost = to_number(group?.assigned_labour_cost);
  const asset_cost = to_number(group?.assigned_asset_burden);
  const total_cost = labour_cost + asset_cost;

  if (total_cost <= 0) {
    return { labour_overhead_pool: 0, asset_overhead_pool: 0 };
  }

  return {
    labour_overhead_pool: overhead * (labour_cost / total_cost),
    asset_overhead_pool: overhead * (asset_cost / total_cost),
  };
}