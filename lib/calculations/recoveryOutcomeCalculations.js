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

function normalise_rate_models(rate_models = {}) {
  const models = as_array(rate_models.models);

  return models.map((model, index) => ({
    stream_key: model.stream_key || `rate_model_${index + 1}`,
    stream_name:
      model.stream_name ||
      model.rate_model_type ||
      model.unit_label ||
      `Rate Model ${index + 1}`,
    rate_model_type: model.rate_model_type || "rate_model",
    unit_label: model.unit_label || "",
    expected_recovery_contribution: to_number(
      model.expected_recovery_contribution
    ),
    expected_revenue_annual: to_number(model.expected_revenue_annual),
    warnings: as_array(model.warnings),
  }));
}

function get_combined_warnings({
  recovery_summary = {},
  cost_allocation = {},
  materials = {},
  rate_models = {},
}) {
  return [
    ...as_array(recovery_summary.warnings),
    ...as_array(cost_allocation.duplicate_link_warnings),
    ...as_array(cost_allocation.orphan_warnings),
    ...as_array(cost_allocation.group_validation_warnings),
    ...as_array(materials.warnings),
    ...as_array(rate_models.warnings),
  ].filter(Boolean);
}

function build_recovery_streams({
  recovery_summary = {},
  materials = {},
  rate_models = {},
}) {
  const streams = [];

  const labour_stream = to_number(recovery_summary.labour_recovery_cost);
  const asset_stream = to_number(recovery_summary.asset_recovery_cost);
  const material_stream = to_number(materials.material_margin_annual);

  streams.push({
    stream_key: "labour",
    stream_name: "Labour recovery stream",
    contribution_value: labour_stream,
  });

  streams.push({
    stream_key: "asset",
    stream_name: "Asset-linked recovery stream",
    contribution_value: asset_stream,
  });

  streams.push({
    stream_key: "materials",
    stream_name: "Material margin stream",
    contribution_value: material_stream,
  });

  normalise_rate_models(rate_models).forEach((model) => {
    streams.push({
      stream_key: model.stream_key,
      stream_name: model.stream_name,
      contribution_value: to_number(model.expected_recovery_contribution),
      unit_label: model.unit_label,
      rate_model_type: model.rate_model_type,
    });
  });

  return streams.map((stream) => ({
    ...stream,
    contribution_value: round_currency(stream.contribution_value),
  }));
}

function determine_primary_constraint({
  recovery_summary = {},
  cost_allocation = {},
  total_cost_burden = 0,
  total_recovery_actual = 0,
  recovery_gap = 0,
  dominant_recovery_stream = "none",
  dominant_recovery_share_percent = 0,
}) {
  const active_recovery_model =
    recovery_summary.active_recovery_model || "labour_only";

  const total_productive_output = to_number(recovery_summary.total_productive_output);
  const structure_valid = Boolean(cost_allocation.structure_valid);

  const staff_coverage_percent = to_number(cost_allocation.staff_coverage_percent);
  const asset_coverage_percent = to_number(cost_allocation.asset_coverage_percent);
  const group_coverage_percent = to_number(cost_allocation.group_coverage_percent);

  const share_total =
    to_number(recovery_summary.labour_share_percent) +
    to_number(recovery_summary.asset_share_percent) +
    to_number(recovery_summary.overhead_share_percent);

  if (Math.abs(share_total - 100) > 0.01) {
    return {
      key: "share_model_invalid",
      title: "Recovery shares do not balance",
      message: "The recovery share model must total 100% before this outcome can be trusted.",
      recommended_action: "Fix recovery shares so they total 100%.",
      status: "not_viable",
    };
  }

  if (
    total_productive_output <= 0 &&
    to_number(recovery_summary.labour_share_percent) > 0
  ) {
    return {
      key: "no_recoverable_base",
      title: "No productive labour base",
      message: "Labour recovery is active, but there is no productive output to recover cost through.",
      recommended_action: "Add productive labour capacity before relying on labour recovery.",
      status: "not_viable",
    };
  }

  if (
    (active_recovery_model === "asset_driven" || active_recovery_model === "hybrid") &&
    !structure_valid
  ) {
    return {
      key: "structure_incomplete",
      title: "Structure is incomplete",
      message: "The selected recovery strategy depends on asset-linked delivery, but the operating structure is not currently valid.",
      recommended_action: "Complete asset-staff links and operational groups.",
      status: "not_viable",
    };
  }

  if (total_cost_burden > 0 && total_recovery_actual < total_cost_burden) {
    const gap_percent = recovery_gap / total_cost_burden;

    if (gap_percent > 0.1) {
      return {
        key: "recovery_gap",
        title: "Recovery is below required cost",
        message: "Combined recovery streams are not yet covering the full business cost burden.",
        recommended_action: "Increase recovery contribution or reduce total cost burden.",
        status: "not_viable",
      };
    }

    return {
      key: "thin_recovery_cover",
      title: "Recovery cover is thin",
      message: "The model is close, but recovery coverage is still slightly under the required annual cost.",
      recommended_action: "Strengthen the weakest stream before scaling.",
      status: "marginal",
    };
  }

  if (
    staff_coverage_percent < 70 ||
    asset_coverage_percent < 70 ||
    group_coverage_percent < 70
  ) {
    return {
      key: "weak_structure",
      title: "Structure is weak",
      message: "The business may recover on paper, but structural coverage is still weak across staff, assets, or groups.",
      recommended_action: "Improve structural coverage before relying on this model.",
      status: "marginal",
    };
  }

  if (dominant_recovery_share_percent >= 75) {
    return {
      key: "single_stream_dependency",
      title: "Recovery depends heavily on one stream",
      message: `Most recovery is currently being carried by ${dominant_recovery_stream}.`,
      recommended_action: "Reduce dependence on a single stream where possible.",
      status: "marginal",
    };
  }

  return {
    key: "healthy",
    title: "Business model looks viable",
    message: "Cost, recovery, revenue streams, and structure are currently aligned well enough to support the model.",
    recommended_action: "Current model is commercially viable. Monitor and refine.",
    status: "viable",
  };
}

function build_outcome_title(status) {
  if (status === "viable") return "Model looks commercially viable";
  if (status === "marginal") return "Model works, but needs tightening";
  return "Model is not yet commercially viable";
}

function build_outcome_message({
  status,
  total_cost_burden,
  total_recovery_actual,
  recovery_gap,
}) {
  if (status === "viable") {
    return `Recovery streams currently cover the annual business cost burden. Total recovery is ${round_currency(
      total_recovery_actual
    )} against required cost of ${round_currency(total_cost_burden)}.`;
  }

  if (status === "marginal") {
    return `The model is close, but still fragile. Recovery is ${round_currency(
      total_recovery_actual
    )} against required cost of ${round_currency(
      total_cost_burden
    )}, leaving a gap of ${round_currency(recovery_gap)} or weak structure pressure.`;
  }

  return `The current business model is not yet covering required annual cost. Recovery is ${round_currency(
    total_recovery_actual
  )} against required cost of ${round_currency(
    total_cost_burden
  )}, leaving a gap of ${round_currency(recovery_gap)}.`;
}

export function calculateRecoveryOutcome({
  recovery_summary = {},
  cost_allocation = {},
  materials = {},
  rate_models = {},
} = {}) {
  const total_cost_burden = round_currency(recovery_summary.total_cost_burden);
  const required_revenue = round_currency(recovery_summary.required_revenue);
  const required_recovery_rate = round_currency(
    recovery_summary.required_recovery_rate
  );
  const total_productive_output = round_currency(
    recovery_summary.total_productive_output
  );

  const streams = build_recovery_streams({
    recovery_summary,
    materials,
    rate_models,
  });

  const total_recovery_actual = round_currency(
    streams.reduce(
      (sum, stream) => sum + to_number(stream.contribution_value),
      0
    )
  );

  const recovery_gap = round_currency(total_cost_burden - total_recovery_actual);
  const recovery_gap_percent =
    total_cost_burden > 0
      ? round_percent((recovery_gap / total_cost_burden) * 100)
      : 0;

  const dominant_stream =
    streams
      .slice()
      .sort((a, b) => b.contribution_value - a.contribution_value)[0] ?? null;

  const dominant_recovery_stream = dominant_stream?.stream_name ?? "None";
  const dominant_recovery_share_percent =
    total_recovery_actual > 0 && dominant_stream
      ? round_percent(
          (dominant_stream.contribution_value / total_recovery_actual) * 100
        )
      : 0;

  const primary_constraint = determine_primary_constraint({
    recovery_summary,
    cost_allocation,
    total_cost_burden,
    total_recovery_actual,
    recovery_gap,
    dominant_recovery_stream,
    dominant_recovery_share_percent,
  });

  const outcome_status = primary_constraint.status;
  const outcome_title = build_outcome_title(outcome_status);
  const outcome_message = build_outcome_message({
    status: outcome_status,
    total_cost_burden,
    total_recovery_actual,
    recovery_gap,
  });

  const structure_valid = Boolean(cost_allocation.structure_valid);

  const staff_coverage_percent = round_percent(
    cost_allocation.staff_coverage_percent
  );
  const asset_coverage_percent = round_percent(
    cost_allocation.asset_coverage_percent
  );
  const group_coverage_percent = round_percent(
    cost_allocation.group_coverage_percent
  );

  const combined_warnings = get_combined_warnings({
    recovery_summary,
    cost_allocation,
    materials,
    rate_models,
  });

  const streams_with_share = streams.map((stream) => ({
    ...stream,
    contribution_percent:
      total_recovery_actual > 0
        ? round_percent(
            (to_number(stream.contribution_value) / total_recovery_actual) * 100
          )
        : 0,
  }));

  return {
    outcome_status,
    outcome_title,
    outcome_message,

    primary_constraint_key: primary_constraint.key,
    primary_constraint_title: primary_constraint.title,
    primary_constraint_message: primary_constraint.message,
    recommended_action: primary_constraint.recommended_action,

    active_recovery_model:
      recovery_summary.active_recovery_model || "labour_only",

    total_cost_burden,
    required_revenue,
    required_recovery_rate,
    total_productive_output,

    labour_share_percent: round_percent(recovery_summary.labour_share_percent),
    asset_share_percent: round_percent(recovery_summary.asset_share_percent),
    overhead_share_percent: round_percent(
      recovery_summary.overhead_share_percent
    ),

    required_labour_recovery_rate: round_currency(
      recovery_summary.required_labour_recovery_rate
    ),
    required_asset_recovery: round_currency(
      recovery_summary.required_asset_recovery
    ),

    structure_valid,
    staff_coverage_percent,
    asset_coverage_percent,
    group_coverage_percent,
    linked_staff_count: to_number(cost_allocation.linked_staff_count),
    unlinked_staff_count: to_number(cost_allocation.unlinked_staff_count),
    linked_asset_count: to_number(cost_allocation.linked_asset_count),
    unlinked_asset_count: to_number(cost_allocation.unlinked_asset_count),
    valid_operational_groups: to_number(cost_allocation.valid_operational_groups),
    invalid_operational_groups: to_number(
      cost_allocation.invalid_operational_groups
    ),

    annual_material_cost: round_currency(materials.annual_material_cost),
    annual_material_revenue: round_currency(materials.annual_material_revenue),
    material_margin_annual: round_currency(materials.material_margin_annual),
    material_margin_percent: round_percent(materials.material_margin_percent),

    recovery_streams: streams_with_share,
    total_recovery_actual,
    recovery_gap,
    recovery_gap_percent,
    dominant_recovery_stream,
    dominant_recovery_share_percent,

    business_model_health: outcome_status,
    decision_warnings: combined_warnings,
  };
}