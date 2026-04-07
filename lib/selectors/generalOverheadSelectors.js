function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

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

  return {
    is_ready: warnings.length === 0,
    warning_count: warnings.length,
    warnings,
    active_profile_name: overhead_state.overhead_profile_name || "Untitled Profile",
    saved_profile_count: (saved_overheads ?? []).length,
    total_general_overheads_display: format_currency(
      calculated.total_general_overheads
    ),
  };
}

export function build_general_overhead_card({
  overhead_state,
  saved_overheads,
  calculated,
  output_contract,
  actions,
}) {
  return {
    profile: {
      overhead_profile_name: overhead_state.overhead_profile_name,
      effective_from: overhead_state.effective_from,
      is_active: overhead_state.is_active,
      save_profile: actions.save_profile,
      reset_state: actions.reset_state,
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
      output_contract,
    },
  };
}