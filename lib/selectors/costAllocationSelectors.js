function format_percent(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "0.0%";
}

export function build_cost_allocation_status(calculated = {}) {
  const warnings = [
    ...(calculated?.duplicate_link_warnings ?? []),
    ...(calculated?.orphan_warnings ?? []),
    ...(calculated?.group_validation_warnings ?? []),
  ];

  return {
    active_recovery_model: calculated?.active_recovery_model ?? "labour_only",
    structure_valid: Boolean(calculated?.structure_valid),
    linked_staff_count: calculated?.linked_staff_count ?? 0,
    linked_asset_count: calculated?.linked_asset_count ?? 0,
    total_operational_groups: calculated?.total_operational_groups ?? 0,
    warnings_count: warnings.length,
    warnings,
  };
}

export function build_cost_allocation_card(calculated = {}) {
  const all_warnings = [
    ...(calculated?.duplicate_link_warnings ?? []),
    ...(calculated?.orphan_warnings ?? []),
    ...(calculated?.group_validation_warnings ?? []),
  ];

  const staff_rows = (calculated?.active_staff ?? []).map((staff) => {
    const is_linked = (calculated?.active_asset_labour_links ?? []).some(
      (link) => link?.staff_id === staff?.staff_id,
    );

    return {
      ...staff,
      is_linked,
    };
  });

  const asset_rows = (calculated?.active_assets ?? []).map((asset) => {
    const is_linked = (calculated?.active_asset_labour_links ?? []).some(
      (link) => link?.asset_id === asset?.asset_id,
    );

    return {
      ...asset,
      is_linked,
    };
  });

  return {
    recovery_context: {
      active_recovery_model: calculated?.active_recovery_model ?? "labour_only",
      labour_share_percent: calculated?.labour_share_percent ?? 0,
      asset_share_percent: calculated?.asset_share_percent ?? 0,
      overhead_share_percent: calculated?.overhead_share_percent ?? 0,
    },

    structural_readiness: {
      structure_valid: Boolean(calculated?.structure_valid),
      linked_staff_count: calculated?.linked_staff_count ?? 0,
      total_active_staff: calculated?.total_active_staff ?? 0,
      linked_asset_count: calculated?.linked_asset_count ?? 0,
      total_active_assets: calculated?.total_active_assets ?? 0,
      staff_coverage_percent: calculated?.staff_coverage_percent ?? 0,
      asset_coverage_percent: calculated?.asset_coverage_percent ?? 0,
      group_coverage_percent: calculated?.group_coverage_percent ?? 0,
      staff_coverage_label: format_percent(calculated?.staff_coverage_percent ?? 0),
      asset_coverage_label: format_percent(calculated?.asset_coverage_percent ?? 0),
      group_coverage_label: format_percent(calculated?.group_coverage_percent ?? 0),
    },

    links: {
      rows: calculated?.active_asset_labour_links ?? [],
      staff_rows,
      asset_rows,
    },

    groups: {
      rows: calculated?.active_operational_groups ?? [],
      total_operational_groups: calculated?.total_operational_groups ?? 0,
      valid_operational_groups: calculated?.valid_operational_groups ?? 0,
      invalid_operational_groups: calculated?.invalid_operational_groups ?? 0,
      asset_rows,
    },

    problems: {
      warnings: all_warnings,
      duplicate_link_warnings: calculated?.duplicate_link_warnings ?? [],
      orphan_warnings: calculated?.orphan_warnings ?? [],
      group_validation_warnings: calculated?.group_validation_warnings ?? [],
      unlinked_staff_count: calculated?.unlinked_staff_count ?? 0,
      unlinked_asset_count: calculated?.unlinked_asset_count ?? 0,
    },
  };
}