export function format_percent(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "0.0%";
}

export function get_status_copy(
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

export function get_recommended_check({
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

export function get_reason({
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

export function get_display_label(value, fallback = "Unknown") {
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

export function get_warning_message(warning) {
  if (warning && typeof warning === "object") {
    return warning.message || warning.label || warning.warning_key || "";
  }

  return String(warning || "");
}

export function get_recovery_model_label(value) {
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

export function get_unique_warnings(warning_groups = []) {
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

export function get_main_issue({
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

export function get_active_assignment_rows(rows = []) {
  return Array.isArray(rows)
    ? rows.filter((row) => row?.is_active !== false)
    : [];
}

export function get_group_first_counts(calculated = {}) {
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

export function get_division_counts(calculated = {}) {
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