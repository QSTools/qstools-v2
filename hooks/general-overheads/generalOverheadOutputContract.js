import {
  build_general_overhead_category_totals,
  build_general_overhead_allocation_outputs,
} from "@/lib/selectors/generalOverheadSelectors";

export function build_general_overhead_output_contract({
  calculated,
  overhead_state,
}) {
  const allocation_outputs = build_general_overhead_allocation_outputs({
    overhead_rows: calculated.overhead_rows,
    overhead_state,
  });
  const category_totals = build_general_overhead_category_totals(
    calculated.overhead_rows,
    overhead_state
  );

  const has_asset_finance_interest_duplication = calculated.overhead_rows.some(
    (row) =>
      row.contains_asset_finance_interest === true &&
      Number(row.active_amount ?? row.amount ?? 0) !== 0
  );

  return {
    total_general_overheads: calculated.total_general_overheads,
    category_totals,
    general_overheads_ready:
      Number.isFinite(Number(calculated.total_general_overheads)) &&
      category_totals.length > 0 &&
      !has_asset_finance_interest_duplication,
    non_asset_interest_annual: calculated.non_asset_interest_annual ?? 0,
    overhead_rows: allocation_outputs.allocation_rows,
    synced_pnl_overhead_items: overhead_state.synced_pnl_overhead_items ?? [],
    imported_pnl_overhead_rows: allocation_outputs.allocation_rows.filter(
      (row) => row.is_synced_from_pnl
    ),
    asset_overhead_pools: allocation_outputs.asset_overhead_pools,
    total_asset_overhead_pool_amount:
      allocation_outputs.total_asset_overhead_pool_amount,
    asset_related_pool_total:
      allocation_outputs.total_asset_overhead_pool_amount,
    asset_related_assigned_to_assets: 0,
    asset_related_overhead_pool: allocation_outputs.asset_overhead_pools,
    asset_related_unassigned_cost:
      allocation_outputs.total_asset_overhead_pool_amount,
    asset_related_unassigned_balance:
      allocation_outputs.total_asset_overhead_pool_amount,
    total_unassigned_asset_related_overhead_cost_annual:
      allocation_outputs.total_asset_overhead_pool_amount,
    asset_review_required:
      allocation_outputs.total_asset_overhead_pool_amount > 0,
    asset_related_pool_rows: allocation_outputs.allocation_rows.filter(
      (row) => row.is_asset_related_pool
    ),
    unallocated_overhead_lines: allocation_outputs.unallocated_overhead_lines,
    unallocated_overhead_amount: allocation_outputs.unallocated_overhead_amount,
    allocation_pool_warnings: allocation_outputs.allocation_pool_warnings,
    allocation_pool_summaries: allocation_outputs.allocation_pool_summaries,
  };
}
