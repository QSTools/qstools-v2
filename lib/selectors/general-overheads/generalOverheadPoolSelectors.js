import { ASSET_OVERHEAD_POOL_DEFINITIONS } from "./generalOverheadDefinitions";

import {
  format_allocation_amount,
  to_number,
} from "./generalOverheadFormatting";

import { build_grouped_rows } from "./generalOverheadAllocationSelectors";
import { build_allocation_pool_warnings } from "./generalOverheadWarnings";

function build_pool_source_line(row) {
  return {
    line_id: row.line_id,
    line_label: row.line_label,
    source_category: row.source_category,
    current_category: row.current_category,
    source_amount: row.source_amount,
    amount: row.amount,
    system_allocation_type: row.system_allocation_type,
    system_allocation_label: row.system_allocation_label,
    is_asset_related_pool: row.is_asset_related_pool,
    allocation_pool_key: row.allocation_pool_key,
    is_virtual_redistribution_row: row.is_virtual_redistribution_row === true,
    redistribution_source_total_amount:
      row.redistribution_source_total_amount ?? null,
  };
}

function build_asset_overhead_pools(rows = []) {
  const pools = Object.fromEntries(
    Object.entries(ASSET_OVERHEAD_POOL_DEFINITIONS).map(([key, label]) => [
      key,
      {
        label,
        amount: 0,
        source_lines: [],
      },
    ])
  );

  rows.forEach((row) => {
    if (!row?.is_asset_related_pool || !row?.allocation_pool_key) {
      return;
    }

    if (row?.is_balanced_parent_pool) {
      return;
    }

    const target_pool = pools[row.allocation_pool_key];

    if (!target_pool) {
      return;
    }

    target_pool.amount += to_number(row.amount);
    target_pool.source_lines.push(build_pool_source_line(row));
  });

  return pools;
}

export function build_general_overhead_allocation_outputs({
  overhead_rows = [],
  overhead_state = {},
}) {
  const grouped_rows = build_grouped_rows(overhead_rows, overhead_state, false);
  const allocation_rows = grouped_rows.flatMap((group) => group.rows);
  const asset_overhead_pools = build_asset_overhead_pools(allocation_rows);

  const total_asset_overhead_pool_amount = Object.values(
    asset_overhead_pools
  ).reduce((total, pool) => total + to_number(pool?.amount), 0);

  const unallocated_overhead_lines = allocation_rows.filter(
    (row) =>
      row.system_allocation_type === "unallocated_needs_review" &&
      to_number(row.amount) !== 0 &&
      !row.is_balanced_parent_pool
  );

  const unallocated_overhead_amount = unallocated_overhead_lines.reduce(
    (total, row) => total + to_number(row.amount),
    0
  );

  return {
    allocation_rows,
    allocation_pool_summaries: grouped_rows.map((group) => ({
      category_key: group.category_key,
      category_label: group.category_label,
      source_total_amount: group.source_total_amount,
      assigned_amount: group.assigned_amount,
      remaining_amount: group.remaining_amount,
      allocation_pool_used: group.allocation_pool_used,
      allocation_pool_remaining: group.allocation_pool_remaining,
      allocation_pool_status: group.allocation_pool_status,
    })),
    asset_overhead_pools,
    total_asset_overhead_pool_amount: format_allocation_amount(
      total_asset_overhead_pool_amount
    ),
    unallocated_overhead_lines: unallocated_overhead_lines.map(
      build_pool_source_line
    ),
    unallocated_overhead_amount: format_allocation_amount(
      unallocated_overhead_amount
    ),
    allocation_pool_warnings: build_allocation_pool_warnings(
      allocation_rows,
      grouped_rows
    ),
  };
}