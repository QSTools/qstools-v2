function get_status_tone(value) {
  if (value === "viable") return "good";
  if (value === "viable_with_dependency" || value === "at_risk") return "ok";
  return "bad";
}

function get_structure_tone(value) {
  return value ? "good" : "bad";
}

export function buildRecoveryOutcomeStatus(outputs = {}) {
  return {
    business_outcome_status:
      outputs.business_outcome_status ?? outputs.outcome_status ?? "not_viable",
    outcome_status: outputs.outcome_status ?? "not_viable",
    outcome_status_tone: get_status_tone(outputs.outcome_status),
    primary_constraint_title:
      outputs.primary_constraint_title ?? "No constraint identified",
    allocation_status: outputs.allocation_status ?? "unknown",
    allocation_dependency_type: outputs.allocation_dependency_type ?? "unknown",
    active_recovery_model: outputs.active_recovery_model ?? "labour_only",
    structure_valid: Boolean(outputs.structure_valid),
    structure_tone: get_structure_tone(outputs.structure_valid),
    dependency_level: outputs.dependency_level ?? "unknown",
    warning_count: Array.isArray(outputs.decision_warnings)
      ? outputs.decision_warnings.length
      : 0,
  };
}

export function buildRecoveryOutcomeCard(outputs = {}) {
  return {
    outcome_banner: {
      business_outcome_status: outputs.business_outcome_status,
      outcome_status: outputs.outcome_status,
      outcome_title: outputs.outcome_title,
      outcome_message: outputs.outcome_message,
      recommended_action: outputs.recommended_action,
      tone: get_status_tone(outputs.outcome_status),
    },

    primary_constraint: {
      primary_constraint_key: outputs.primary_constraint_key,
      primary_constraint_title: outputs.primary_constraint_title,
      primary_constraint_message: outputs.primary_constraint_message,
      recommended_action: outputs.recommended_action,
    },

    recovery_context: {
      active_recovery_model: outputs.active_recovery_model,
      recovery_model: outputs.recovery_model,
      recovery_plan_target_per_driver:
        outputs.recovery_plan_target_per_driver,
      recovery_plan_split: outputs.recovery_plan_split,
      component_required_recovery: outputs.component_required_recovery,
      business_type: outputs.business_type,
      activity_driver_type: outputs.activity_driver_type,
      activity_driver_label: outputs.activity_driver_label,
      activity_driver_value: outputs.activity_driver_value,
      required_recovery_per_driver: outputs.required_recovery_per_driver,
      current_margin_per_driver: outputs.current_margin_per_driver,
      recovery_gap_per_driver: outputs.recovery_gap_per_driver,
      labour_share_percent: outputs.labour_share_percent,
      asset_share_percent: outputs.asset_share_percent,
      overhead_share_percent: outputs.overhead_share_percent,
      labour_recovery_cost: outputs.labour_recovery_cost,
      asset_recovery_cost: outputs.asset_recovery_cost,
      overhead_absorbed_cost: outputs.overhead_absorbed_cost,
      required_labour_recovery_rate: outputs.required_labour_recovery_rate,
      required_asset_recovery: outputs.required_asset_recovery,
      margin_pool: outputs.margin_pool,
      total_cost_burden: outputs.total_cost_burden,
      net_position: outputs.net_position,
      model_trust_state: outputs.model_trust_state,
    },

    allocation_context: {
      allocation_status: outputs.allocation_status,
      allocation_dependency_type: outputs.allocation_dependency_type,
      allocation_warnings: outputs.allocation_warnings,
      structure_valid: outputs.structure_valid,
      staff_coverage_percent: outputs.staff_coverage_percent,
      asset_coverage_percent: outputs.asset_coverage_percent,
      group_coverage_percent: outputs.group_coverage_percent,
      linked_staff_count: outputs.linked_staff_count,
      unlinked_staff_count: outputs.unlinked_staff_count,
      linked_asset_count: outputs.linked_asset_count,
      unlinked_asset_count: outputs.unlinked_asset_count,
      valid_operational_groups: outputs.valid_operational_groups,
      invalid_operational_groups: outputs.invalid_operational_groups,
      external_delivery_enabled: outputs.external_delivery_enabled,
      external_delivery_required: outputs.external_delivery_required,
      internal_capacity_shortfall: outputs.internal_capacity_shortfall,
    },

    outcome_context: {
      dependency_level: outputs.dependency_level,
      business_model_health: outputs.business_model_health,
    },

    warnings: outputs.decision_warnings ?? [],
  };
}