function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDivide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function buildBaselineSnapshot({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  total_cost_burden = 0,
  net_position = 0,
  total_productive_output = 0,
  required_recovery_rate = 0,
  current_margin_per_productive_hour = 0,
  recovery_gap_per_hour = 0,
  weighted_productivity_percent = 0,
  total_available_hours_before_productivity = 0,
  business_summary_status = "blocked",
  model_trust_state = "blocked",
  business_summary_warnings = [],
}) {
  const now = new Date().toISOString();

  return {
    baseline_id: `baseline-${now}`,
    baseline_name: "Baseline",
    baseline_type: "baseline",

    total_revenue: toNumber(total_revenue),
    total_direct_costs: toNumber(total_direct_costs),
    margin_pool: toNumber(margin_pool),
    gross_margin_percent: toNumber(gross_margin_percent),
    total_cost_burden: toNumber(total_cost_burden),
    net_position: toNumber(net_position),
    total_productive_output: toNumber(total_productive_output),
    weighted_productivity_percent: toNumber(weighted_productivity_percent),
    total_available_hours_before_productivity: toNumber(
      total_available_hours_before_productivity
    ),
    required_recovery_rate: toNumber(required_recovery_rate),
    current_margin_per_productive_hour: toNumber(
      current_margin_per_productive_hour
    ),
    recovery_gap_per_hour: toNumber(recovery_gap_per_hour),

    source_model_status: business_summary_status,
    source_business_summary_status: business_summary_status,
    source_warnings: business_summary_warnings,
    model_trust_state,

    created_at: now,
    updated_at: now,
  };
}

export function buildScenarioState({
  baseline_snapshot,
  scenario_type,
  scenario_name,
  scenario_state = {},
}) {
  if (!baseline_snapshot) {
    return null;
  }

  const now = new Date().toISOString();

  const baseline_productive_output = toNumber(
    baseline_snapshot.total_productive_output
  );
  const baseline_total_revenue = toNumber(baseline_snapshot.total_revenue);
  const baseline_total_direct_costs = toNumber(
    baseline_snapshot.total_direct_costs
  );
  const baseline_margin_pool = toNumber(baseline_snapshot.margin_pool);
  const baseline_total_cost_burden = toNumber(
    baseline_snapshot.total_cost_burden
  );

  const baseline_productivity_percent =
    toNumber(baseline_snapshot.weighted_productivity_percent) > 0
      ? toNumber(baseline_snapshot.weighted_productivity_percent)
      : 100;

  const baseline_charge_out_rate = toNumber(
    baseline_snapshot.current_margin_per_productive_hour
  );

  const baseline_direct_cost_rate = safeDivide(
    baseline_total_direct_costs,
    baseline_productive_output
  );

  const default_values = {
    scenario_charge_out_rate: baseline_charge_out_rate,
    scenario_productivity_percent: baseline_productivity_percent,
    scenario_margin_target_percent: 0,
    scenario_billable_volume_change_percent: 0,
  };

  const values = {
    ...default_values,
    ...scenario_state,
  };

  const scenario_charge_out_rate = toNumber(values.scenario_charge_out_rate);
  const scenario_productivity_percent = toNumber(
    values.scenario_productivity_percent
  );
  const scenario_margin_target_percent = toNumber(
    values.scenario_margin_target_percent
  );
  const scenario_billable_volume_change_percent = toNumber(
    values.scenario_billable_volume_change_percent
  );

  const productivity_factor =
    baseline_productivity_percent > 0
      ? scenario_productivity_percent / baseline_productivity_percent
      : 1;

  const billable_volume_factor =
    1 + scenario_billable_volume_change_percent / 100;

  const scenario_total_productive_output =
    baseline_productive_output * productivity_factor * billable_volume_factor;

  const scenario_total_direct_costs =
    baseline_direct_cost_rate * scenario_total_productive_output;

  const scenario_margin_pool =
    scenario_charge_out_rate * scenario_total_productive_output;

  const scenario_total_revenue =
    scenario_total_direct_costs + scenario_margin_pool;

  const scenario_total_cost_burden = baseline_total_cost_burden;

  const scenario_required_recovery_rate = safeDivide(
    scenario_total_cost_burden,
    scenario_total_productive_output
  );

  const margin_target_decimal = Math.min(
    Math.max(scenario_margin_target_percent / 100, 0),
    0.95
  );

  const scenario_target_charge_out_rate =
    margin_target_decimal >= 0.95
      ? 0
      : scenario_required_recovery_rate / (1 - margin_target_decimal);

  const scenario_net_position =
    scenario_margin_pool - scenario_total_cost_burden;

  const scenario_margin_per_productive_hour = safeDivide(
    scenario_margin_pool,
    scenario_total_productive_output
  );

  const scenario_recovery_gap_per_hour =
    scenario_margin_per_productive_hour - scenario_target_charge_out_rate;

  const scenario_gross_margin_percent = safeDivide(
    scenario_margin_pool,
    scenario_total_revenue
  );

  const scenario_revenue_variance =
    scenario_total_revenue - baseline_total_revenue;

  const scenario_direct_costs_variance =
    scenario_total_direct_costs - baseline_total_direct_costs;

  const scenario_margin_pool_variance =
    scenario_margin_pool - baseline_margin_pool;

  const scenario_net_position_variance =
    scenario_net_position - toNumber(baseline_snapshot.net_position);

  const scenario_productive_output_variance =
    scenario_total_productive_output - baseline_productive_output;

  const charge_out_rate_effect =
    (scenario_charge_out_rate - baseline_charge_out_rate) *
    baseline_productive_output;

  const productivity_effect =
    baseline_charge_out_rate *
    (baseline_productive_output * productivity_factor -
      baseline_productive_output);

  const billable_volume_effect =
    baseline_charge_out_rate *
    (baseline_productive_output *
      productivity_factor *
      billable_volume_factor -
      baseline_productive_output * productivity_factor);

  const warnings = [];

  if (scenario_total_productive_output === 0) {
    warnings.push({
      warning_id: "scenario_productive_output_zero",
      message:
        "Scenario productive output is zero, so per-hour outputs are held at 0.",
    });
  }

  if (scenario_required_recovery_rate === 0) {
    warnings.push({
      warning_id: "scenario_required_recovery_rate_zero",
      message:
        "Scenario required recovery rate is zero, so the gap is not a reliable benchmark.",
    });
  }

  return {
    scenario_id: scenario_state.scenario_id || `${scenario_type}-${now}`,
    scenario_name,
    scenario_type,

    scenario_charge_out_rate,
    scenario_productivity_percent,
    scenario_margin_target_percent,
    scenario_billable_volume_change_percent,

    baseline_charge_out_rate,
    baseline_direct_cost_rate,
    baseline_productivity_percent,

    scenario_total_revenue,
    scenario_total_direct_costs,
    scenario_margin_pool,
    scenario_gross_margin_percent,
    scenario_total_cost_burden,
    scenario_net_position,
    scenario_total_productive_output,
    scenario_required_recovery_rate,
    scenario_target_charge_out_rate,
    scenario_margin_per_productive_hour,
    scenario_recovery_gap_per_hour,

    scenario_revenue_variance,
    scenario_direct_costs_variance,
    scenario_margin_pool_variance,
    scenario_net_position_variance,
    scenario_productive_output_variance,

    charge_out_rate_effect,
    productivity_effect,
    billable_volume_effect,

    scenario_warnings: warnings,
    scenario_trust_state: baseline_snapshot.model_trust_state,
    scenario_status:
      baseline_snapshot.model_trust_state === "blocked"
        ? "blocked"
        : warnings.length > 0
          ? "ready_with_warnings"
          : "ready",

    created_at: scenario_state.created_at || now,
    updated_at: now,
  };
}

export function calculateScenarioDelta({ scenario, baseline_snapshot }) {
  if (!scenario || !baseline_snapshot) {
    return {
      scenario_delta_annual: 0,
      scenario_delta_per_hour: 0,
    };
  }

  return {
    scenario_delta_annual:
      scenario.scenario_net_position - baseline_snapshot.net_position,
    scenario_delta_per_hour:
      scenario.scenario_recovery_gap_per_hour -
      baseline_snapshot.recovery_gap_per_hour,
  };
}