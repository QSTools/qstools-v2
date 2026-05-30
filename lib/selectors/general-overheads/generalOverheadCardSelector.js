import { format_currency } from "./generalOverheadFormatting";

import {
  get_default_category_key,
  get_effective_category_key,
} from "./generalOverheadCategorySelectors";

import { build_grouped_rows } from "./generalOverheadAllocationSelectors";

export function build_general_overhead_status({
  overhead_state,
  saved_overheads,
  calculated,
}) {
  const warnings = [];

  if (!overhead_state.overhead_profile_name?.trim()) {
    warnings.push("Profile name is missing.");
  }

  if ((saved_overheads ?? []).length === 0) {
    warnings.push("No saved overhead profiles yet.");
  }

  const grouped_summary = build_grouped_rows(
    calculated.overhead_rows,
    overhead_state,
    false
  );

  const reclassified_count = (calculated.overhead_rows ?? []).filter((row) => {
    return (
      get_effective_category_key(row, overhead_state) !==
      get_default_category_key(row)
    );
  }).length;

  return {
    is_ready: warnings.length === 0,
    warning_count: warnings.length,
    warnings,
    active_profile_name:
      overhead_state.overhead_profile_name || "Untitled Profile",
    saved_profile_count: (saved_overheads ?? []).length,
    total_general_overheads_display: format_currency(
      calculated.total_general_overheads
    ),
    reclassified_count,
    grouped_summary,
  };
}

export function build_general_overhead_card({
  overhead_state,
  saved_overheads,
  calculated,
  output_contract,
  actions,
}) {
  const grouped_summary = build_grouped_rows(
    calculated.overhead_rows,
    overhead_state,
    false
  );

  const grouped_reclassification = build_grouped_rows(
    calculated.overhead_rows,
    overhead_state,
    true
  );

  return {
    profile: {
      overhead_profile_name: overhead_state.overhead_profile_name,
      effective_from: overhead_state.effective_from,
      is_active: overhead_state.is_active,
      save_profile: actions.save_profile,
      reset_state: actions.reset_state,
      sync_from_pnl: actions.sync_from_pnl,
      update_field: actions.update_field,
    },
    profiles: {
      saved_overheads,
      load_profile: actions.load_profile,
      delete_profile: actions.delete_profile,
    },
    form: {
      overhead_state,
      update_field: actions.update_field,
      update_custom_item: actions.update_custom_item,
      add_custom_item: actions.add_custom_item,
      remove_custom_item: actions.remove_custom_item,
    },
    summary: {
      total_general_overheads: calculated.total_general_overheads,
      total_general_overheads_display: format_currency(
        calculated.total_general_overheads
      ),
      overhead_rows: calculated.overhead_rows.map((row) => ({
        ...row,
        amount_display: format_currency(row.amount),
      })),
      grouped_overhead_rows: grouped_summary,
      output_contract,
    },
    reclassification: {
      title: "Reclassify Overheads",
      help_text:
        "Review and assign portions of broad overhead pools. This working layer does not change the General Overheads total used by Cost Summary.",
      grouped_overhead_rows: grouped_reclassification,
      update_category_override: actions.update_category_override,
      update_system_allocation_override:
        actions.update_system_allocation_override,
      update_system_allocation_amount_override:
        actions.update_system_allocation_amount_override,
    },
  };
}