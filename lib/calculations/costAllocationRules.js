import {
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
  calculate_full_attribution_coverage,
  calculate_group_first_coverage,
} from "@/lib/calculations/cost-allocation/costAllocationCoverage";

import {
  build_division_cost_rows,
  get_active_divisions,
  get_division_summary,
  normalise_groups_to_divisions,
} from "@/lib/calculations/cost-allocation/costAllocationDivisionBuilders";

import {
  build_operational_group_cost_rows,
  build_overhead_pool,
  build_non_productive_labour_pool,
  build_non_productive_asset_pool,
  build_productive_asset_pool,
  build_productive_labour_pool,
} from "@/lib/calculations/cost-allocation/costAllocationPoolBuilders";

import {
  get_allocation_dependency_type,
  get_allocation_status,
} from "@/lib/calculations/cost-allocation/costAllocationStatus";

import {
  get_duplicate_link_warnings,
  get_orphan_warnings,
  get_structure_valid,
  has_component_required_recovery,
  validate_groups,
} from "@/lib/calculations/cost-allocation/costAllocationValidation";

import { build_cost_allocation_warnings } from "@/lib/calculations/cost-allocation/costAllocationWarnings";

export function calculate_cost_allocation(inputs = {}) {
  const active_staff = safe_array(inputs.active_staff);
  const active_assets = safe_array(inputs.active_assets);
  const asset_labour_links = safe_array(inputs.asset_labour_links);
  const operational_groups = safe_array(inputs.operational_groups);
  const divisions = safe_array(inputs.divisions);

  const productive_labour_type_rows = safe_array(
    inputs.productive_labour_type_rows
  );

  // S18 6.1 - support_labour_type_rows already flows through
  // useCostAllocation.js (built via build_support_labour_type_rows) but
  // was previously unused by this orchestrator. Now feeds the
  // Non-Productive Labour Pool below.
  const support_labour_type_rows = safe_array(inputs.support_labour_type_rows);

  // S18 6.2 - asset_recovery_rows already contains both productive and
  // support assets (useCostAllocationAssetOverlay.js does not filter by
  // type). Now feeds the Non-Productive Asset Pool below as well as the
  // existing Productive Asset Pool.
  const asset_recovery_rows = safe_array(inputs.asset_recovery_rows);

  const labour_assignment_result = build_productive_labour_pool({
    productive_labour_type_rows,
    labour_group_assignments: inputs.labour_group_assignments,
  });

  // S18 6.1 - Non-Productive Labour Pool. Cost only, never enters the
  // Productive Labour Pool or its reconciliation (see S18 Section 2,
  // supersession note). Reads the same labour_group_assignments array,
  // partitioned by resolve_is_productive_assignment inside the builder.
  const non_productive_labour_assignment_result = build_non_productive_labour_pool({
    support_labour_type_rows,
    labour_group_assignments: inputs.labour_group_assignments,
    productive_labour_type_rows,
  });

  const asset_assignment_result = build_productive_asset_pool({
    asset_recovery_rows,
    asset_group_assignments: inputs.asset_group_assignments,
  });

  // S18 6.2 - Non-Productive Asset Pool. Cost only, never enters the
  // Productive Asset Pool or its reconciliation. Reads the same
  // asset_group_assignments array, partitioned by asset_id membership.
  const non_productive_asset_assignment_result = build_non_productive_asset_pool({
    asset_recovery_rows,
    asset_group_assignments: inputs.asset_group_assignments,
  });

  const { active_staff_map, active_asset_map } = build_active_maps(
    active_staff,
    active_assets
  );

  const active_asset_labour_links = get_active_links(
    asset_labour_links,
    active_staff_map,
    active_asset_map
  );

  const active_divisions = get_active_divisions(divisions);

  const division_normalised_groups = normalise_groups_to_divisions({
    operational_groups,
    active_divisions,
  });

  const active_operational_groups = get_active_groups(
    division_normalised_groups
  );

  const { linked_staff_ids, linked_asset_ids } = get_linked_sets(
    active_asset_labour_links
  );

  const duplicate_link_warnings = get_duplicate_link_warnings(
    active_asset_labour_links
  );

  const { validated_groups, group_validation_warnings } = validate_groups({
    active_groups: active_operational_groups,
    active_asset_map,
    active_staff_map,
  });

  const active_staff_count = active_staff.length;
  const active_asset_count = active_assets.length;

  const linked_staff_count = linked_staff_ids.size;
  const linked_asset_count = linked_asset_ids.size;

  const unlinked_staff_count = Math.max(
    0,
    active_staff_count - linked_staff_count
  );

  const unlinked_asset_count = Math.max(
    0,
    active_asset_count - linked_asset_count
  );

  const total_operational_groups = validated_groups.length;

  const valid_operational_groups = validated_groups.filter(
    (group) => group.is_valid
  ).length;

  const invalid_operational_groups = Math.max(
    0,
    total_operational_groups - valid_operational_groups
  );

  const group_first_coverage = calculate_group_first_coverage({
    productive_labour_type_rows,
    labour_group_assignments: labour_assignment_result.labour_group_assignments,
    asset_recovery_rows,
    asset_group_assignments: asset_assignment_result.asset_group_assignments,
    valid_operational_groups,
    total_operational_groups,
  });

  const {
    productive_labour_group_count,
    assigned_labour_group_count,
    productive_asset_count,
    assigned_productive_asset_count,
    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,
  } = group_first_coverage;

  // S18 6.3 - mandatory "everything assigned" coverage. Deliberately a
  // new, separate calculation - staff_coverage_percent/asset_coverage_
  // percent above are left completely untouched (still productive-only,
  // still feed Recovery Summary/Rate Builder/Business Outcome exactly
  // as before). Uses the raw, unfiltered assignment arrays (not the
  // productive-only enriched ones above) since this metric must count
  // an assignment of either productive or non-productive origin.
  const full_attribution_coverage = calculate_full_attribution_coverage({
    productive_labour_type_rows,
    support_labour_type_rows,
    labour_group_assignments: inputs.labour_group_assignments,
    asset_recovery_rows,
    asset_group_assignments: inputs.asset_group_assignments,
  });

  const {
    full_cost_attribution_coverage_percent,
    total_labour_group_count_all,
    assigned_labour_group_count_all,
    unassigned_labour_group_count_all,
    total_asset_count_all,
    assigned_asset_count_all,
    unassigned_asset_count_all,
  } = full_attribution_coverage;

  const base_operational_group_cost_rows = build_operational_group_cost_rows({
    active_groups: validated_groups,
    labour_group_assignments:
      labour_assignment_result.labour_group_assignments,
    non_productive_labour_group_assignments:
      non_productive_labour_assignment_result.non_productive_labour_group_assignments,
    asset_group_assignments: asset_assignment_result.asset_group_assignments,
    non_productive_asset_group_assignments:
      non_productive_asset_assignment_result.non_productive_asset_group_assignments,
    overhead_group_assignments: [],
  });

  const overhead_assignment_result = build_overhead_pool({
    overhead_absorbed_cost: inputs.overhead_absorbed_cost,
    overhead_group_assignments: inputs.overhead_group_assignments,
    operational_group_cost_rows: base_operational_group_cost_rows,
  });

  const labour_pool_over_allocated =
    labour_assignment_result.labour_pool_status === "over_allocated";

  const asset_pool_over_allocated =
    asset_assignment_result.asset_pool_status === "over_allocated";

  const overhead_pool_over_allocated =
    overhead_assignment_result.overhead_pool_status === "over_allocated";

  const has_over_allocated_source_pool =
    labour_pool_over_allocated ||
    asset_pool_over_allocated ||
    overhead_pool_over_allocated;

  const active_recovery_model =
    inputs.active_recovery_model || inputs.recovery_model || "labour_only";

  const asset_recovery_selected =
    safe_number(inputs.asset_share_percent) > 0 ||
    inputs.asset_recovery_included === true;

  const base_structure_valid = get_structure_valid({
    active_recovery_model,
    asset_recovery_selected,
    duplicate_link_warnings,
    total_operational_groups,
    invalid_operational_groups,
    productive_labour_group_count,
    assigned_labour_group_count,
    productive_asset_count,
    assigned_productive_asset_count,
  });

  const structure_valid =
    base_structure_valid && !has_over_allocated_source_pool;

  const orphan_warnings = get_orphan_warnings({
    active_staff,
    active_assets,
    linked_staff_ids,
    linked_asset_ids,
    active_groups: validated_groups,
  });

  const missing_recovery_plan_target =
    safe_number(inputs.recovery_plan_target_per_driver) <= 0 &&
    safe_number(inputs.required_recovery_rate) <= 0;

  const missing_component_required_recovery =
    !has_component_required_recovery(inputs.component_required_recovery);

  const has_low_staff_coverage =
    productive_labour_group_count > 0 && staff_coverage_percent < 70;

  const has_low_asset_coverage =
    productive_asset_count > 0 &&
    asset_recovery_selected &&
    asset_coverage_percent < 70;

  const has_low_group_coverage =
    total_operational_groups > 0 && group_coverage_percent < 70;

  const has_no_operational_groups = total_operational_groups === 0;

  const has_no_labour_cost =
    labour_assignment_result.total_available_labour_cost <= 0;

  const has_no_productive_labour_driver =
    productive_labour_type_rows.length === 0;

  const has_asset_structure_issue =
    asset_recovery_selected &&
    (productive_asset_count === 0 ||
      assigned_productive_asset_count === 0 ||
      invalid_operational_groups > 0);

  const has_internal_capacity_shortfall = false;
  const external_delivery_required = false;

  const has_unassigned_cost =
    labour_assignment_result.total_remaining_labour_cost > 1 ||
    asset_assignment_result.total_remaining_asset_cost > 1 ||
    overhead_assignment_result.total_remaining_overhead_cost > 1;

  const has_productive_asset_zero_utilisation = false;
  const has_asset_without_labour_driver_group = false;
  const has_labour_without_productive_capacity_group = false;

  const allocation_dependency_type = get_allocation_dependency_type({
    has_internal_capacity_shortfall,
    external_delivery_required,
    has_asset_structure_issue,
  });

  const source_pool_warnings = [];

  if (labour_pool_over_allocated) {
    source_pool_warnings.push({
      warning_key: "productive_labour_pool_over_allocated",
      message:
        "Productive Labour Pool is over-allocated. Reduce assigned labour percentage before relying on this allocation.",
    });
  }

  if (asset_pool_over_allocated) {
    source_pool_warnings.push({
      warning_key: "productive_asset_pool_over_allocated",
      message:
        "Productive Asset Pool is over-allocated. Reduce asset assignment percentages before relying on this allocation.",
    });
  }

  if (overhead_pool_over_allocated) {
    source_pool_warnings.push({
      warning_key: "overhead_pool_over_allocated",
      message:
        "Overhead Pool is over-allocated. Reduce assigned overhead before relying on this allocation.",
    });
  }

  if (
    non_productive_labour_assignment_result.non_productive_labour_pool_status ===
    "over_allocated"
  ) {
    source_pool_warnings.push({
      warning_key: "non_productive_labour_pool_over_allocated",
      message:
        "Non-Productive Labour Pool is over-allocated. Reduce assigned percentage before relying on this allocation.",
    });
  }

  if (
    non_productive_asset_assignment_result.non_productive_asset_pool_status ===
    "over_allocated"
  ) {
    source_pool_warnings.push({
      warning_key: "non_productive_asset_pool_over_allocated",
      message:
        "Non-Productive Asset Pool is over-allocated. Reduce assigned percentage before relying on this allocation.",
    });
  }

  const built_warnings = build_cost_allocation_warnings({
    recovery_summary_ready: inputs.recovery_summary_ready,
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
    external_delivery_enabled: inputs.external_delivery_enabled === true,
    has_asset_structure_issue,
    has_no_labour_cost,
    has_no_productive_labour_driver,
    has_productive_asset_zero_utilisation,
    has_asset_without_labour_driver_group,
    has_labour_without_productive_capacity_group,
    has_unassigned_cost,
    has_no_operational_groups,
    duplicate_link_warnings,
    invalid_operational_groups,
  });

  const setup_warnings = [
    ...safe_array(built_warnings.setup_warnings),
    ...source_pool_warnings,
  ];

  const structural_warnings = safe_array(built_warnings.structural_warnings);

  const allocation_warnings = [...setup_warnings, ...structural_warnings];

  const base_allocation_status = get_allocation_status({
    recovery_summary_ready: inputs.recovery_summary_ready,
    missing_recovery_plan_target,
    missing_component_required_recovery,
    structure_valid,
    has_asset_structure_issue,
    has_internal_capacity_shortfall,
    external_delivery_enabled: inputs.external_delivery_enabled === true,
    has_low_coverage:
      has_low_staff_coverage || has_low_asset_coverage || has_low_group_coverage,
  });

  const allocation_status = has_over_allocated_source_pool
    ? "blocked"
    : base_allocation_status;

  const operational_group_cost_rows = build_operational_group_cost_rows({
    active_groups: validated_groups,
    labour_group_assignments:
      labour_assignment_result.labour_group_assignments,
    non_productive_labour_group_assignments:
      non_productive_labour_assignment_result.non_productive_labour_group_assignments,
    asset_group_assignments: asset_assignment_result.asset_group_assignments,
    non_productive_asset_group_assignments:
      non_productive_asset_assignment_result.non_productive_asset_group_assignments,
    overhead_group_assignments:
      overhead_assignment_result.overhead_group_assignments,
  });

  const division_cost_rows = build_division_cost_rows({
    active_divisions,
    operational_group_cost_rows,
  });

  const {
    total_divisions,
    valid_divisions,
    invalid_divisions,
    division_coverage_percent,
  } = get_division_summary({
    active_divisions,
    division_cost_rows,
    calculate_coverage_percent,
  });

  const total_grouped_labour_cost =
    labour_assignment_result.total_assigned_labour_cost;

  const total_grouped_asset_cost =
    asset_assignment_result.total_assigned_asset_cost;

  const total_grouped_overhead_cost =
    overhead_assignment_result.total_assigned_overhead_cost;

  // S18 6.1/6.2 - kept as their own totals, not folded into
  // total_grouped_operating_cost's existing consumers implicitly; added
  // as explicit new figures below so nothing that already reads
  // total_grouped_operating_cost changes meaning by surprise.
  const total_grouped_non_productive_labour_cost =
    non_productive_labour_assignment_result.total_assigned_non_productive_labour_cost;

  const total_grouped_non_productive_asset_cost =
    non_productive_asset_assignment_result.total_assigned_non_productive_asset_cost;

  const total_grouped_operating_cost =
    total_grouped_labour_cost +
    total_grouped_asset_cost +
    total_grouped_overhead_cost +
    total_grouped_non_productive_labour_cost +
    total_grouped_non_productive_asset_cost;

  const unassigned_labour_cost =
    labour_assignment_result.total_remaining_labour_cost;

  const unassigned_asset_cost =
    asset_assignment_result.total_remaining_asset_cost;

  const unassigned_overhead_cost =
    overhead_assignment_result.total_remaining_overhead_cost;

  // S18 6.1/6.2 - new, separate fields. unassigned_labour_cost and
  // unassigned_asset_cost above are left untouched (still productive-
  // only) per S18 Section 5.2 decision: existing coverage/reconciliation
  // fields keep their exact current meaning.
  const unassigned_non_productive_labour_cost =
    non_productive_labour_assignment_result.total_remaining_non_productive_labour_cost;

  const unassigned_non_productive_asset_cost =
    non_productive_asset_assignment_result.total_remaining_non_productive_asset_cost;

  const total_unassigned_cost =
    unassigned_labour_cost + unassigned_asset_cost + unassigned_overhead_cost;

  return {
    ...inputs,

    active_recovery_model,
    allocation_status,
    allocation_dependency_type,

    setup_warnings,
    structural_warnings,
    allocation_warnings,

    active_asset_labour_links,
    active_divisions,
    active_operating_groups: validated_groups,
    active_operational_groups: validated_groups,

    linked_staff_count,
    unlinked_staff_count,
    linked_asset_count,
    unlinked_asset_count,

    productive_labour_group_count,
    assigned_labour_group_count,
    productive_asset_count,
    assigned_productive_asset_count,

    total_divisions,
    valid_divisions,
    invalid_divisions,
    division_coverage_percent,

    total_operational_groups,
    valid_operational_groups,
    invalid_operational_groups,

    duplicate_link_warnings,
    orphan_warnings,
    group_validation_warnings,

    structure_valid,
    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,

    // S18 6.3 - Full Cost Attribution Coverage output, fully additive.
    // staff_coverage_percent/asset_coverage_percent/group_coverage_percent
    // above are completely unchanged in meaning and value.
    full_cost_attribution_coverage_percent,
    total_labour_group_count_all,
    assigned_labour_group_count_all,
    unassigned_labour_group_count_all,
    total_asset_count_all,
    assigned_asset_count_all,
    unassigned_asset_count_all,

    external_delivery_enabled: inputs.external_delivery_enabled === true,
    external_delivery_required,
    internal_capacity_shortfall: has_internal_capacity_shortfall,

    productive_labour_type_rows,
    productive_labour_pool: labour_assignment_result.productive_labour_pool,
    labour_group_assignments:
      labour_assignment_result.labour_group_assignments,

    total_available_labour_cost:
      labour_assignment_result.total_available_labour_cost,
    total_available_labour_hours:
      labour_assignment_result.total_available_labour_hours,
    total_assigned_labour_cost:
      labour_assignment_result.total_assigned_labour_cost,
    total_assigned_labour_hours:
      labour_assignment_result.total_assigned_labour_hours,
    total_remaining_labour_cost:
      labour_assignment_result.total_remaining_labour_cost,
    total_remaining_labour_hours:
      labour_assignment_result.total_remaining_labour_hours,
    total_over_allocated_labour_cost:
      labour_assignment_result.total_over_allocated_labour_cost,
    total_over_allocated_labour_hours:
      labour_assignment_result.total_over_allocated_labour_hours,
    labour_pool_status: labour_assignment_result.labour_pool_status,

    // S18 6.1 - Non-Productive Labour Pool output, fully additive.
    support_labour_type_rows,
    non_productive_labour_pool:
      non_productive_labour_assignment_result.non_productive_labour_pool,
    non_productive_labour_group_assignments:
      non_productive_labour_assignment_result.non_productive_labour_group_assignments,

    total_available_non_productive_labour_cost:
      non_productive_labour_assignment_result.total_available_non_productive_labour_cost,
    total_assigned_non_productive_labour_cost:
      non_productive_labour_assignment_result.total_assigned_non_productive_labour_cost,
    total_remaining_non_productive_labour_cost:
      non_productive_labour_assignment_result.total_remaining_non_productive_labour_cost,
    total_over_allocated_non_productive_labour_cost:
      non_productive_labour_assignment_result.total_over_allocated_non_productive_labour_cost,
    non_productive_labour_pool_status:
      non_productive_labour_assignment_result.non_productive_labour_pool_status,

    unassigned_non_productive_labour_cost,
    total_grouped_non_productive_labour_cost,

    // S18 6.2 - Non-Productive Asset Pool output, fully additive.
    non_productive_asset_pool:
      non_productive_asset_assignment_result.non_productive_asset_pool,
    non_productive_asset_group_assignments:
      non_productive_asset_assignment_result.non_productive_asset_group_assignments,

    total_available_non_productive_asset_cost:
      non_productive_asset_assignment_result.total_available_non_productive_asset_cost,
    total_assigned_non_productive_asset_cost:
      non_productive_asset_assignment_result.total_assigned_non_productive_asset_cost,
    total_remaining_non_productive_asset_cost:
      non_productive_asset_assignment_result.total_remaining_non_productive_asset_cost,
    total_over_allocated_non_productive_asset_cost:
      non_productive_asset_assignment_result.total_over_allocated_non_productive_asset_cost,
    non_productive_asset_pool_status:
      non_productive_asset_assignment_result.non_productive_asset_pool_status,

    unassigned_non_productive_asset_cost,
    total_grouped_non_productive_asset_cost,

    productive_asset_pool: asset_assignment_result.productive_asset_pool,
    asset_group_assignments:
      asset_assignment_result.asset_group_assignments,

    total_available_asset_cost:
      asset_assignment_result.total_available_asset_cost,
    total_available_asset_hours:
      asset_assignment_result.total_available_asset_hours,
    total_assigned_asset_cost:
      asset_assignment_result.total_assigned_asset_cost,
    total_assigned_asset_hours:
      asset_assignment_result.total_assigned_asset_hours,
    total_remaining_asset_cost:
      asset_assignment_result.total_remaining_asset_cost,
    total_remaining_asset_hours:
      asset_assignment_result.total_remaining_asset_hours,
    total_over_allocated_asset_cost:
      asset_assignment_result.total_over_allocated_asset_cost,
    total_over_allocated_asset_hours:
      asset_assignment_result.total_over_allocated_asset_hours,
    asset_pool_status: asset_assignment_result.asset_pool_status,

    overhead_pool: overhead_assignment_result.overhead_pool,
    overhead_group_assignments:
      overhead_assignment_result.overhead_group_assignments,

    total_available_overhead_cost:
      overhead_assignment_result.total_available_overhead_cost,
    total_assigned_overhead_cost:
      overhead_assignment_result.total_assigned_overhead_cost,
    total_remaining_overhead_cost:
      overhead_assignment_result.total_remaining_overhead_cost,
    total_over_allocated_overhead_cost:
      overhead_assignment_result.total_over_allocated_overhead_cost,
    overhead_pool_status: overhead_assignment_result.overhead_pool_status,

    labour_pool_over_allocated,
    asset_pool_over_allocated,
    overhead_pool_over_allocated,
    has_over_allocated_source_pool,

    division_cost_rows,
    operational_group_cost_rows,

    total_grouped_labour_cost,
    total_grouped_asset_cost,
    total_grouped_overhead_cost,
    total_grouped_operating_cost,

    unassigned_labour_cost,
    unassigned_asset_cost,
    unassigned_overhead_cost,
    total_unassigned_cost,

    cost_allocation_ready:
      allocation_status === "ready" ||
      allocation_status === "ready_with_dependency",
  };
}