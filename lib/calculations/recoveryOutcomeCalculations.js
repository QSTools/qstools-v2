function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function round_percent(value) {
  return Number(to_number(value).toFixed(1));
}

function as_array(value) {
  return Array.isArray(value) ? value : [];
}

function is_object(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function warning_message_from_key(key) {
  const messages = {
    model_not_trusted:
      "The upstream model is not trusted, so this outcome is preview only.",
    recovery_summary_not_ready:
      "Recovery Summary is not ready, so Business Outcome cannot issue a final verdict.",
    allocation_not_ready:
      "Cost Allocation is not ready, so the delivery structure cannot be trusted yet.",
    missing_recovery_plan_target:
      "The recovery plan target per driver is missing.",
    missing_recovery_plan_split:
      "The recovery plan split is missing or invalid.",
    missing_component_required_recovery:
      "Component required recovery is missing.",
    missing_allocation_status:
      "Cost Allocation has not produced an allocation status.",
    missing_activity_driver:
      "The activity driver is missing or zero.",
    negative_net_position:
      "Net position is negative.",
    negative_recovery_gap:
      "Current margin per driver is below required recovery per driver.",
    external_delivery_dependency:
      "The model depends on external delivery capacity.",
    external_delivery_not_defined:
      "External delivery is required but has not been clearly defined.",
    structure_incomplete:
      "The delivery structure is incomplete.",
    weak_structure:
      "The delivery structure is weak or strained.",
    asset_strategy_without_assets:
      "Asset recovery is selected, but asset structure is not ready.",
  };

  return messages[key] || key;
}

function make_warning(warning_key, source = "Business Outcome", message) {
  return {
    warning_key,
    source,
    message: message || warning_message_from_key(warning_key),
  };
}

function normalise_warning(item, fallback_source = "Upstream") {
  if (!item) return null;

  if (typeof item === "string") {
    return make_warning(item, fallback_source);
  }

  if (is_object(item)) {
    const warning_key =
      item.warning_key ||
      item.key ||
      item.check_id ||
      item.id ||
      item.message ||
      "warning";

    return {
      warning_key,
      source: item.source || item.module || fallback_source,
      message:
        item.message ||
        item.detail ||
        item.label ||
        warning_message_from_key(warning_key),
    };
  }

  return make_warning(String(item), fallback_source);
}

function collect_warnings({ recovery_summary = {}, cost_allocation = {} }) {
  return [
    ...as_array(recovery_summary.recovery_summary_warnings).map((warning) =>
      normalise_warning(warning, "Recovery Summary")
    ),
    ...as_array(recovery_summary.warnings).map((warning) =>
      normalise_warning(warning, "Recovery Summary")
    ),
    ...as_array(cost_allocation.allocation_warnings).map((warning) =>
      normalise_warning(warning, "Cost Allocation")
    ),
    ...as_array(cost_allocation.duplicate_link_warnings).map((warning) =>
      normalise_warning(warning, "Cost Allocation")
    ),
    ...as_array(cost_allocation.orphan_warnings).map((warning) =>
      normalise_warning(warning, "Cost Allocation")
    ),
    ...as_array(cost_allocation.group_validation_warnings).map((warning) =>
      normalise_warning(warning, "Cost Allocation")
    ),
  ].filter(Boolean);
}

function is_blocked_trust_state(model_trust_state) {
  if (model_trust_state === false) return true;

  const value = String(model_trust_state || "").toLowerCase();

  return [
    "blocked",
    "not_trusted",
    "not trusted",
    "invalid",
    "false",
  ].includes(value);
}

function is_ready_allocation(allocation_status) {
  return allocation_status === "ready";
}

function is_material_negative(value) {
  return to_number(value) < 0;
}

function is_valid_recovery_plan_split(recovery_plan_split) {
  if (!is_object(recovery_plan_split)) return false;

  const total =
    to_number(recovery_plan_split.labour_share_percent) +
    to_number(recovery_plan_split.asset_share_percent) +
    to_number(recovery_plan_split.overhead_share_percent);

  return Math.abs(total - 100) <= 0.01;
}

function has_component_required_recovery(component_required_recovery) {
  return (
    is_object(component_required_recovery) &&
    is_object(component_required_recovery.labour) &&
    is_object(component_required_recovery.asset) &&
    is_object(component_required_recovery.overhead)
  );
}

function has_asset_strategy_without_assets({
  recovery_summary = {},
  cost_allocation = {},
}) {
  const asset_share_percent = to_number(recovery_summary.asset_share_percent);
  const asset_recovery_cost =
    recovery_summary.component_required_recovery?.asset?.recovery_cost ??
    recovery_summary.asset_recovery_cost;

  const requires_asset_recovery =
    asset_share_percent > 0 || to_number(asset_recovery_cost) > 0;

  if (!requires_asset_recovery) return false;

  return (
    !Boolean(cost_allocation.structure_valid) ||
    to_number(cost_allocation.linked_asset_count) <= 0 ||
    to_number(cost_allocation.asset_coverage_percent) <= 0
  );
}

function build_primary_constraint({
  recovery_summary = {},
  cost_allocation = {},
}) {
  const model_trust_state = recovery_summary.model_trust_state;

  const recovery_summary_status = recovery_summary.recovery_summary_status;
  const recovery_summary_ready = Boolean(
    recovery_summary.recovery_summary_ready
  );

  const recovery_plan_split = recovery_summary.recovery_plan_split;
  const component_required_recovery =
    recovery_summary.component_required_recovery;

  const activity_driver_value = to_number(recovery_summary.activity_driver_value);
  const allocation_status = cost_allocation.allocation_status;

  const net_position = to_number(recovery_summary.net_position);
  const recovery_gap_per_driver = to_number(
    recovery_summary.recovery_gap_per_driver
  );

  if (is_blocked_trust_state(model_trust_state)) {
    return {
      status: "not_viable",
      key: "model_not_trusted",
      title: "Model is not trusted",
      message:
        "The upstream model is not trusted, so this outcome is preview only.",
      recommended_action:
        "Resolve upstream readiness issues before treating this verdict as final.",
    };
  }

  if (
    !recovery_summary_ready ||
    ["blocked", "not_trusted"].includes(recovery_summary_status)
  ) {
    return {
      status: "not_viable",
      key: "recovery_summary_not_ready",
      title: "Recovery Summary is not ready",
      message:
        "Recovery Summary is not ready, so Business Outcome cannot issue a final verdict.",
      recommended_action:
        "Complete Recovery Summary before Business Outcome can issue a verdict.",
    };
  }

  if (!is_valid_recovery_plan_split(recovery_plan_split)) {
    return {
      status: "not_viable",
      key: "share_model_invalid",
      title: "Recovery split is invalid",
      message: "The recovery split is incomplete or does not total 100%.",
      recommended_action:
        "Fix recovery shares so the selected split totals 100%.",
    };
  }

  if (!has_component_required_recovery(component_required_recovery)) {
    return {
      status: "not_viable",
      key: "share_model_invalid",
      title: "Component recovery is missing",
      message: "Component required recovery is missing or incomplete.",
      recommended_action:
        "Fix Recovery Summary so component required recovery is exposed.",
    };
  }

  if (activity_driver_value <= 0) {
    return {
      status: "not_viable",
      key: "no_recoverable_base",
      title: "No valid recovery base",
      message: "The model does not have a valid activity driver yet.",
      recommended_action:
        "Complete the activity driver and Business Summary recovery base.",
    };
  }

  if (!allocation_status) {
    return {
      status: "not_viable",
      key: "allocation_not_supported",
      title: "Allocation status is missing",
      message: "Cost Allocation has not produced an allocation status.",
      recommended_action:
        "Complete Cost Allocation before relying on this recovery plan.",
    };
  }

  if (allocation_status === "not_supported") {
    return {
      status: "not_viable",
      key: "allocation_not_supported",
      title: "Allocation is not supported",
      message:
        "The selected recovery plan is not supported by the visible allocation structure.",
      recommended_action:
        "Fix Cost Allocation blockers before relying on this recovery plan.",
    };
  }

  if (
    has_asset_strategy_without_assets({
      recovery_summary,
      cost_allocation,
    })
  ) {
    return {
      status: "at_risk",
      key: "asset_strategy_without_assets",
      title: "Asset strategy lacks asset structure",
      message:
        "Asset recovery is selected, but the asset structure is not ready.",
      recommended_action:
        "Complete asset structure before relying on asset-driven recovery.",
    };
  }

  if (allocation_status === "ready_with_dependency") {
    return {
      status: "viable_with_dependency",
      key: "external_delivery_dependency",
      title: "External delivery dependency",
      message:
        "The current model can work, but it depends on external delivery capacity.",
      recommended_action:
        "Confirm the external delivery source required by this recovery plan.",
    };
  }

  if (allocation_status === "strained") {
    return {
      status: "at_risk",
      key: "weak_structure",
      title: "Structure is strained",
      message:
        "The recovery plan may be possible, but the structure or dependency pressure is weak.",
      recommended_action:
        "Strengthen the allocation structure before relying on this recovery plan.",
    };
  }

  if (is_material_negative(net_position)) {
    return {
      status: "at_risk",
      key: "negative_net_position",
      title: "Negative net position",
      message:
        "The business is not currently generating enough margin pool to carry its operating cost burden.",
      recommended_action:
        "Review margin pool, operating cost burden, or recovery strategy before moving downstream.",
    };
  }

  if (is_material_negative(recovery_gap_per_driver)) {
    return {
      status: "at_risk",
      key: "recovery_gap_negative",
      title: "Recovery gap is negative",
      message:
        "The current margin per driver is below the required recovery per driver.",
      recommended_action:
        "Review the recovery gap before using this model as a downstream benchmark.",
    };
  }

  if (is_ready_allocation(allocation_status)) {
    return {
      status: "viable",
      key: "healthy",
      title: "Business model is supported",
      message:
        "The current model is supported under the selected recovery plan.",
      recommended_action:
        "Continue to Business Modelling when you are ready to test scenarios.",
    };
  }

  return {
    status: "at_risk",
    key: "unknown",
    title: "Outcome needs review",
    message: "The outcome cannot yet be fully classified from the available data.",
    recommended_action: "Review missing inputs before relying on the outcome.",
  };
}

function build_dependency_level({ cost_allocation = {}, status }) {
  const dependency_type = cost_allocation.allocation_dependency_type;

  if (status === "not_viable") return "high";
  if (cost_allocation.allocation_status === "strained") return "high";
  if (dependency_type === "external_delivery") return "medium";
  if (dependency_type === "mixed") return "high";
  if (dependency_type === "internal_capacity") return "medium";
  if (dependency_type === "asset_structure") return "medium";
  if (dependency_type === "none") return "none";

  return "unknown";
}

function build_business_model_health(status) {
  if (status === "viable") return "healthy";
  if (status === "viable_with_dependency") return "dependent";
  if (status === "at_risk") return "strained";
  if (status === "not_viable") return "unsupported";
  return "unknown";
}

function add_decision_warnings({
  decision_warnings,
  primary_constraint_key,
  recovery_summary = {},
  cost_allocation = {},
}) {
  const warnings = [...decision_warnings];

  if (primary_constraint_key !== "healthy") {
    warnings.unshift(make_warning(primary_constraint_key, "Business Outcome"));
  }

  if (!recovery_summary.recovery_plan_target_per_driver) {
    warnings.push(
      make_warning("missing_recovery_plan_target", "Business Outcome")
    );
  }

  if (!recovery_summary.recovery_plan_split) {
    warnings.push(make_warning("missing_recovery_plan_split", "Business Outcome"));
  }

  if (!recovery_summary.component_required_recovery) {
    warnings.push(
      make_warning("missing_component_required_recovery", "Business Outcome")
    );
  }

  if (!cost_allocation.allocation_status) {
    warnings.push(make_warning("missing_allocation_status", "Business Outcome"));
  }

  if (to_number(recovery_summary.activity_driver_value) <= 0) {
    warnings.push(make_warning("missing_activity_driver", "Business Outcome"));
  }

  if (to_number(recovery_summary.net_position) < 0) {
    warnings.push(make_warning("negative_net_position", "Business Outcome"));
  }

  if (to_number(recovery_summary.recovery_gap_per_driver) < 0) {
    warnings.push(make_warning("negative_recovery_gap", "Business Outcome"));
  }

  if (cost_allocation.external_delivery_required) {
    warnings.push(
      make_warning("external_delivery_dependency", "Business Outcome")
    );
  }

  if (
    cost_allocation.external_delivery_required &&
    !cost_allocation.external_delivery_enabled
  ) {
    warnings.push(make_warning("external_delivery_not_defined", "Business Outcome"));
  }

  return warnings;
}

export function calculateRecoveryOutcome({
  recovery_summary = {},
  cost_allocation = {},
} = {}) {
  const primary_constraint = build_primary_constraint({
    recovery_summary,
    cost_allocation,
  });

  const outcome_status = primary_constraint.status;
  const business_outcome_status = outcome_status;

  const base_warnings = collect_warnings({
    recovery_summary,
    cost_allocation,
  });

  const decision_warnings = add_decision_warnings({
    decision_warnings: base_warnings,
    primary_constraint_key: primary_constraint.key,
    recovery_summary,
    cost_allocation,
  });

  const dependency_level = build_dependency_level({
    cost_allocation,
    status: outcome_status,
  });

  const business_model_health = build_business_model_health(outcome_status);

  return {
    business_outcome_status,
    outcome_status,
    outcome_title: primary_constraint.title,
    outcome_message: primary_constraint.message,

    primary_constraint_key: primary_constraint.key,
    primary_constraint_title: primary_constraint.title,
    primary_constraint_message: primary_constraint.message,
    recommended_action: primary_constraint.recommended_action,

    active_recovery_model:
      recovery_summary.active_recovery_model ||
      recovery_summary.recovery_model ||
      "labour_only",

    recovery_model: recovery_summary.recovery_model,
    recovery_plan_target_per_driver: round_currency(
      recovery_summary.recovery_plan_target_per_driver
    ),
    recovery_plan_split: recovery_summary.recovery_plan_split ?? {},
    component_required_recovery:
      recovery_summary.component_required_recovery ?? {},

    business_type: recovery_summary.business_type,
    activity_driver_type: recovery_summary.activity_driver_type,
    activity_driver_label: recovery_summary.activity_driver_label,
    activity_driver_value: round_currency(recovery_summary.activity_driver_value),

    required_recovery_per_driver: round_currency(
      recovery_summary.required_recovery_per_driver
    ),
    current_margin_per_driver: round_currency(
      recovery_summary.current_margin_per_driver
    ),
    recovery_gap_per_driver: round_currency(
      recovery_summary.recovery_gap_per_driver
    ),

    labour_share_percent: round_percent(recovery_summary.labour_share_percent),
    asset_share_percent: round_percent(recovery_summary.asset_share_percent),
    overhead_share_percent: round_percent(
      recovery_summary.overhead_share_percent
    ),

    labour_recovery_cost: round_currency(recovery_summary.labour_recovery_cost),
    asset_recovery_cost: round_currency(recovery_summary.asset_recovery_cost),
    overhead_absorbed_cost: round_currency(
      recovery_summary.overhead_absorbed_cost
    ),

    required_labour_recovery_rate: round_currency(
      recovery_summary.required_labour_recovery_rate
    ),
    required_asset_recovery: round_currency(
      recovery_summary.required_asset_recovery
    ),

    margin_pool: round_currency(recovery_summary.margin_pool),
    total_cost_burden: round_currency(recovery_summary.total_cost_burden),
    net_position: round_currency(recovery_summary.net_position),
    model_trust_state: recovery_summary.model_trust_state,

    allocation_status: cost_allocation.allocation_status,
    allocation_dependency_type:
      cost_allocation.allocation_dependency_type || "unknown",
    allocation_warnings: as_array(cost_allocation.allocation_warnings),

    structure_valid: Boolean(cost_allocation.structure_valid),
    staff_coverage_percent: round_percent(
      cost_allocation.staff_coverage_percent
    ),
    asset_coverage_percent: round_percent(
      cost_allocation.asset_coverage_percent
    ),
    group_coverage_percent: round_percent(
      cost_allocation.group_coverage_percent
    ),

    linked_staff_count: to_number(cost_allocation.linked_staff_count),
    unlinked_staff_count: to_number(cost_allocation.unlinked_staff_count),
    linked_asset_count: to_number(cost_allocation.linked_asset_count),
    unlinked_asset_count: to_number(cost_allocation.unlinked_asset_count),
    valid_operational_groups: to_number(
      cost_allocation.valid_operational_groups
    ),
    invalid_operational_groups: to_number(
      cost_allocation.invalid_operational_groups
    ),

    external_delivery_enabled: Boolean(
      cost_allocation.external_delivery_enabled
    ),
    external_delivery_required: Boolean(
      cost_allocation.external_delivery_required
    ),
    internal_capacity_shortfall: round_currency(
      cost_allocation.internal_capacity_shortfall
    ),

    duplicate_link_warnings: as_array(
      cost_allocation.duplicate_link_warnings
    ),
    orphan_warnings: as_array(cost_allocation.orphan_warnings),
    group_validation_warnings: as_array(
      cost_allocation.group_validation_warnings
    ),

    dependency_level,
    business_model_health,
    decision_warnings,
  };
}