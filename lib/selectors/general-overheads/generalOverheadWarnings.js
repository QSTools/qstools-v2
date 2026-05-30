import { to_number } from "./generalOverheadFormatting";

export function build_allocation_pool_warnings(rows = [], group_summaries = []) {
  const warnings = [];

  rows.forEach((row) => {
    if (
      row.system_allocation_type === "unallocated_needs_review" &&
      to_number(row.amount) !== 0 &&
      !row.is_balanced_parent_pool
    ) {
      warnings.push({
        warning_key: "overhead_line_needs_allocation_type",
        message: `${row.line_label} needs a system allocation type before it can support downstream asset modelling.`,
        line_id: row.line_id,
      });
    }
  });

  group_summaries.forEach((group) => {
    if (group.allocation_pool_status === "over_allocated") {
      warnings.push({
        warning_key: "asset_pool_over_allocated",
        message: `${group.category_label} has more allocated than the P&L source total.`,
        category_key: group.category_key,
      });
    }

    if (group.allocation_pool_status === "partially_allocated") {
      warnings.push({
        warning_key: "asset_pool_partially_allocated",
        message: `${group.category_label} is partially assigned. The remaining amount stays in General Overheads.`,
        category_key: group.category_key,
      });
    }
  });

  return warnings;
}