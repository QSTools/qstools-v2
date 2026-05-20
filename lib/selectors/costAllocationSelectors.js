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
        "Complete the setup checklist before treating the allocation structure as fully tested.",
    };
  }

  if (structural_warnings_count > 0) {
    return {
      headline: "Cost allocation structure needs review.",
      status_label: "Structure needs review",
      reason:
        "The setup checklist is clear, but structural warnings remain in the visible delivery structure.",
    };
  }

  switch (allocation_status) {
    case "ready":
      return {
        headline: "This recovery plan is supported internally.",
        status_label: "Supported internally",
        reason:
          "The selected recovery plan is supported by the visible internal staff, asset, and operational structure.",
      };
    case "ready_with_dependency":
      return {
        headline: "This recovery plan depends on external delivery.",
        status_label: "Supported with dependency",
        reason:
          "The selected recovery plan can work, but it depends on external delivery capacity beyond the visible internal structure.",
      };
    case "strained":
      return {
        headline: "This recovery plan is structurally strained.",
        status_label: "Structurally strained",
        reason:
          "The selected recovery plan may be possible, but the visible structure is under pressure or coverage is weak.",
      };
    case "not_supported":
      return {
        headline: "This recovery plan is not currently supported.",
        status_label: "Not currently supported",
        reason:
          "The selected recovery plan is not currently supported by the visible structure or confirmed external dependency.",
      };
    default:
      return {
        headline: "This recovery plan needs review.",
        status_label: "Needs review",
        reason:
          "The selected recovery plan needs review before the delivery structure can be trusted.",
      };
  }
}

function get_recommended_check({
  allocation_dependency_type,
  external_delivery_required,
  external_delivery_enabled,
  internal_capacity_shortfall,
  structure_valid,
}) {
  if (external_delivery_required && !external_delivery_enabled) {
    return "Confirm the external delivery source required by this recovery plan.";
  }

  if (allocation_dependency_type === "external_delivery") {
    return "Confirm the external delivery source is real, available, and intentional.";
  }

  if (internal_capacity_shortfall) {
    return "Review the internal capacity shortfall and decide whether it is covered internally or externally.";
  }

  if (!structure_valid) {
    return "Complete the visible staff, asset, and operational group structure.";
  }

  return "Review the evidence below before relying on this allocation profile.";
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
    reason_parts.push("External delivery must be real, available, and intentional.");
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
    ready: "Supported internally",
    ready_with_dependency: "Supported with dependency",
    strained: "Structurally strained",
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

function get_status_label(value) {
  const label_map = {
    pending_live_feedback: "Pending live job feedback",
    estimated: "Estimated until verified",
    not_selected: "Not selected",
  };

  return label_map[value] || value || "Not available";
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

function build_allocation_tests(calculated = {}) {
  const labour_share_percent = calculated?.labour_share_percent ?? 0;
  const asset_share_percent = calculated?.asset_share_percent ?? 0;
  const overhead_absorbed_percent =
    calculated?.overhead_absorbed_percent ??
    calculated?.overhead_share_percent ??
    0;

  const labour_selected = labour_share_percent > 0;
  const asset_selected =
    asset_share_percent > 0 || calculated?.asset_recovery_included === true;
  const unassigned_selected = overhead_absorbed_percent > 0;

  return {
    labour: {
      title: "Labour allocation test",
      selected: labour_selected,
      share_percent: labour_share_percent,
      recovery_cost: calculated?.labour_recovery_cost ?? 0,
      status_label: !labour_selected
        ? "Not selected"
        : calculated?.internal_capacity_shortfall
          ? "Capacity dependency"
          : "Supported by selected recovery hours",
      message: !labour_selected
        ? "This recovery plan is not asking labour to carry a recovery share."
        : calculated?.internal_capacity_shortfall
          ? "Labour recovery is selected, but visible internal recovery hours do not fully support the plan. This is a dependency signal, not automatic failure."
          : "Labour recovery is selected and visible selected recovery hours are available for the plan.",
    },

    asset: {
      title: "Asset allocation test",
      selected: asset_selected,
      share_percent: asset_share_percent,
      recovery_cost: calculated?.asset_recovery_cost ?? 0,
      status_label: !asset_selected
        ? "Not selected"
        : calculated?.has_productive_asset_recovery_base
          ? "Productive asset base available"
          : "No productive asset recovery base",
      message: !asset_selected
        ? "This recovery plan is not asking assets to carry a recovery share. Support assets still remain in total cost burden."
        : calculated?.has_productive_asset_recovery_base
          ? "Productive assets can carry asset recovery. Asset utilisation is estimated until actual usage tracking exists."
          : "Asset recovery is selected, but no productive asset recovery base is available. Support assets remain in total cost burden but do not automatically carry asset recovery.",
      productive_asset_count: calculated?.productive_asset_count ?? 0,
      support_asset_count: calculated?.support_asset_count ?? 0,
      asset_utilisation_status: get_status_label(
        calculated?.asset_utilisation_status
      ),
    },

    material: null,

    unassigned: {
      title: "Absorbed / unassigned recovery share test",
      selected: unassigned_selected,
      share_percent: overhead_absorbed_percent,
      recovery_cost: calculated?.overhead_absorbed_cost ?? 0,
      status_label: unassigned_selected ? "Needs review" : "Fully assigned",
      message: unassigned_selected
        ? "A recovery share is being held outside labour and productive assets. This may be intentional, but it should be confirmed rather than treated as an error."
        : "The selected recovery model has no unassigned recovery share.",
    },
  };
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
        "Complete the setup checklist before treating this allocation structure as fully tested.",
    };
  }

  if (structural_warnings_count > 0) {
    return {
      title: "Structure needs review",
      message:
        "The setup checklist is clear, but structural warnings remain in the visible delivery structure.",
    };
  }

  if (allocation_dependency_type === "asset_structure") {
    return {
      title: "Asset structure needs review",
      message:
        "This recovery plan uses asset-driven recovery, but the visible asset structure is not currently valid enough to support it.",
    };
  }

  if (allocation_dependency_type === "external_delivery") {
    return {
      title: "External delivery dependency needs confirmation",
      message:
        "This recovery plan depends on delivery capacity outside the visible internal staff and asset structure.",
    };
  }

  if (allocation_dependency_type === "internal_capacity") {
    return {
      title: "Internal capacity needs review",
      message:
        "This recovery plan needs more internal capacity than the visible staff structure currently shows.",
    };
  }

  if (!structure_valid) {
    return {
      title: "Visible structure is incomplete",
      message:
        "The staff, asset, or operational group structure is not currently valid enough to support this recovery plan.",
    };
  }

  if (allocation_status === "not_supported") {
    return {
      title: "Recovery plan is not currently supported",
      message:
        get_warning_message(allocation_warnings?.[0]) ||
        "The visible structure does not currently support this recovery plan.",
    };
  }

  return {
    title: "Allocation evidence needs review",
    message:
      "Review the setup checklist, structural warnings, and structure evidence before relying on this allocation profile.",
  };
}

export function build_cost_allocation_status(calculated = {}) {
  const setup_warnings = calculated?.setup_warnings ?? [];
  const structural_warnings = calculated?.structural_warnings ?? [];
  const allocation_warnings = calculated?.allocation_warnings ?? [
    ...setup_warnings,
    ...structural_warnings,
  ];

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

  const all_warnings = allocation_warnings;

  const staff_rows = (calculated?.active_staff ?? []).map((staff) => {
    const is_linked = (calculated?.active_asset_labour_links ?? []).some(
      (link) => link?.staff_id === staff?.staff_id
    );

    return {
      ...staff,
      is_linked,
    };
  });

  const asset_rows = (calculated?.active_assets ?? []).map((asset) => {
    const is_linked = (calculated?.active_asset_labour_links ?? []).some(
      (link) => link?.asset_id === asset?.asset_id
    );

    return {
      ...asset,
      is_linked,
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

  const allocation_tests = build_allocation_tests(calculated);

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
    },

    recovery_plan: {
      active_recovery_model: calculated?.active_recovery_model ?? "labour_led",
      active_recovery_model_label: get_recovery_model_label(
        calculated?.active_recovery_model
      ),
      recovery_plan_target_per_driver:
        calculated?.recovery_plan_target_per_driver ?? 0,
      recovery_plan_split: calculated?.recovery_plan_split ?? null,
      component_required_recovery:
        calculated?.component_required_recovery ?? null,
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
      actual_recovery_rate: calculated?.actual_recovery_rate ?? 0,
      profit_or_deficit_per_recovery_hour:
        calculated?.profit_or_deficit_per_recovery_hour ?? 0,
      material_recovery_included:
        calculated?.material_recovery_included === true,
      asset_recovery_included: calculated?.asset_recovery_included === true,
      material_margin_status:
        calculated?.material_margin_status ?? "not_selected",
      asset_utilisation_status:
        calculated?.asset_utilisation_status ?? "not_selected",
      has_productive_asset_recovery_base:
        calculated?.has_productive_asset_recovery_base === true,
      productive_asset_count: calculated?.productive_asset_count ?? 0,
      support_asset_count: calculated?.support_asset_count ?? 0,
      productive_asset_cost: calculated?.productive_asset_cost ?? 0,
      support_asset_cost: calculated?.support_asset_cost ?? 0,
      activity_driver_type: calculated?.activity_driver_type ?? "hours",
      activity_driver_label:
        calculated?.activity_driver_type === "units"
          ? "Units sold"
          : "Selected recovery hours",
      business_type: calculated?.business_type ?? "labour_based",
    },

    allocation_tests,

    delivery_summary: {
      allocation_status,
      allocation_dependency_type,
      allocation_status_label: status_copy.status_label,
      allocation_dependency_label: get_display_label(allocation_dependency_type),
      structure_valid,
      internal_capacity_shortfall,
      external_delivery_enabled,
      external_delivery_required,
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
      active_operational_groups: calculated?.active_operational_groups ?? [],
      duplicate_link_warnings: calculated?.duplicate_link_warnings ?? [],
      orphan_warnings: calculated?.orphan_warnings ?? [],
      group_validation_warnings: calculated?.group_validation_warnings ?? [],
      allocation_warnings,
    },

    recovery_context: {
      active_recovery_model: calculated?.active_recovery_model ?? "labour_led",
      recovery_plan_target_per_driver:
        calculated?.recovery_plan_target_per_driver ?? 0,
      recovery_plan_split: calculated?.recovery_plan_split ?? null,
      component_required_recovery:
        calculated?.component_required_recovery ?? null,
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
      linked_staff_count: calculated?.linked_staff_count ?? 0,
      total_active_staff: calculated?.total_active_staff ?? 0,
      linked_asset_count: calculated?.linked_asset_count ?? 0,
      total_active_assets: calculated?.total_active_assets ?? 0,
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

    groups: {
      rows: calculated?.active_operational_groups ?? [],
      total_operational_groups: calculated?.total_operational_groups ?? 0,
      valid_operational_groups: calculated?.valid_operational_groups ?? 0,
      invalid_operational_groups: calculated?.invalid_operational_groups ?? 0,
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
      unlinked_staff_count: calculated?.unlinked_staff_count ?? 0,
      unlinked_asset_count: calculated?.unlinked_asset_count ?? 0,
    },
  };
}