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
  has_low_staff_coverage,
  has_low_asset_coverage,
  has_low_group_coverage,
  has_internal_capacity_shortfall,
  external_delivery_required,
  external_delivery_enabled,
  has_asset_structure_issue,
  has_no_labour_cost,
  has_no_productive_labour_driver,
  has_productive_asset_zero_utilisation,
  has_asset_without_labour_driver_group,
  has_labour_without_productive_capacity_group,
  has_unassigned_cost,
  has_no_operational_groups,
  duplicate_link_warnings = [],
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
        "Complete the operating groups and productive source-pool assignments required for the selected recovery plan."
      )
    );
  }

  if (has_no_labour_cost) {
    setup_warnings.push(
      make_allocation_warning(
        "no_labour_cost_available",
        "No productive labour cost is available for Cost Allocation."
      )
    );
  }

  if (has_no_productive_labour_driver) {
    setup_warnings.push(
      make_allocation_warning(
        "no_productive_labour_driver_available",
        "No productive labour group is available for operating groups."
      )
    );
  }

  if (has_no_operational_groups) {
    setup_warnings.push(
      make_allocation_warning(
        "no_operational_groups_created",
        "No operating groups have been created yet."
      )
    );
  }

  if (has_low_staff_coverage) {
    structural_warnings.push(
      make_allocation_warning(
        "low_productive_labour_coverage",
        "Productive labour group coverage is low for the visible operating groups."
      )
    );
  }

  if (has_low_asset_coverage) {
    structural_warnings.push(
      make_allocation_warning(
        "low_productive_asset_coverage",
        "Productive asset coverage is low for the visible operating groups."
      )
    );
  }

  if (has_low_group_coverage) {
    structural_warnings.push(
      make_allocation_warning(
        "low_operating_group_coverage",
        "Operating group coverage is low for the visible allocation structure."
      )
    );
  }

  if (has_internal_capacity_shortfall) {
    structural_warnings.push(
      make_allocation_warning(
        "internal_capacity_shortfall",
        "The recovery plan requires internal productive capacity beyond the current operating groups."
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
        "asset_recovery_without_productive_asset_structure",
        "Asset recovery is selected, but productive assets have not been assigned into the operating groups."
      )
    );
  }

  if (has_productive_asset_zero_utilisation) {
    structural_warnings.push(
      make_allocation_warning(
        "productive_asset_zero_utilisation",
        "One or more productive assets have zero utilisation hours."
      )
    );
  }

  if (has_asset_without_labour_driver_group) {
    structural_warnings.push(
      make_allocation_warning(
        "operating_group_asset_without_labour_driver",
        "One or more operating groups has productive assets but no labour driver."
      )
    );
  }

  if (has_labour_without_productive_capacity_group) {
    structural_warnings.push(
      make_allocation_warning(
        "operating_group_labour_without_productive_capacity",
        "One or more operating groups has labour selected but no productive capacity."
      )
    );
  }

  if (has_unassigned_cost) {
    structural_warnings.push(
      make_allocation_warning(
        "unassigned_operating_cost",
        "Some productive labour, asset, or overhead cost remains outside operating groups."
      )
    );
  }

  if (duplicate_link_warnings.length > 0) {
    structural_warnings.push(
      make_allocation_warning(
        "duplicate_advanced_capability_links",
        "Duplicate advanced capability links exist. This does not block the group-first builder, but should be reviewed before using capability-link validation."
      )
    );
  }

  if (invalid_operational_groups > 0) {
    structural_warnings.push(
      make_allocation_warning(
        "invalid_operating_groups",
        "One or more operating groups are invalid."
      )
    );
  }

  return {
    setup_warnings,
    structural_warnings,
    allocation_warnings: [...setup_warnings, ...structural_warnings],
  };
}