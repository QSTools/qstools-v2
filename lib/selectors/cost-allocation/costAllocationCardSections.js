import {
  format_percent,
  get_display_label,
  get_main_issue,
  get_reason,
  get_recommended_check,
} from "@/lib/selectors/cost-allocation/costAllocationDisplayHelpers";

export function build_outcome_section(context = {}) {
  const {
    calculated,
    allocation_status,
    allocation_dependency_type,
    structure_valid,
    internal_capacity_shortfall,
    external_delivery_enabled,
    external_delivery_required,
    warning_count,
    setup_warnings_count,
    structural_warnings_count,
    status_copy,
    group_first_counts,
    division_counts,
  } = context;

  return {
    headline: status_copy.headline,
    status_label: status_copy.status_label,
    reason: get_reason({
      allocation_status,
      allocation_dependency_type,
      internal_capacity_shortfall,
      setup_warnings_count,
      structural_warnings_count,
    }),
    recommended_check: get_recommended_check({
      allocation_dependency_type,
      external_delivery_required,
      external_delivery_enabled,
      internal_capacity_shortfall,
      structure_valid,
    }),
    allocation_status,
    allocation_dependency_type,
    allocation_status_label: status_copy.status_label,
    allocation_dependency_label: get_display_label(allocation_dependency_type),
    structure_valid,
    internal_capacity_shortfall,
    external_delivery_enabled,
    external_delivery_required,
    warning_count,
    setup_warnings_count,
    structural_warnings_count,

    total_divisions: division_counts.total_divisions,
    valid_divisions: division_counts.valid_divisions,
    invalid_divisions: division_counts.invalid_divisions,
    division_coverage_percent: division_counts.division_coverage_percent,

    productive_labour_group_count:
      group_first_counts.productive_labour_group_count,
    assigned_labour_group_count:
      group_first_counts.assigned_labour_group_count,
    productive_asset_count: group_first_counts.productive_asset_count,
    assigned_productive_asset_count:
      group_first_counts.assigned_productive_asset_count,
  };
}

export function build_recovery_plan_section(context = {}) {
  const { calculated, rate_builder_labour_recovery_rows } = context;

  return {
    active_recovery_model: calculated?.active_recovery_model ?? "labour_led",
    active_recovery_model_label: context.active_recovery_model_label,
    labour_share_percent: calculated?.labour_share_percent ?? 0,
    asset_share_percent: calculated?.asset_share_percent ?? 0,
    material_share_percent: calculated?.material_share_percent ?? 0,
    overhead_absorbed_percent:
      calculated?.overhead_absorbed_percent ??
      calculated?.overhead_share_percent ??
      0,
    labour_recovery_cost: calculated?.labour_recovery_cost ?? 0,
    asset_recovery_cost: calculated?.asset_recovery_cost ?? 0,
    material_recovery_cost: calculated?.material_recovery_cost ?? 0,
    overhead_absorbed_cost: calculated?.overhead_absorbed_cost ?? 0,
    recovery_hours_used: calculated?.recovery_hours_used ?? 0,
    required_recovery_rate: calculated?.required_recovery_rate ?? 0,
    activity_driver_type: calculated?.activity_driver_type ?? "hours",
    activity_driver_label:
      calculated?.activity_driver_type === "units"
        ? "Units sold"
        : "Selected recovery hours",
    business_type: calculated?.business_type ?? "labour_based",

    total_grouped_labour_cost: calculated?.total_grouped_labour_cost ?? 0,
    total_grouped_asset_cost: calculated?.total_grouped_asset_cost ?? 0,
    total_grouped_overhead_cost: calculated?.total_grouped_overhead_cost ?? 0,
    total_grouped_operating_cost:
      calculated?.total_grouped_operating_cost ?? 0,

    rate_builder_labour_recovery_rows,

    unassigned_labour_cost: calculated?.unassigned_labour_cost ?? 0,
    unassigned_asset_cost: calculated?.unassigned_asset_cost ?? 0,
    unassigned_overhead_cost: calculated?.unassigned_overhead_cost ?? 0,
    total_unassigned_cost: calculated?.total_unassigned_cost ?? 0,
  };
}

export function build_allocation_tests_section(context = {}) {
  const { calculated } = context;

  return {
    labour: {
      title: "Labour assignment check",
      selected: calculated?.total_assigned_labour_cost > 0,
      recovery_cost: calculated?.total_assigned_labour_cost ?? 0,
      status_label: get_display_label(calculated?.labour_pool_status),
      message:
        "Productive labour is assigned into operating groups and reconciled against the Productive Labour Pool.",
    },
    asset: {
      title: "Asset assignment check",
      selected: calculated?.total_grouped_asset_cost > 0,
      recovery_cost: calculated?.total_grouped_asset_cost ?? 0,
      status_label: get_display_label(calculated?.asset_pool_status),
      message:
        "Productive asset assignment is reconciled against the Productive Asset Pool.",
    },
    overhead: {
      title: "Overhead distribution check",
      selected: calculated?.total_grouped_overhead_cost > 0,
      recovery_cost: calculated?.total_grouped_overhead_cost ?? 0,
      status_label: get_display_label(calculated?.overhead_pool_status),
      message:
        "Overhead is automatically distributed across operating groups and reconciled against the Overhead Pool.",
    },
  };
}

export function build_labour_assignment_section(context = {}) {
  const { calculated, labour_group_assignments } = context;

  return {
    productive_staff_type_rates: calculated?.productive_labour_type_rows ?? [],
    productive_labour_rows: calculated?.productive_labour_type_rows ?? [],
    labour_group_assignments,
    assignments: labour_group_assignments,

    productive_labour_pool: calculated?.productive_labour_pool ?? null,

    available_labour_cost: calculated?.total_available_labour_cost ?? 0,
    available_labour_hours: calculated?.total_available_labour_hours ?? 0,
    assigned_labour_cost: calculated?.total_assigned_labour_cost ?? 0,
    assigned_labour_hours: calculated?.total_assigned_labour_hours ?? 0,
    remaining_labour_cost: calculated?.total_remaining_labour_cost ?? 0,
    remaining_labour_hours: calculated?.total_remaining_labour_hours ?? 0,
    over_allocated_labour_cost:
      calculated?.total_over_allocated_labour_cost ?? 0,
    over_allocated_labour_hours:
      calculated?.total_over_allocated_labour_hours ?? 0,
    allocation_status:
      calculated?.labour_pool_status ??
      calculated?.productive_labour_pool?.allocation_status ??
      "review_required",
  };
}

export function build_delivery_summary_section(context = {}) {
  const {
    calculated,
    allocation_status,
    allocation_dependency_type,
    structure_valid,
    internal_capacity_shortfall,
    external_delivery_enabled,
    external_delivery_required,
    status_copy,
    group_first_counts,
    division_counts,
  } = context;

  return {
    allocation_status,
    allocation_dependency_type,
    allocation_status_label: status_copy.status_label,
    allocation_dependency_label: get_display_label(allocation_dependency_type),
    structure_valid,
    internal_capacity_shortfall,
    external_delivery_enabled,
    external_delivery_required,

    active_divisions: division_counts.active_divisions,
    division_cost_rows: division_counts.division_cost_rows,

    total_divisions: division_counts.total_divisions,
    valid_divisions: division_counts.valid_divisions,
    invalid_divisions: division_counts.invalid_divisions,
    division_coverage_percent: division_counts.division_coverage_percent,
    division_coverage_label: division_counts.division_coverage_label,

    productive_labour_group_count:
      group_first_counts.productive_labour_group_count,
    assigned_labour_group_count:
      group_first_counts.assigned_labour_group_count,
    productive_asset_count: group_first_counts.productive_asset_count,
    assigned_productive_asset_count:
      group_first_counts.assigned_productive_asset_count,

    staff_in_operating_groups_count:
      group_first_counts.assigned_labour_group_count,
    staff_not_in_operating_groups_count:
      group_first_counts.unassigned_labour_group_count,
    assets_in_operating_groups_count:
      group_first_counts.assigned_productive_asset_count,
    assets_not_in_operating_groups_count:
      group_first_counts.unassigned_productive_asset_count,
    operating_groups_count: calculated?.total_operational_groups ?? 0,
    ready_operating_groups_count: calculated?.valid_operational_groups ?? 0,
    incomplete_operating_groups_count:
      calculated?.invalid_operational_groups ?? 0,

    staff_in_working_units_count:
      group_first_counts.assigned_labour_group_count,
    staff_not_in_working_units_count:
      group_first_counts.unassigned_labour_group_count,
    assets_in_working_units_count:
      group_first_counts.assigned_productive_asset_count,
    assets_not_in_working_units_count:
      group_first_counts.unassigned_productive_asset_count,
    working_units_count: calculated?.total_operational_groups ?? 0,
    ready_working_units_count: calculated?.valid_operational_groups ?? 0,
    incomplete_working_units_count:
      calculated?.invalid_operational_groups ?? 0,

    linked_staff_count: calculated?.linked_staff_count ?? 0,
    unlinked_staff_count: calculated?.unlinked_staff_count ?? 0,
    linked_asset_count: calculated?.linked_asset_count ?? 0,
    unlinked_asset_count: calculated?.unlinked_asset_count ?? 0,
    total_operational_groups: calculated?.total_operational_groups ?? 0,
    valid_operational_groups: calculated?.valid_operational_groups ?? 0,
    invalid_operational_groups: calculated?.invalid_operational_groups ?? 0,

    staff_coverage_percent: calculated?.staff_coverage_percent ?? 0,
    asset_coverage_percent: calculated?.asset_coverage_percent ?? 0,
    group_coverage_percent: calculated?.group_coverage_percent ?? 0,
    staff_coverage_label: format_percent(
      calculated?.staff_coverage_percent ?? 0
    ),
    asset_coverage_label: format_percent(
      calculated?.asset_coverage_percent ?? 0
    ),
    group_coverage_label: format_percent(
      calculated?.group_coverage_percent ?? 0
    ),
  };
}

export function build_evidence_section(context = {}) {
  const {
    calculated,
    allocation_dependency_type,
    allocation_status,
    structure_valid,
    allocation_warnings,
    setup_warnings_count,
    structural_warnings_count,
    unique_setup_warnings,
    unique_structural_warnings,
    unique_warnings,
    division_counts,
    active_operational_groups,
  } = context;

  return {
    main_issue: get_main_issue({
      allocation_dependency_type,
      allocation_status,
      structure_valid,
      allocation_warnings,
      setup_warnings_count,
      structural_warnings_count,
    }),
    setup_warnings: unique_setup_warnings,
    structural_warnings: unique_structural_warnings,
    supporting_warnings: unique_warnings.slice(0, 5),
    additional_warnings: unique_warnings.slice(5),

    active_asset_labour_links: calculated?.active_asset_labour_links ?? [],
    active_divisions: division_counts.active_divisions,
    active_operational_groups,
    division_cost_rows: division_counts.division_cost_rows,
    duplicate_link_warnings: calculated?.duplicate_link_warnings ?? [],
    orphan_warnings: calculated?.orphan_warnings ?? [],
    group_validation_warnings: calculated?.group_validation_warnings ?? [],
    allocation_warnings,
  };
}

export function build_recovery_context_section(context = {}) {
  const { calculated } = context;

  return {
    active_recovery_model: calculated?.active_recovery_model ?? "labour_led",
    labour_share_percent: calculated?.labour_share_percent ?? 0,
    asset_share_percent: calculated?.asset_share_percent ?? 0,
    material_share_percent: calculated?.material_share_percent ?? 0,
    overhead_absorbed_percent:
      calculated?.overhead_absorbed_percent ??
      calculated?.overhead_share_percent ??
      0,
    overhead_share_percent: calculated?.overhead_share_percent ?? 0,
  };
}

export function build_structural_readiness_section(context = {}) {
  const { calculated, structure_valid, group_first_counts, division_counts } =
    context;

  return {
    structure_valid,

    total_divisions: division_counts.total_divisions,
    valid_divisions: division_counts.valid_divisions,
    invalid_divisions: division_counts.invalid_divisions,
    division_coverage_percent: division_counts.division_coverage_percent,
    division_coverage_label: division_counts.division_coverage_label,

    productive_labour_group_count:
      group_first_counts.productive_labour_group_count,
    assigned_labour_group_count:
      group_first_counts.assigned_labour_group_count,
    productive_asset_count: group_first_counts.productive_asset_count,
    assigned_productive_asset_count:
      group_first_counts.assigned_productive_asset_count,

    staff_in_operating_groups_count:
      group_first_counts.assigned_labour_group_count,
    total_active_staff: group_first_counts.productive_labour_group_count,
    assets_in_operating_groups_count:
      group_first_counts.assigned_productive_asset_count,
    total_active_assets: group_first_counts.productive_asset_count,

    linked_staff_count: calculated?.linked_staff_count ?? 0,
    linked_asset_count: calculated?.linked_asset_count ?? 0,

    staff_coverage_percent: calculated?.staff_coverage_percent ?? 0,
    asset_coverage_percent: calculated?.asset_coverage_percent ?? 0,
    group_coverage_percent: calculated?.group_coverage_percent ?? 0,
    staff_coverage_label: format_percent(
      calculated?.staff_coverage_percent ?? 0
    ),
    asset_coverage_label: format_percent(
      calculated?.asset_coverage_percent ?? 0
    ),
    group_coverage_label: format_percent(
      calculated?.group_coverage_percent ?? 0
    ),
    allocation_status: calculated?.allocation_status ?? "not_supported",
    allocation_dependency_type:
      calculated?.allocation_dependency_type ?? "unknown",
    external_delivery_enabled: calculated?.external_delivery_enabled === true,
    external_delivery_required: calculated?.external_delivery_required === true,
    internal_capacity_shortfall:
      calculated?.internal_capacity_shortfall === true,
  };
}

export function build_links_section(context = {}) {
  const { calculated, staff_rows, asset_rows } = context;

  return {
    rows: calculated?.active_asset_labour_links ?? [],
    staff_rows,
    asset_rows,
  };
}

export function build_divisions_section(context = {}) {
  const { division_counts } = context;

  return {
    rows: division_counts.active_divisions,
    division_cost_rows: division_counts.division_cost_rows,

    total_divisions: division_counts.total_divisions,
    valid_divisions: division_counts.valid_divisions,
    invalid_divisions: division_counts.invalid_divisions,

    division_coverage_percent: division_counts.division_coverage_percent,
    division_coverage_label: division_counts.division_coverage_label,
  };
}

export function build_groups_section(context = {}) {
  const { calculated, active_operational_groups, staff_rows, asset_rows } =
    context;

  return {
    rows: active_operational_groups,
    operational_group_cost_rows: calculated?.operational_group_cost_rows ?? [],
    productive_labour_type_rows: calculated?.productive_labour_type_rows ?? [],
    total_operational_groups: calculated?.total_operational_groups ?? 0,
    valid_operational_groups: calculated?.valid_operational_groups ?? 0,
    invalid_operational_groups: calculated?.invalid_operational_groups ?? 0,

    operating_groups_count: calculated?.total_operational_groups ?? 0,
    ready_operating_groups_count: calculated?.valid_operational_groups ?? 0,
    incomplete_operating_groups_count:
      calculated?.invalid_operational_groups ?? 0,

    working_units_count: calculated?.total_operational_groups ?? 0,
    ready_working_units_count: calculated?.valid_operational_groups ?? 0,
    incomplete_working_units_count:
      calculated?.invalid_operational_groups ?? 0,

    asset_rows,
    staff_rows,
  };
}

export function build_problems_section(context = {}) {
  const {
    calculated,
    all_warnings,
    setup_warnings,
    structural_warnings,
    allocation_warnings,
    group_first_counts,
  } = context;

  return {
    warnings: all_warnings,
    setup_warnings,
    structural_warnings,
    allocation_warnings,
    duplicate_link_warnings: calculated?.duplicate_link_warnings ?? [],
    orphan_warnings: calculated?.orphan_warnings ?? [],
    group_validation_warnings: calculated?.group_validation_warnings ?? [],

    staff_not_in_operating_groups_count:
      group_first_counts.unassigned_labour_group_count,
    assets_not_in_operating_groups_count:
      group_first_counts.unassigned_productive_asset_count,

    staff_not_in_working_units_count:
      group_first_counts.unassigned_labour_group_count,
    assets_not_in_working_units_count:
      group_first_counts.unassigned_productive_asset_count,

    unlinked_staff_count: calculated?.unlinked_staff_count ?? 0,
    unlinked_asset_count: calculated?.unlinked_asset_count ?? 0,
  };
}