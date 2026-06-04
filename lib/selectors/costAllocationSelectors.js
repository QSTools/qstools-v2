function format_percent(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "0.0%";
}

function get_status_copy(
  allocation_status,
  setup_warnings_count = 0,
  structural_warnings_count = 0
) {
  if (setup_warnings_count > 0) {
    return {
      headline: "Cost allocation setup is in progress.",
      status_label: "Setup in progress",
      reason:
        "Complete the setup checklist before treating the operating structure as ready for downstream use.",
    };
  }

  if (structural_warnings_count > 0) {
    return {
      headline: "Operating structure needs review.",
      status_label: "Structure needs review",
      reason:
        "The setup checklist is clear, but structural warnings remain in the operating structure.",
    };
  }

  switch (allocation_status) {
    case "ready":
      return {
        headline: "Operating structure is ready.",
        status_label: "Ready",
        reason:
          "The visible divisions, operating groups, and assigned source pools are ready for downstream recovery testing.",
      };

    case "ready_with_dependency":
      return {
        headline: "Operating structure is ready with dependency.",
        status_label: "Ready with dependency",
        reason:
          "The structure may be usable, but it depends on external or scalable delivery capacity.",
      };

    case "strained":
      return {
        headline: "Operating structure is strained.",
        status_label: "Structurally strained",
        reason:
          "The structure may be usable, but the visible divisions, operating groups, or coverage are under pressure.",
      };

    case "not_supported":
      return {
        headline: "Operating structure is not currently supported.",
        status_label: "Not currently supported",
        reason:
          "The visible divisions, operating groups, source-pool assignment, or structure checks are not ready.",
      };

    case "blocked":
      return {
        headline: "Cost allocation is blocked.",
        status_label: "Blocked",
        reason:
          "One or more source pools is over-assigned or structurally invalid.",
      };

    default:
      return {
        headline: "Cost allocation needs review.",
        status_label: "Needs review",
        reason:
          "Review the divisions, operating groups, source-pool assignments, and reconciliation checks.",
      };
  }
}

function get_recommended_check({
  allocation_dependency_type,
  external_delivery_required,
  external_delivery_enabled,
  structure_valid,
}) {
  if (external_delivery_required && !external_delivery_enabled) {
    return "Confirm the external delivery source required by this structure.";
  }

  if (allocation_dependency_type === "external_delivery") {
    return "Confirm the external delivery source is real, available, and intentional.";
  }

  if (!structure_valid) {
    return "Complete the divisions and operating groups before relying on this allocation setup.";
  }

  return "Review source-pool assignments and reconciliation before downstream use.";
}

function get_reason({
  allocation_status,
  allocation_dependency_type,
  internal_capacity_shortfall,
  setup_warnings_count = 0,
  structural_warnings_count = 0,
}) {
  const status_copy = get_status_copy(
    allocation_status,
    setup_warnings_count,
    structural_warnings_count
  );

  const reason_parts = [status_copy.reason];

  if (allocation_dependency_type === "external_delivery") {
    reason_parts.push(
      "External delivery must be real, available, and intentional."
    );
  }

  if (internal_capacity_shortfall) {
    reason_parts.push(
      "Internal capacity shortfall is being treated as a dependency signal, not an automatic failure."
    );
  }

  return reason_parts.join(" ");
}

function get_display_label(value, fallback = "Unknown") {
  const label_map = {
    asset_structure: "Asset structure",
    external_delivery: "External delivery",
    internal_capacity: "Internal capacity",
    mixed: "Mixed dependency",
    none: "No dependency",
    unknown: "Unknown",
    not_supported: "Not currently supported",
    ready: "Ready",
    ready_with_dependency: "Ready with dependency",
    strained: "Structurally strained",
    blocked: "Blocked",
    over_allocated: "Over-allocated",
    under_allocated: "Under-allocated",
    balanced: "Balanced",
    assigned: "Assigned",
    review_required: "Review required",
  };

  return label_map[value] || fallback;
}

function get_warning_message(warning) {
  if (warning && typeof warning === "object") {
    return warning.message || warning.label || warning.warning_key || "";
  }

  return String(warning || "");
}

function get_recovery_model_label(value) {
  const label_map = {
    labour_led: "Labour-led recovery",
    asset_led: "Asset-led recovery",
    material_led: "Materials / products-led recovery",
    hybrid: "Hybrid recovery",
    labour_only: "Labour-led recovery",
    asset_driven: "Asset-led recovery",
  };

  return label_map[value] || value || "Labour-led recovery";
}

function get_unique_warnings(warning_groups = []) {
  const seen = new Set();
  const warnings = [];

  warning_groups.flat().forEach((warning) => {
    const message = get_warning_message(warning).trim();

    if (!message || seen.has(message)) {
      return;
    }

    seen.add(message);

    warnings.push({
      message,
      source: warning?.warning_key || warning?.source || "",
    });
  });

  return warnings;
}

function get_main_issue({
  allocation_dependency_type,
  allocation_status,
  structure_valid,
  allocation_warnings,
  setup_warnings_count = 0,
  structural_warnings_count = 0,
}) {
  if (setup_warnings_count > 0) {
    return {
      title: "Setup checklist needs completion",
      message:
        "Complete the setup checklist before treating this operating structure as ready.",
    };
  }

  if (structural_warnings_count > 0) {
    return {
      title: "Operating structure needs review",
      message:
        "The setup checklist is clear, but structural warnings remain in the operating structure.",
    };
  }

  if (allocation_dependency_type === "asset_structure") {
    return {
      title: "Asset structure needs review",
      message:
        "The selected recovery context uses assets, but the visible operating structure does not yet have enough valid productive asset setup.",
    };
  }

  if (allocation_dependency_type === "external_delivery") {
    return {
      title: "External delivery dependency needs confirmation",
      message:
        "This structure depends on delivery capacity outside the visible internal operating groups.",
    };
  }

  if (allocation_dependency_type === "internal_capacity") {
    return {
      title: "Internal capacity needs review",
      message:
        "This structure needs more internal productive capacity than the current operating groups show.",
    };
  }

  if (!structure_valid) {
    return {
      title: "Operating structure is incomplete",
      message:
        "The divisions and operating groups are not currently valid enough for downstream use.",
    };
  }

  if (allocation_status === "not_supported") {
    return {
      title: "Cost allocation is not currently supported",
      message:
        get_warning_message(allocation_warnings?.[0]) ||
        "The visible operating structure does not currently support downstream use.",
    };
  }

  return {
    title: "Allocation evidence needs review",
    message:
      "Review source-pool assignments, remaining balances, and structural warnings before relying on this allocation profile.",
  };
}

function get_active_assignment_rows(rows = []) {
  return Array.isArray(rows)
    ? rows.filter((row) => row?.is_active !== false)
    : [];
}

function get_group_first_counts(calculated = {}) {
  const productive_labour_group_count =
    calculated?.productive_labour_group_count ?? 0;

  const assigned_labour_group_count =
    calculated?.assigned_labour_group_count ?? 0;

  const productive_asset_count = calculated?.productive_asset_count ?? 0;

  const assigned_productive_asset_count =
    calculated?.assigned_productive_asset_count ?? 0;

  const unassigned_labour_group_count = Math.max(
    0,
    productive_labour_group_count - assigned_labour_group_count
  );

  const unassigned_productive_asset_count = Math.max(
    0,
    productive_asset_count - assigned_productive_asset_count
  );

  return {
    productive_labour_group_count,
    assigned_labour_group_count,
    unassigned_labour_group_count,
    productive_asset_count,
    assigned_productive_asset_count,
    unassigned_productive_asset_count,
  };
}

function get_division_counts(calculated = {}) {
  return {
    active_divisions: calculated?.active_divisions ?? [],
    division_cost_rows: calculated?.division_cost_rows ?? [],

    total_divisions: calculated?.total_divisions ?? 0,
    valid_divisions: calculated?.valid_divisions ?? 0,
    invalid_divisions: calculated?.invalid_divisions ?? 0,

    division_coverage_percent: calculated?.division_coverage_percent ?? 0,
    division_coverage_label: format_percent(
      calculated?.division_coverage_percent ?? 0
    ),
  };
}

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

    total_assigned_source_pool:
      calculated?.total_grouped_operating_cost ?? 0,
    total_remaining_source_pool:
      calculated?.total_unassigned_cost ?? 0,

    total_grouped_operating_cost:
      calculated?.total_grouped_operating_cost ?? 0,
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

export function build_cost_allocation_card(calculated = {}) {
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

  const staff_rows = (calculated?.active_staff ?? []).map((staff) => {
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

  const asset_rows = (calculated?.active_assets ?? []).map((asset) => {
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

  return {
    outcome: {
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
    },

    recovery_plan: {
      active_recovery_model: calculated?.active_recovery_model ?? "labour_led",
      active_recovery_model_label: get_recovery_model_label(
        calculated?.active_recovery_model
      ),
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
      total_grouped_overhead_cost:
        calculated?.total_grouped_overhead_cost ?? 0,
      total_grouped_operating_cost:
        calculated?.total_grouped_operating_cost ?? 0,

      unassigned_labour_cost: calculated?.unassigned_labour_cost ?? 0,
      unassigned_asset_cost: calculated?.unassigned_asset_cost ?? 0,
      unassigned_overhead_cost: calculated?.unassigned_overhead_cost ?? 0,
      total_unassigned_cost: calculated?.total_unassigned_cost ?? 0,
    },

    allocation_tests: {
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
    },

    labour_assignment: {
      productive_staff_type_rates:
        calculated?.productive_labour_type_rows ?? [],
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
    },

    delivery_summary: {
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
    },

    evidence: {
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
    },

    recovery_context: {
      active_recovery_model: calculated?.active_recovery_model ?? "labour_led",
      labour_share_percent: calculated?.labour_share_percent ?? 0,
      asset_share_percent: calculated?.asset_share_percent ?? 0,
      material_share_percent: calculated?.material_share_percent ?? 0,
      overhead_absorbed_percent:
        calculated?.overhead_absorbed_percent ??
        calculated?.overhead_share_percent ??
        0,
      overhead_share_percent: calculated?.overhead_share_percent ?? 0,
    },

    structural_readiness: {
      structure_valid: Boolean(calculated?.structure_valid),

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
      external_delivery_enabled:
        calculated?.external_delivery_enabled === true,
      external_delivery_required:
        calculated?.external_delivery_required === true,
      internal_capacity_shortfall:
        calculated?.internal_capacity_shortfall === true,
    },

    links: {
      rows: calculated?.active_asset_labour_links ?? [],
      staff_rows,
      asset_rows,
    },

    divisions: {
      rows: division_counts.active_divisions,
      division_cost_rows: division_counts.division_cost_rows,

      total_divisions: division_counts.total_divisions,
      valid_divisions: division_counts.valid_divisions,
      invalid_divisions: division_counts.invalid_divisions,

      division_coverage_percent: division_counts.division_coverage_percent,
      division_coverage_label: division_counts.division_coverage_label,
    },

    groups: {
      rows: active_operational_groups,
      operational_group_cost_rows:
        calculated?.operational_group_cost_rows ?? [],
      productive_labour_type_rows:
        calculated?.productive_labour_type_rows ?? [],
      total_operational_groups: calculated?.total_operational_groups ?? 0,
      valid_operational_groups: calculated?.valid_operational_groups ?? 0,
      invalid_operational_groups: calculated?.invalid_operational_groups ?? 0,

      operating_groups_count: calculated?.total_operational_groups ?? 0,
      ready_operating_groups_count:
        calculated?.valid_operational_groups ?? 0,
      incomplete_operating_groups_count:
        calculated?.invalid_operational_groups ?? 0,

      working_units_count: calculated?.total_operational_groups ?? 0,
      ready_working_units_count: calculated?.valid_operational_groups ?? 0,
      incomplete_working_units_count:
        calculated?.invalid_operational_groups ?? 0,

      asset_rows,
      staff_rows,
    },

    problems: {
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
    },
  };
}