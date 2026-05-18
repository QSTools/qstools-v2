function format_percent(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "0.0%";
}

function get_status_copy(allocation_status) {
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
}) {
  const status_copy = get_status_copy(allocation_status);
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
}) {
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
      "Review the supporting warnings and structure evidence before relying on this allocation profile.",
  };
}

export function build_cost_allocation_status(calculated = {}) {
  const warnings = [
    ...(calculated?.duplicate_link_warnings ?? []),
    ...(calculated?.orphan_warnings ?? []),
    ...(calculated?.group_validation_warnings ?? []),
  ];

  return {
    allocation_status: calculated?.allocation_status ?? "not_supported",
    allocation_dependency_type:
      calculated?.allocation_dependency_type ?? "unknown",
    status_label: get_status_copy(
      calculated?.allocation_status ?? "not_supported"
    ).status_label,
    allocation_warnings: calculated?.allocation_warnings ?? [],
    active_recovery_model: calculated?.active_recovery_model ?? "labour_only",
    structure_valid: Boolean(calculated?.structure_valid),
    linked_staff_count: calculated?.linked_staff_count ?? 0,
    linked_asset_count: calculated?.linked_asset_count ?? 0,
    total_operational_groups: calculated?.total_operational_groups ?? 0,
    warnings_count:
      (calculated?.allocation_warnings ?? []).length || warnings.length,
    warnings: calculated?.allocation_warnings ?? warnings,
  };
}

export function build_cost_allocation_card(calculated = {}) {
  const all_warnings = [
    ...(calculated?.duplicate_link_warnings ?? []),
    ...(calculated?.orphan_warnings ?? []),
    ...(calculated?.group_validation_warnings ?? []),
  ];

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
  const warning_count =
    (calculated?.allocation_warnings ?? []).length + all_warnings.length;
  const status_copy = get_status_copy(allocation_status);
  const unique_warnings = get_unique_warnings([
    calculated?.allocation_warnings ?? [],
    calculated?.duplicate_link_warnings ?? [],
    calculated?.orphan_warnings ?? [],
    calculated?.group_validation_warnings ?? [],
  ]);

  return {
    outcome: {
      headline: status_copy.headline,
      status_label: status_copy.status_label,
      reason: get_reason({
        allocation_status,
        allocation_dependency_type,
        internal_capacity_shortfall,
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
      allocation_dependency_label: get_display_label(
        allocation_dependency_type
      ),
      structure_valid,
      internal_capacity_shortfall,
      external_delivery_enabled,
      external_delivery_required,
      warning_count,
    },

    recovery_plan: {
      active_recovery_model: calculated?.active_recovery_model ?? "labour_only",
      recovery_plan_target_per_driver:
        calculated?.recovery_plan_target_per_driver ?? 0,
      recovery_plan_split: calculated?.recovery_plan_split ?? null,
      component_required_recovery:
        calculated?.component_required_recovery ?? null,
      activity_driver_type: calculated?.activity_driver_type ?? "hours",
      activity_driver_label:
        calculated?.activity_driver_type === "units"
          ? "Units sold"
          : "Selected recovery hours",
      business_type: calculated?.business_type ?? "labour_based",
    },

    delivery_summary: {
      allocation_status,
      allocation_dependency_type,
      allocation_status_label: status_copy.status_label,
      allocation_dependency_label: get_display_label(
        allocation_dependency_type
      ),
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
      staff_coverage_label: format_percent(calculated?.staff_coverage_percent ?? 0),
      asset_coverage_label: format_percent(calculated?.asset_coverage_percent ?? 0),
      group_coverage_label: format_percent(calculated?.group_coverage_percent ?? 0),
    },

    evidence: {
      main_issue: get_main_issue({
        allocation_dependency_type,
        allocation_status,
        structure_valid,
        allocation_warnings: calculated?.allocation_warnings ?? [],
      }),
      supporting_warnings: unique_warnings.slice(0, 5),
      additional_warnings: unique_warnings.slice(5),
      active_asset_labour_links: calculated?.active_asset_labour_links ?? [],
      active_operational_groups: calculated?.active_operational_groups ?? [],
      duplicate_link_warnings: calculated?.duplicate_link_warnings ?? [],
      orphan_warnings: calculated?.orphan_warnings ?? [],
      group_validation_warnings: calculated?.group_validation_warnings ?? [],
      allocation_warnings: calculated?.allocation_warnings ?? [],
    },

    recovery_context: {
      active_recovery_model: calculated?.active_recovery_model ?? "labour_only",
      recovery_plan_target_per_driver:
        calculated?.recovery_plan_target_per_driver ?? 0,
      recovery_plan_split: calculated?.recovery_plan_split ?? null,
      component_required_recovery:
        calculated?.component_required_recovery ?? null,
      labour_share_percent: calculated?.labour_share_percent ?? 0,
      asset_share_percent: calculated?.asset_share_percent ?? 0,
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
      staff_coverage_label: format_percent(calculated?.staff_coverage_percent ?? 0),
      asset_coverage_label: format_percent(calculated?.asset_coverage_percent ?? 0),
      group_coverage_label: format_percent(calculated?.group_coverage_percent ?? 0),
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
      allocation_warnings: calculated?.allocation_warnings ?? [],
      duplicate_link_warnings: calculated?.duplicate_link_warnings ?? [],
      orphan_warnings: calculated?.orphan_warnings ?? [],
      group_validation_warnings: calculated?.group_validation_warnings ?? [],
      unlinked_staff_count: calculated?.unlinked_staff_count ?? 0,
      unlinked_asset_count: calculated?.unlinked_asset_count ?? 0,
    },
  };
}
