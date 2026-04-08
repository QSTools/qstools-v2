function getStatusTone(outcome_status) {
  switch (outcome_status) {
    case "viable":
      return "success";
    case "marginal":
      return "warning";
    case "not_viable":
    default:
      return "danger";
  }
}

function formatPercent(value) {
  const number = Number(value ?? 0);
  return `${number.toFixed(0)}%`;
}

export function buildRecoveryOutcomeStatus(output = {}) {
  return {
    outcome_status: output.outcome_status ?? "not_viable",
    primary_constraint_title:
      output.primary_constraint_title ?? "Decision unavailable",
    active_recovery_model: output.active_recovery_model ?? "labour_only",
    structure_valid: output.structure_valid === true,
    warning_count: Array.isArray(output.decision_warnings)
      ? output.decision_warnings.length
      : 0,
    tone: getStatusTone(output.outcome_status),
  };
}

export function buildRecoveryOutcomeCard(output = {}) {
  return {
    outcome_banner: {
      outcome_status: output.outcome_status ?? "not_viable",
      outcome_title: output.outcome_title ?? "Decision unavailable",
      outcome_message:
        output.outcome_message ?? "Recovery outcome data is not ready.",
      recommended_action:
        output.recommended_action ?? "Complete upstream modules first.",
      tone: getStatusTone(output.outcome_status),
    },

    recovery_context: {
      active_recovery_model: output.active_recovery_model ?? "labour_only",
      labour_share_percent: formatPercent(output.labour_share_percent),
      asset_share_percent: formatPercent(output.asset_share_percent),
      overhead_share_percent: formatPercent(output.overhead_share_percent),
      required_recovery_rate: output.required_recovery_rate ?? 0,
      required_labour_recovery_rate: output.required_labour_recovery_rate ?? 0,
      required_asset_recovery: output.required_asset_recovery ?? 0,
      required_revenue: output.required_revenue ?? 0,
      total_cost_burden: output.total_cost_burden ?? 0,
      total_productive_output: output.total_productive_output ?? 0,
    },

    structure_summary: {
      structure_valid: output.structure_valid === true,
      active_allocation_profile_id: output.active_allocation_profile_id ?? null,
      staff_coverage_percent: formatPercent(output.staff_coverage_percent),
      asset_coverage_percent: formatPercent(output.asset_coverage_percent),
      group_coverage_percent: formatPercent(output.group_coverage_percent),
      linked_staff_count: output.linked_staff_count ?? 0,
      unlinked_staff_count: output.unlinked_staff_count ?? 0,
      linked_asset_count: output.linked_asset_count ?? 0,
      unlinked_asset_count: output.unlinked_asset_count ?? 0,
      valid_operational_groups: output.valid_operational_groups ?? 0,
      invalid_operational_groups: output.invalid_operational_groups ?? 0,
    },

    constraint_block: {
      primary_constraint_title:
        output.primary_constraint_title ?? "Decision unavailable",
      primary_constraint_message:
        output.primary_constraint_message ??
        "Upstream decision data is incomplete.",
    },

    recommended_action:
      output.recommended_action ?? "Complete upstream modules first.",

    warnings: Array.isArray(output.decision_warnings)
      ? output.decision_warnings
      : [],
  };
}