function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
    required_recovery_rate: toNumber(required_recovery_rate),
    current_margin_per_productive_hour: toNumber(current_margin_per_productive_hour),
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
  const default_values = {
    scenario_total_revenue: baseline_snapshot.total_revenue,
    scenario_total_direct_costs: baseline_snapshot.total_direct_costs,
    scenario_total_cost_burden: baseline_snapshot.total_cost_burden,
    scenario_total_productive_output:
      baseline_snapshot.total_productive_output,
    scenario_required_recovery_rate: baseline_snapshot.required_recovery_rate,
  };

  const values = {
    ...default_values,
    ...scenario_state,
  };

  const total_revenue = toNumber(values.scenario_total_revenue);
  const total_direct_costs = toNumber(values.scenario_total_direct_costs);
  const total_cost_burden = toNumber(values.scenario_total_cost_burden);
  const total_productive_output = toNumber(
    values.scenario_total_productive_output
  );
  const required_recovery_rate = toNumber(
    values.scenario_required_recovery_rate
  );
  const margin_pool = total_revenue - total_direct_costs;
  const net_position = margin_pool - total_cost_burden;
  const margin_per_productive_hour =
    total_productive_output === 0
      ? 0
      : margin_pool / total_productive_output;
  const recovery_gap_per_hour =
    total_productive_output === 0
      ? 0
      : margin_per_productive_hour - required_recovery_rate;
  const gross_margin_percent =
    total_revenue === 0 ? 0 : margin_pool / total_revenue;

  const warnings = [];
  if (total_productive_output === 0) {
    warnings.push({
      warning_id: "scenario_productive_output_zero",
      message:
        "Scenario productive output is zero, so per-hour outputs are held at 0.",
    });
  }

  if (required_recovery_rate === 0) {
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
    scenario_total_revenue: total_revenue,
    scenario_total_direct_costs: total_direct_costs,
    scenario_margin_pool: margin_pool,
    scenario_gross_margin_percent: gross_margin_percent,
    scenario_total_cost_burden: total_cost_burden,
    scenario_net_position: net_position,
    scenario_total_productive_output: total_productive_output,
    scenario_required_recovery_rate: required_recovery_rate,
    scenario_margin_per_productive_hour: margin_per_productive_hour,
    scenario_recovery_gap_per_hour: recovery_gap_per_hour,
    scenario_warnings: warnings,
    scenario_trust_state: baseline_snapshot.model_trust_state,
    scenario_status:
      baseline_snapshot.model_trust_state === "blocked"
        ? "blocked"
        : warnings.length > 0
        ? "ready_with_warnings"
        : "ready",
    created_at: scenario_state.created_at || now,
    updated_at: scenario_state.updated_at || now,
  };
}

export function calculateScenarioDelta({
  scenario,
  baseline_snapshot,
}) {
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
      scenario.scenario_recovery_gap_per_hour - baseline_snapshot.recovery_gap_per_hour,
  };
}
