import {
  get_active_assignment_rows,
  get_division_counts,
  get_group_first_counts,
  get_recovery_model_label,
  get_status_copy,
  get_unique_warnings,
} from "@/lib/selectors/cost-allocation/costAllocationDisplayHelpers";

import { build_rate_builder_labour_recovery_rows } from "@/lib/selectors/cost-allocation/costAllocationRateBuilderSelectors";

import {
  build_allocation_tests_section,
  build_delivery_summary_section,
  build_divisions_section,
  build_evidence_section,
  build_groups_section,
  build_labour_assignment_section,
  build_links_section,
  build_outcome_section,
  build_problems_section,
  build_recovery_context_section,
  build_recovery_plan_section,
  build_structural_readiness_section,
} from "@/lib/selectors/cost-allocation/costAllocationCardSections";

function build_staff_rows(calculated = {}, active_operational_groups = []) {
  return (calculated?.active_staff ?? []).map((staff) => {
    const is_in_operating_group = active_operational_groups.some((group) => {
      return Array.isArray(group?.required_staff_ids)
        ? group.required_staff_ids.includes(staff?.staff_id)
        : false;
    });

    return {
      ...staff,
      is_linked: is_in_operating_group,
      is_in_operating_group,
      is_in_working_unit: is_in_operating_group,
    };
  });
}

function build_asset_rows(calculated = {}, active_operational_groups = []) {
  return (calculated?.active_assets ?? []).map((asset) => {
    const is_in_operating_group = active_operational_groups.some((group) => {
      return Array.isArray(group?.required_asset_ids)
        ? group.required_asset_ids.includes(asset?.asset_id)
        : false;
    });

    return {
      ...asset,
      is_linked: is_in_operating_group,
      is_in_operating_group,
      is_in_working_unit: is_in_operating_group,
    };
  });
}

function build_cost_allocation_card_context(calculated = {}) {
  const setup_warnings = calculated?.setup_warnings ?? [];
  const structural_warnings = calculated?.structural_warnings ?? [];
  const allocation_warnings = calculated?.allocation_warnings ?? [
    ...setup_warnings,
    ...structural_warnings,
  ];

  const group_first_counts = get_group_first_counts(calculated);
  const division_counts = get_division_counts(calculated);

  const all_warnings = allocation_warnings;
  const active_operational_groups =
    calculated?.active_operating_groups ??
    calculated?.active_operational_groups ??
    [];

  const staff_rows = build_staff_rows(calculated, active_operational_groups);
  const asset_rows = build_asset_rows(calculated, active_operational_groups);

  const allocation_status = calculated?.allocation_status ?? "not_supported";
  const allocation_dependency_type =
    calculated?.allocation_dependency_type ?? "unknown";
  const structure_valid = Boolean(calculated?.structure_valid);
  const internal_capacity_shortfall =
    calculated?.internal_capacity_shortfall === true;
  const external_delivery_enabled =
    calculated?.external_delivery_enabled === true;
  const external_delivery_required =
    calculated?.external_delivery_required === true;

  const warning_count = allocation_warnings.length;
  const setup_warnings_count = setup_warnings.length;
  const structural_warnings_count = structural_warnings.length;

  const status_copy = get_status_copy(
    allocation_status,
    setup_warnings_count,
    structural_warnings_count
  );

  const unique_setup_warnings = get_unique_warnings([setup_warnings]);
  const unique_structural_warnings = get_unique_warnings([structural_warnings]);
  const unique_warnings = get_unique_warnings([allocation_warnings]);

  const labour_group_assignments = get_active_assignment_rows(
    calculated?.labour_group_assignments
  );

  const rate_builder_labour_recovery_rows =
    build_rate_builder_labour_recovery_rows(calculated);

  return {
    calculated,

    setup_warnings,
    structural_warnings,
    allocation_warnings,
    all_warnings,

    group_first_counts,
    division_counts,

    active_operational_groups,
    staff_rows,
    asset_rows,

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
    unique_setup_warnings,
    unique_structural_warnings,
    unique_warnings,

    labour_group_assignments,
    rate_builder_labour_recovery_rows,

    active_recovery_model_label: get_recovery_model_label(
      calculated?.active_recovery_model
    ),
  };
}

export function build_cost_allocation_card(calculated = {}) {
  const context = build_cost_allocation_card_context(calculated);

  return {
    outcome: build_outcome_section(context),
    recovery_plan: build_recovery_plan_section(context),
    allocation_tests: build_allocation_tests_section(context),
    labour_assignment: build_labour_assignment_section(context),
    delivery_summary: build_delivery_summary_section(context),
    evidence: build_evidence_section(context),
    recovery_context: build_recovery_context_section(context),
    structural_readiness: build_structural_readiness_section(context),
    links: build_links_section(context),
    divisions: build_divisions_section(context),
    groups: build_groups_section(context),
    problems: build_problems_section(context),
  };
}