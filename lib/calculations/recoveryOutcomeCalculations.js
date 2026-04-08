const COVERAGE_THRESHOLD_PERCENT = 70;

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toBoolean(value) {
  return value === true;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildConstraintContent(primary_constraint_key) {
  switch (primary_constraint_key) {
    case "share_model_invalid":
      return {
        primary_constraint_title: "Recovery shares are invalid",
        primary_constraint_message:
          "The selected recovery shares do not total 100%, so the recovery strategy is not commercially valid.",
        recommended_action: "Fix recovery shares to total 100%.",
        outcome_title: "Model not viable",
        outcome_message:
          "The recovery model cannot be relied on until the share split is corrected.",
      };

    case "no_recoverable_base":
      return {
        primary_constraint_title: "No recoverable labour base",
        primary_constraint_message:
          "The model relies on labour recovery, but there is no productive labour output available to carry that recovery.",
        recommended_action:
          "Add productive labour capacity before relying on labour recovery.",
        outcome_title: "Model not viable",
        outcome_message:
          "There is no practical labour base available to recover the required cost.",
      };

    case "structure_incomplete":
      return {
        primary_constraint_title: "Structure is incomplete",
        primary_constraint_message:
          "The chosen recovery strategy requires operational structure, but the current links or groups are not complete enough to support it.",
        recommended_action:
          "Complete asset ↔ staff links and operational groups.",
        outcome_title: "Model not viable",
        outcome_message:
          "The strategy may be valid in theory, but the delivery structure is not ready.",
      };

    case "asset_strategy_without_assets":
      return {
        primary_constraint_title: "Asset recovery has no asset base",
        primary_constraint_message:
          "The model expects some recovery through assets, but there are no usable assets supporting that strategy.",
        recommended_action: "Reduce asset recovery share or introduce assets.",
        outcome_title: "Model marginal",
        outcome_message:
          "Asset recovery has been included, but the asset base is missing or too weak to support it.",
      };

    case "weak_structure":
      return {
        primary_constraint_title: "Structure is weak",
        primary_constraint_message:
          "The structure is technically valid, but coverage across staff, assets, or groups is still weak and may limit consistent delivery.",
        recommended_action: "Strengthen structural coverage before scaling.",
        outcome_title: "Model marginal",
        outcome_message:
          "The model can work, but structural coverage is too thin for confidence.",
      };

    case "healthy":
    default:
      return {
        primary_constraint_title: "Healthy state",
        primary_constraint_message:
          "The recovery strategy and supporting structure are aligned and currently show no blocking issues.",
        recommended_action:
          "Current model is structurally and strategically viable.",
        outcome_title: "Model viable",
        outcome_message:
          "The current recovery model appears commercially and structurally sound.",
      };
  }
}

export function calculateRecoveryOutcome({
  recovery_summary = {},
  cost_allocation = {},
} = {}) {
  const active_recovery_model =
    recovery_summary.active_recovery_model ?? "labour_only";

  const labour_share_percent = toNumber(recovery_summary.labour_share_percent);
  const asset_share_percent = toNumber(recovery_summary.asset_share_percent);
  const overhead_share_percent = toNumber(
    recovery_summary.overhead_share_percent
  );

  const required_revenue = toNumber(recovery_summary.required_revenue);
  const required_recovery_rate = toNumber(
    recovery_summary.required_recovery_rate
  );
  const required_labour_recovery_rate = toNumber(
    recovery_summary.required_labour_recovery_rate
  );
  const required_asset_recovery = toNumber(
    recovery_summary.required_asset_recovery
  );
  const total_cost_burden = toNumber(recovery_summary.total_cost_burden);
  const total_productive_output = toNumber(
    recovery_summary.total_productive_output
  );

  const share_not_balanced = toBoolean(recovery_summary.share_not_balanced);
  const no_productive_output = toBoolean(recovery_summary.no_productive_output);
  const asset_recovery_without_assets = toBoolean(
    recovery_summary.asset_recovery_without_assets
  );
  const labour_recovery_without_labour = toBoolean(
    recovery_summary.labour_recovery_without_labour
  );

  const active_allocation_profile_id =
    cost_allocation.active_allocation_profile_id ?? null;
  const structure_valid = toBoolean(cost_allocation.structure_valid);

  const staff_coverage_percent = toNumber(
    cost_allocation.staff_coverage_percent
  );
  const asset_coverage_percent = toNumber(
    cost_allocation.asset_coverage_percent
  );
  const group_coverage_percent = toNumber(
    cost_allocation.group_coverage_percent
  );

  const linked_staff_count = toNumber(cost_allocation.linked_staff_count);
  const unlinked_staff_count = toNumber(cost_allocation.unlinked_staff_count);
  const linked_asset_count = toNumber(cost_allocation.linked_asset_count);
  const unlinked_asset_count = toNumber(cost_allocation.unlinked_asset_count);

  const valid_operational_groups = toNumber(
    cost_allocation.valid_operational_groups
  );
  const invalid_operational_groups = toNumber(
    cost_allocation.invalid_operational_groups
  );

  const recovery_warnings = asArray(recovery_summary.warnings);
  const duplicate_link_warnings = asArray(cost_allocation.duplicate_link_warnings);
  const orphan_warnings = asArray(cost_allocation.orphan_warnings);
  const group_validation_warnings = asArray(
    cost_allocation.group_validation_warnings
  );

  const decision_warnings = [
    ...recovery_warnings,
    ...duplicate_link_warnings,
    ...orphan_warnings,
    ...group_validation_warnings,
  ];

  let outcome_status = "viable";
  let primary_constraint_key = "healthy";

  if (share_not_balanced) {
    outcome_status = "not_viable";
    primary_constraint_key = "share_model_invalid";
  } else if (no_productive_output || labour_recovery_without_labour) {
    outcome_status = "not_viable";
    primary_constraint_key = "no_recoverable_base";
  } else if (
    (active_recovery_model === "asset_driven" ||
      active_recovery_model === "hybrid") &&
    !structure_valid
  ) {
    outcome_status = "not_viable";
    primary_constraint_key = "structure_incomplete";
  } else if (asset_share_percent > 0 && asset_recovery_without_assets) {
    outcome_status = "marginal";
    primary_constraint_key = "asset_strategy_without_assets";
  } else if (
    structure_valid &&
    (staff_coverage_percent < COVERAGE_THRESHOLD_PERCENT ||
      asset_coverage_percent < COVERAGE_THRESHOLD_PERCENT ||
      group_coverage_percent < COVERAGE_THRESHOLD_PERCENT)
  ) {
    outcome_status = "marginal";
    primary_constraint_key = "weak_structure";
  }

  if (primary_constraint_key === "healthy") {
    outcome_status = "viable";
  }

  const constraint_content = buildConstraintContent(primary_constraint_key);

  return {
    outcome_status,
    outcome_title: constraint_content.outcome_title,
    outcome_message: constraint_content.outcome_message,

    primary_constraint_key,
    primary_constraint_title: constraint_content.primary_constraint_title,
    primary_constraint_message: constraint_content.primary_constraint_message,

    recommended_action: constraint_content.recommended_action,

    active_recovery_model,
    active_allocation_profile_id,

    labour_share_percent,
    asset_share_percent,
    overhead_share_percent,

    required_revenue,
    required_recovery_rate,
    required_labour_recovery_rate,
    required_asset_recovery,
    total_cost_burden,
    total_productive_output,

    structure_valid,

    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,

    linked_staff_count,
    unlinked_staff_count,
    linked_asset_count,
    unlinked_asset_count,

    valid_operational_groups,
    invalid_operational_groups,

    decision_warnings,
  };
}