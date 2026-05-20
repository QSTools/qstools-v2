export function get_allocation_dependency_type({
  has_internal_capacity_shortfall,
  external_delivery_required,
  has_asset_structure_issue,
}) {
  const dependency_types = [];

  if (has_internal_capacity_shortfall) {
    dependency_types.push("internal_capacity");
  }

  if (external_delivery_required) {
    dependency_types.push("external_delivery");
  }

  if (has_asset_structure_issue) {
    dependency_types.push("asset_structure");
  }

  if (dependency_types.length === 0) {
    return "none";
  }

  if (dependency_types.length > 1) {
    return "mixed";
  }

  return dependency_types[0] ?? "unknown";
}

export function get_allocation_status({
  recovery_summary_ready,
  missing_recovery_plan_target,
  missing_component_required_recovery,
  structure_valid,
  has_asset_structure_issue,
  has_internal_capacity_shortfall,
  external_delivery_enabled,
  has_low_coverage,
}) {
  if (
    !recovery_summary_ready ||
    missing_recovery_plan_target ||
    missing_component_required_recovery ||
    has_asset_structure_issue ||
    !structure_valid
  ) {
    return "not_supported";
  }

  if (has_internal_capacity_shortfall && external_delivery_enabled) {
    return "ready_with_dependency";
  }

  if (has_internal_capacity_shortfall || has_low_coverage) {
    return "strained";
  }

  return "ready";
}
