export function make_allocation_warning(warning_key, message) {
  return {
    warning_key,
    message,
  };
}

export function build_cost_allocation_warnings({
  recovery_summary_ready,
  missing_recovery_plan_target,
  missing_component_required_recovery,
  structure_valid,
  unlinked_staff_count,
  unlinked_asset_count,
  has_low_staff_coverage,
  has_low_asset_coverage,
  has_low_group_coverage,
  has_internal_capacity_shortfall,
  external_delivery_required,
  external_delivery_enabled,
  has_asset_structure_issue,
  duplicate_link_warnings,
  invalid_operational_groups,
}) {
  const setup_warnings = [];
  const structural_warnings = [];

  if (!recovery_summary_ready) {
    setup_warnings.push(
      make_allocation_warning(
        "recovery_summary_not_ready",
        "Recovery Summary is not ready, so Cost Allocation is preview only."
      )
    );
  }

  if (missing_recovery_plan_target) {
    setup_warnings.push(
      make_allocation_warning(
        "missing_recovery_plan_target",
        "Recovery plan target per driver is missing from Recovery Summary."
      )
    );
  }

  if (missing_component_required_recovery) {
    setup_warnings.push(
      make_allocation_warning(
        "missing_component_required_recovery",
        "Component required recovery is missing from Recovery Summary."
      )
    );
  }

  if (!structure_valid) {
    setup_warnings.push(
      make_allocation_warning(
        "structure_incomplete",
        "Complete the staff, asset, and operational group setup required for the selected recovery plan."
      )
    );
  }

  if (unlinked_staff_count > 0) {
    setup_warnings.push(
      make_allocation_warning(
        "orphan_staff",
        "Active productive staff are not fully linked in the allocation structure."
      )
    );
  }

  if (unlinked_asset_count > 0) {
    setup_warnings.push(
      make_allocation_warning(
        "orphan_assets",
        "Active productive assets are not fully linked in the allocation structure."
      )
    );
  }

  if (has_low_staff_coverage) {
    structural_warnings.push(
      make_allocation_warning(
        "low_staff_coverage",
        "Productive staff coverage is low for the visible allocation structure."
      )
    );
  }

  if (has_low_asset_coverage) {
    structural_warnings.push(
      make_allocation_warning(
        "low_asset_coverage",
        "Productive asset coverage is low for the visible allocation structure."
      )
    );
  }

  if (has_low_group_coverage) {
    structural_warnings.push(
      make_allocation_warning(
        "low_group_coverage",
        "Operational group coverage is low for the visible allocation structure."
      )
    );
  }

  if (has_internal_capacity_shortfall) {
    structural_warnings.push(
      make_allocation_warning(
        "internal_capacity_shortfall",
        "The recovery plan requires internal productive capacity beyond current productive staff hours."
      )
    );
  }

  if (external_delivery_required) {
    structural_warnings.push(
      make_allocation_warning(
        "external_delivery_required",
        "This recovery plan requires visible external delivery capacity."
      )
    );
  }

  if (external_delivery_required && !external_delivery_enabled) {
    structural_warnings.push(
      make_allocation_warning(
        "external_delivery_not_defined",
        "External delivery is required, but no external delivery assumption has been confirmed."
      )
    );
  }

  if (has_asset_structure_issue) {
    structural_warnings.push(
      make_allocation_warning(
        "asset_recovery_without_asset_structure",
        "Asset recovery is selected, but productive asset structure or utilisation is not currently supported."
      )
    );
  }

  if (duplicate_link_warnings.length > 0) {
    structural_warnings.push(
      make_allocation_warning(
        "duplicate_active_links",
        "Duplicate active productive asset-staff links exist."
      )
    );
  }

  if (invalid_operational_groups > 0) {
    structural_warnings.push(
      make_allocation_warning(
        "invalid_operational_groups",
        "One or more operational groups are invalid."
      )
    );
  }

  return {
    setup_warnings,
    structural_warnings,
    allocation_warnings: [...setup_warnings, ...structural_warnings],
  };
}
