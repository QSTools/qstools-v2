import {
  get_display_label,
  get_division_counts,
  get_group_first_counts,
  get_recovery_model_label,
  get_status_copy,
} from "@/lib/selectors/cost-allocation/costAllocationDisplayHelpers";

export function build_cost_allocation_status(calculated = {}) {
  const setup_warnings = calculated?.setup_warnings ?? [];
  const structural_warnings = calculated?.structural_warnings ?? [];
  const allocation_warnings = calculated?.allocation_warnings ?? [
    ...setup_warnings,
    ...structural_warnings,
  ];

  const group_first_counts = get_group_first_counts(calculated);
  const division_counts = get_division_counts(calculated);

  const status_copy = get_status_copy(
    calculated?.allocation_status ?? "not_supported",
    setup_warnings.length,
    structural_warnings.length
  );

  return {
    allocation_status: calculated?.allocation_status ?? "not_supported",
    allocation_dependency_type:
      calculated?.allocation_dependency_type ?? "unknown",
    allocation_dependency_label: get_display_label(
      calculated?.allocation_dependency_type ?? "unknown"
    ),
    status_label: status_copy.status_label,

    setup_warnings,
    structural_warnings,
    allocation_warnings,

    active_recovery_model: calculated?.active_recovery_model ?? "labour_led",
    active_recovery_model_label: get_recovery_model_label(
      calculated?.active_recovery_model
    ),

    structure_valid: Boolean(calculated?.structure_valid),

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
    assets_in_operating_groups_count:
      group_first_counts.assigned_productive_asset_count,
    operating_groups_count: calculated?.total_operational_groups ?? 0,

    staff_in_working_units_count:
      group_first_counts.assigned_labour_group_count,
    assets_in_working_units_count:
      group_first_counts.assigned_productive_asset_count,
    working_units_count: calculated?.total_operational_groups ?? 0,

    total_assigned_source_pool: calculated?.total_grouped_operating_cost ?? 0,
    total_remaining_source_pool: calculated?.total_unassigned_cost ?? 0,

    total_grouped_operating_cost: calculated?.total_grouped_operating_cost ?? 0,
    total_unassigned_cost: calculated?.total_unassigned_cost ?? 0,

    linked_staff_count: calculated?.linked_staff_count ?? 0,
    linked_asset_count: calculated?.linked_asset_count ?? 0,
    total_operational_groups: calculated?.total_operational_groups ?? 0,

    setup_warnings_count: setup_warnings.length,
    structural_warnings_count: structural_warnings.length,
    warnings_count: allocation_warnings.length,
    warnings: allocation_warnings,
  };
}