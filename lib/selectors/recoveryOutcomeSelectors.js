function get_status_tone(value) {
  if (value === "viable" || value === true) return "good";
  if (value === "marginal") return "ok";
  return "bad";
}

export function buildRecoveryOutcomeStatus(outputs = {}) {
  return {
    outcome_status: outputs.outcome_status ?? "not_viable",
    outcome_status_tone: get_status_tone(outputs.outcome_status),
    primary_constraint_title:
      outputs.primary_constraint_title ?? "No constraint identified",
    active_recovery_model: outputs.active_recovery_model ?? "labour_only",
    structure_valid: Boolean(outputs.structure_valid),
    structure_tone: get_status_tone(outputs.structure_valid),
    warning_count: Array.isArray(outputs.decision_warnings)
      ? outputs.decision_warnings.length
      : 0,
  };
}

export function buildRecoveryOutcomeCard(outputs = {}) {
  return {
    outcome_banner: {
      outcome_status: outputs.outcome_status,
      outcome_title: outputs.outcome_title,
      outcome_message: outputs.outcome_message,
      recommended_action: outputs.recommended_action,
      tone: get_status_tone(outputs.outcome_status),
    },

    cost_baseline: {
      total_cost_burden: outputs.total_cost_burden,
      required_revenue: outputs.required_revenue,
      required_recovery_rate: outputs.required_recovery_rate,
      total_productive_output: outputs.total_productive_output,
    },

    recovery_context: {
      active_recovery_model: outputs.active_recovery_model,
      labour_share_percent: outputs.labour_share_percent,
      asset_share_percent: outputs.asset_share_percent,
      overhead_share_percent: outputs.overhead_share_percent,
      required_labour_recovery_rate: outputs.required_labour_recovery_rate,
      required_asset_recovery: outputs.required_asset_recovery,
    },

    recovery_streams: outputs.recovery_streams ?? [],

    structure_summary: {
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
    },

    macro_driver: {
      dominant_recovery_stream: outputs.dominant_recovery_stream,
      dominant_recovery_share_percent: outputs.dominant_recovery_share_percent,
      primary_constraint_title: outputs.primary_constraint_title,
      primary_constraint_message: outputs.primary_constraint_message,
    },

    totals: {
      total_recovery_actual: outputs.total_recovery_actual,
      recovery_gap: outputs.recovery_gap,
      recovery_gap_percent: outputs.recovery_gap_percent,
      business_model_health: outputs.business_model_health,
    },

    warnings: outputs.decision_warnings ?? [],
  };
}