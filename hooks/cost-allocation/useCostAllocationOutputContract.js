"use client";

import { safe_array } from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";

export function build_cost_allocation_output_contract({ calculated, state }) {
  return {
    allocation_status: calculated.allocation_status,
    allocation_dependency_type: calculated.allocation_dependency_type,
    setup_warnings: calculated.setup_warnings,
    structural_warnings: calculated.structural_warnings,
    allocation_warnings: calculated.allocation_warnings,

    active_recovery_model: calculated.active_recovery_model,
    recovery_plan_target_per_driver:
      calculated.recovery_plan_target_per_driver,
    recovery_plan_split: calculated.recovery_plan_split,
    component_required_recovery: calculated.component_required_recovery,

    labour_share_percent: calculated.labour_share_percent,
    asset_share_percent: calculated.asset_share_percent,
    material_share_percent: calculated.material_share_percent,
    overhead_absorbed_percent: calculated.overhead_absorbed_percent,

    labour_recovery_cost: calculated.labour_recovery_cost,
    asset_recovery_cost: calculated.asset_recovery_cost,
    material_recovery_cost: calculated.material_recovery_cost,
    overhead_absorbed_cost: calculated.overhead_absorbed_cost,

    recovery_hours_used: calculated.recovery_hours_used,
    required_recovery_rate: calculated.required_recovery_rate,
    actual_recovery_rate: calculated.actual_recovery_rate,
    profit_or_deficit_per_recovery_hour:
      calculated.profit_or_deficit_per_recovery_hour,

    material_recovery_included: calculated.material_recovery_included,
    asset_recovery_included: calculated.asset_recovery_included,
    material_margin_status: calculated.material_margin_status,
    asset_utilisation_status: calculated.asset_utilisation_status,

    has_productive_asset_recovery_base:
      calculated.has_productive_asset_recovery_base,
    productive_asset_count: calculated.productive_asset_count,
    support_asset_count: calculated.support_asset_count,

    productive_asset_base_cost: calculated.productive_asset_base_cost,
    support_asset_base_cost: calculated.support_asset_base_cost,
    productive_asset_allocated_overhead_cost:
      calculated.productive_asset_allocated_overhead_cost,
    support_asset_allocated_overhead_cost:
      calculated.support_asset_allocated_overhead_cost,
    productive_asset_recovery_cost: calculated.productive_asset_recovery_cost,
    support_asset_recovery_cost: calculated.support_asset_recovery_cost,
    total_allocated_asset_overhead_cost:
      calculated.total_allocated_asset_overhead_cost,
    total_asset_recovery_cost: calculated.total_asset_recovery_cost,

    asset_recovery_rows: calculated.asset_recovery_rows,
    productive_labour_type_rows: calculated.productive_labour_type_rows,
    operational_group_recovery_rows:
      calculated.operational_group_recovery_rows,
    operational_group_cost_rows: calculated.operational_group_cost_rows,

    labour_group_assignments: safe_array(state?.labour_group_assignments),
    asset_group_assignments: safe_array(state?.asset_group_assignments),
    overhead_group_assignments: safe_array(state?.overhead_group_assignments),

    productive_labour_pool: calculated.productive_labour_pool,
    productive_asset_pool: calculated.productive_asset_pool,
    overhead_pool: calculated.overhead_pool,

    cost_allocation_ready:
      calculated.allocation_status === "ready" ||
      calculated.allocation_status === "ready_with_dependency",
    cost_allocation_warnings: calculated.allocation_warnings,

    divisions: safe_array(state?.divisions),
    active_divisions: calculated.active_divisions,
    division_cost_rows: calculated.division_cost_rows,

    total_divisions: calculated.total_divisions,
    valid_divisions: calculated.valid_divisions,
    invalid_divisions: calculated.invalid_divisions,
    division_coverage_percent: calculated.division_coverage_percent,

    operational_groups: calculated.active_operational_groups,
    active_operating_groups: calculated.active_operating_groups,
    active_operational_groups: calculated.active_operational_groups,

    total_grouped_labour_cost: calculated.total_grouped_labour_cost,
    total_grouped_asset_cost: calculated.total_grouped_asset_cost,
    total_grouped_overhead_cost: calculated.total_grouped_overhead_cost,
    total_grouped_operating_cost: calculated.total_grouped_operating_cost,
    unassigned_labour_cost: calculated.unassigned_labour_cost,
    unassigned_asset_cost: calculated.unassigned_asset_cost,
    unassigned_overhead_cost: calculated.unassigned_overhead_cost,
    unassigned_non_productive_labour_cost: calculated.unassigned_non_productive_labour_cost,
    unassigned_non_productive_asset_cost: calculated.unassigned_non_productive_asset_cost,
    labour_pool_over_allocated: calculated.labour_pool_over_allocated,
    asset_pool_over_allocated: calculated.asset_pool_over_allocated,
    total_unassigned_cost: calculated.total_unassigned_cost,
    productive_asset_utilisation_hours_annual:
      calculated.productive_asset_utilisation_hours_annual,
    group_recovery_basis_label: calculated.group_recovery_basis_label,
    group_required_recovery_rate: calculated.group_required_recovery_rate,

    productive_asset_cost: calculated.productive_asset_cost,
    support_asset_cost: calculated.support_asset_cost,

    active_allocation_profile_id: calculated.active_allocation_profile_id,
    active_asset_labour_links: calculated.active_asset_labour_links,

    linked_staff_count: calculated.linked_staff_count,
    unlinked_staff_count: calculated.unlinked_staff_count,
    linked_asset_count: calculated.linked_asset_count,
    unlinked_asset_count: calculated.unlinked_asset_count,

    total_operational_groups: calculated.total_operational_groups,
    valid_operational_groups: calculated.valid_operational_groups,
    invalid_operational_groups: calculated.invalid_operational_groups,

    duplicate_link_warnings: calculated.duplicate_link_warnings,
    orphan_warnings: calculated.orphan_warnings,
    group_validation_warnings: calculated.group_validation_warnings,

    structure_valid: calculated.structure_valid,
    staff_coverage_percent: calculated.staff_coverage_percent,
    asset_coverage_percent: calculated.asset_coverage_percent,
    group_coverage_percent: calculated.group_coverage_percent,

    external_delivery_enabled: calculated.external_delivery_enabled,
    external_delivery_required: calculated.external_delivery_required,
    internal_capacity_shortfall: calculated.internal_capacity_shortfall,
  };
}


