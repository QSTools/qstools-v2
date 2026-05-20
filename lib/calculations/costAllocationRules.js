import {
  build_cost_allocation_inputs,
  safe_array,
  safe_number,
} from "@/lib/calculations/cost-allocation/costAllocationInputBuilder";
import {
  build_active_maps,
  calculate_coverage_percent,
  get_active_groups,
  get_active_links,
  get_linked_sets,
} from "@/lib/calculations/cost-allocation/costAllocationMaps";
import {
  get_duplicate_link_warnings,
  get_orphan_warnings,
  get_structure_valid,
  has_component_required_recovery,
  normalise_recovery_model,
  validate_groups,
} from "@/lib/calculations/cost-allocation/costAllocationValidation";
import {
  get_allocation_dependency_type,
  get_allocation_status,
} from "@/lib/calculations/cost-allocation/costAllocationStatus";
import { build_cost_allocation_warnings } from "@/lib/calculations/cost-allocation/costAllocationWarnings";

export { build_cost_allocation_inputs };

export function calculate_cost_allocation(inputs = {}) {
  const active_staff = safe_array(inputs?.active_staff);
  const active_assets = safe_array(inputs?.active_assets);

  const { active_staff_map, active_asset_map } = build_active_maps(
    active_staff,
    active_assets
  );

  const active_links = get_active_links(
    inputs?.asset_labour_links,
    active_staff_map,
    active_asset_map
  );

  const duplicate_link_warnings = get_duplicate_link_warnings(active_links);

  const { linked_staff_ids, linked_asset_ids } = get_linked_sets(active_links);

  const active_groups = get_active_groups(inputs?.operational_groups);

  const { validated_groups, group_validation_warnings } = validate_groups({
    active_groups,
    active_asset_map,
    active_staff_map,
  });

  const linked_staff_count = linked_staff_ids.size;
  const linked_asset_count = linked_asset_ids.size;
  const unlinked_staff_count = Math.max(
    active_staff.length - linked_staff_count,
    0
  );
  const unlinked_asset_count = Math.max(
    active_assets.length - linked_asset_count,
    0
  );

  const valid_operational_groups = validated_groups.filter(
    (group) => group?.is_valid
  ).length;

  const invalid_operational_groups = validated_groups.filter(
    (group) => !group?.is_valid
  ).length;

  const orphan_warnings = get_orphan_warnings({
    active_staff,
    active_assets,
    linked_staff_ids,
    linked_asset_ids,
    active_groups: validated_groups,
  });

  const staff_coverage_percent = calculate_coverage_percent(
    linked_staff_count,
    active_staff.length
  );

  const asset_coverage_percent = calculate_coverage_percent(
    linked_asset_count,
    active_assets.length
  );

  const group_coverage_percent = calculate_coverage_percent(
    valid_operational_groups,
    validated_groups.length
  );

  const total_productive_hours = active_staff.reduce(
    (sum, staff) => sum + safe_number(staff?.productive_hours),
    0
  );

  const recovery_summary_ready = inputs?.recovery_summary_ready === true;
  const missing_recovery_plan_target =
    safe_number(inputs?.recovery_plan_target_per_driver) <= 0;
  const missing_component_required_recovery = !has_component_required_recovery(
    inputs?.component_required_recovery
  );

  const labour_share_percent = safe_number(inputs?.labour_share_percent);
  const asset_share_percent = safe_number(inputs?.asset_share_percent);
  const material_share_percent = safe_number(inputs?.material_share_percent);
  const overhead_absorbed_percent = safe_number(
    inputs?.overhead_absorbed_percent ?? inputs?.overhead_share_percent
  );
  const overhead_share_percent = overhead_absorbed_percent;

  const has_internal_capacity_shortfall =
    labour_share_percent > 0 && total_productive_hours <= 0;

  const external_delivery_enabled = inputs?.external_delivery_enabled === true;
  const external_delivery_required = has_internal_capacity_shortfall;

  const asset_recovery_selected =
    asset_share_percent > 0 || inputs?.asset_recovery_included === true;

  const material_recovery_selected =
    material_share_percent > 0 || inputs?.material_recovery_included === true;

  const has_productive_asset_recovery_base =
    inputs?.has_productive_asset_recovery_base === true;

  const has_asset_structure_issue =
    asset_recovery_selected &&
    (!has_productive_asset_recovery_base ||
      active_assets.length === 0 ||
      linked_asset_count === 0 ||
      invalid_operational_groups > 0);

  const structure_valid = get_structure_valid({
    active_recovery_model: inputs?.active_recovery_model,
    asset_recovery_selected,
    duplicate_link_warnings,
    active_staff_count: active_staff.length,
    active_asset_count: active_assets.length,
    linked_staff_count,
    linked_asset_count,
    total_operational_groups: validated_groups.length,
    invalid_operational_groups,
  });

  const has_low_staff_coverage =
    active_staff.length > 0 && staff_coverage_percent < 70;
  const has_low_asset_coverage =
    active_assets.length > 0 && asset_coverage_percent < 70;
  const has_low_group_coverage =
    validated_groups.length > 0 && group_coverage_percent < 70;
  const has_low_coverage =
    has_low_staff_coverage || has_low_asset_coverage || has_low_group_coverage;

  const {
    setup_warnings,
    structural_warnings,
    allocation_warnings,
  } = build_cost_allocation_warnings({
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
  });

  const allocation_dependency_type = get_allocation_dependency_type({
    has_internal_capacity_shortfall,
    external_delivery_required:
      external_delivery_required && external_delivery_enabled,
    has_asset_structure_issue,
  });

  const allocation_status = get_allocation_status({
    recovery_summary_ready,
    missing_recovery_plan_target,
    missing_component_required_recovery,
    structure_valid,
    has_asset_structure_issue,
    has_internal_capacity_shortfall,
    external_delivery_enabled,
    has_low_coverage,
  });

  return {
    active_recovery_model: normalise_recovery_model(
      inputs?.active_recovery_model ?? "labour_led"
    ),
    recovery_model: normalise_recovery_model(
      inputs?.recovery_model ?? inputs?.active_recovery_model ?? "labour_led"
    ),
    recovery_plan_target_per_driver: safe_number(
      inputs?.recovery_plan_target_per_driver
    ),
    recovery_plan_split: inputs?.recovery_plan_split ?? null,
    component_required_recovery: inputs?.component_required_recovery ?? null,

    labour_share_percent,
    asset_share_percent,
    material_share_percent,
    overhead_absorbed_percent,
    overhead_share_percent,

    labour_recovery_cost: safe_number(inputs?.labour_recovery_cost),
    asset_recovery_cost: safe_number(inputs?.asset_recovery_cost),
    material_recovery_cost: safe_number(inputs?.material_recovery_cost),
    overhead_absorbed_cost: safe_number(inputs?.overhead_absorbed_cost),

    required_labour_recovery_rate: safe_number(
      inputs?.required_labour_recovery_rate
    ),
    required_asset_recovery: safe_number(inputs?.required_asset_recovery),
    required_material_recovery: safe_number(inputs?.required_material_recovery),
    recovery_hours_used: safe_number(inputs?.recovery_hours_used),
    required_recovery_rate: safe_number(inputs?.required_recovery_rate),
    actual_recovery_rate: safe_number(inputs?.actual_recovery_rate),
    profit_or_deficit_per_recovery_hour: safe_number(
      inputs?.profit_or_deficit_per_recovery_hour
    ),

    material_recovery_included: material_recovery_selected,
    asset_recovery_included: asset_recovery_selected,
    material_margin_status: inputs?.material_margin_status ?? "not_selected",
    asset_utilisation_status:
      inputs?.asset_utilisation_status ?? "not_selected",

    has_productive_asset_recovery_base,
    productive_asset_count: safe_number(inputs?.productive_asset_count),
    support_asset_count: safe_number(inputs?.support_asset_count),
    productive_asset_cost: safe_number(inputs?.productive_asset_cost),
    support_asset_cost: safe_number(inputs?.support_asset_cost),

    business_type: inputs?.business_type ?? "labour_based",
    activity_driver_type: inputs?.activity_driver_type ?? "hours",
    activity_driver_value: safe_number(inputs?.activity_driver_value),
    margin_pool: safe_number(inputs?.margin_pool),
    total_cost_burden: safe_number(inputs?.total_cost_burden),
    net_position: safe_number(inputs?.net_position),
    model_trust_state: inputs?.model_trust_state ?? "blocked",

    allocation_status,
    allocation_dependency_type,
    setup_warnings,
    structural_warnings,
    allocation_warnings,

    active_allocation_profile_id:
      inputs?.active_allocation_profile_id ?? "live",
    allocation_profile_name:
      inputs?.allocation_profile_name ?? "Default Allocation Profile",
    effective_from: inputs?.effective_from ?? "",

    active_staff,
    active_assets,
    active_asset_labour_links: active_links,
    active_operational_groups: validated_groups,

    linked_staff_count,
    unlinked_staff_count,
    linked_asset_count,
    unlinked_asset_count,

    total_active_staff: active_staff.length,
    total_active_assets: active_assets.length,

    total_operational_groups: validated_groups.length,
    valid_operational_groups,
    invalid_operational_groups,

    duplicate_link_warnings,
    orphan_warnings,
    group_validation_warnings,

    structure_valid,
    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,

    external_delivery_enabled,
    external_delivery_required,
    internal_capacity_shortfall: has_internal_capacity_shortfall,
  };
}
