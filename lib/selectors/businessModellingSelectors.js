function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildBusinessModellingStatus({
  baseline_snapshot,
  active_scenario,
  modelling_ready,
  modelling_warnings,
  selected_model_type,
}) {
  const selected_model_name = active_scenario?.scenario_name || "Baseline";
  const modified =
    active_scenario && active_scenario.scenario_type !== "baseline";
  const warning_count = modelling_warnings.length;
  const status_label = modelling_ready
    ? warning_count > 0
      ? "ready_with_warnings"
      : "ready"
    : "blocked";
  const selected_model_trust_state =
    status_label === "ready" && warning_count === 0
      ? "ready"
      : active_scenario?.scenario_trust_state || "blocked";

  return {
    baseline_date: baseline_snapshot?.created_at || "",
    selected_model_name,
    selected_model_type,
    selected_model_trust_state,
    selected_scenario_status: status_label,
    selected_scenario_modified: modified,
    annual_delta: toNumber(active_scenario?.scenario_delta_annual),
    per_hour_delta: toNumber(active_scenario?.scenario_delta_per_hour),
    warning_count,
    modelling_ready,
    modelling_warnings,
  };
}

export function buildBusinessModellingBaselineCard(baseline_snapshot) {
  const snapshot = baseline_snapshot ?? {};
  const baselineTrustState = snapshot.model_trust_state || "blocked";
  const baselineDisplayTrustState =
    baselineTrustState !== "blocked" &&
    (snapshot.source_warnings?.length ?? 0) === 0
      ? "ready"
      : baselineTrustState;

  return {
    total_revenue: toNumber(snapshot.total_revenue),
    total_direct_costs: toNumber(snapshot.total_direct_costs),
    margin_pool: toNumber(snapshot.margin_pool),
    total_cost_burden: toNumber(snapshot.total_cost_burden),
    net_position: toNumber(snapshot.net_position),
    total_productive_output: toNumber(snapshot.total_productive_output),
    required_recovery_rate: toNumber(snapshot.required_recovery_rate),
    current_margin_per_productive_hour: toNumber(
      snapshot.current_margin_per_productive_hour
    ),
    recovery_gap_per_hour: toNumber(snapshot.recovery_gap_per_hour),
    model_trust_state: baselineDisplayTrustState,
  };
}

export function buildBusinessModellingScenarioControls(scenario) {
  const source = scenario ?? {};

  return {
    scenario_type: source.scenario_type,
    scenario_name: source.scenario_name,
    scenario_total_revenue: toNumber(source.scenario_total_revenue),
    scenario_total_direct_costs: toNumber(source.scenario_total_direct_costs),
    scenario_total_cost_burden: toNumber(source.scenario_total_cost_burden),
    scenario_total_productive_output: toNumber(
      source.scenario_total_productive_output
    ),
    scenario_required_recovery_rate: toNumber(
      source.scenario_required_recovery_rate
    ),
  };
}

export function buildBusinessModellingScenarioResult(scenario) {
  const source = scenario ?? {};

  return {
    scenario_total_revenue: toNumber(source.scenario_total_revenue),
    scenario_total_direct_costs: toNumber(source.scenario_total_direct_costs),
    scenario_margin_pool: toNumber(source.scenario_margin_pool),
    scenario_total_cost_burden: toNumber(source.scenario_total_cost_burden),
    scenario_net_position: toNumber(source.scenario_net_position),
    scenario_total_productive_output: toNumber(
      source.scenario_total_productive_output
    ),
    scenario_required_recovery_rate: toNumber(
      source.scenario_required_recovery_rate
    ),
    scenario_margin_per_productive_hour: toNumber(
      source.scenario_margin_per_productive_hour),
    scenario_recovery_gap_per_hour: toNumber(
      source.scenario_recovery_gap_per_hour),
    scenario_status: source.scenario_status,
    scenario_warnings: source.scenario_warnings || [],
    scenario_trust_state: source.scenario_trust_state,
  };
}

export function buildBusinessModellingDeltaCard({
  scenario_delta_annual,
  scenario_delta_per_hour,
  baseline_snapshot,
  scenario,
}) {
  const source = scenario ?? {};
  const baseline = baseline_snapshot ?? {};

  return {
    scenario_delta_annual: toNumber(scenario_delta_annual),
    scenario_delta_per_hour: toNumber(scenario_delta_per_hour),
    net_position_change:
      toNumber(source.scenario_net_position) -
      toNumber(baseline.net_position),
    margin_pool_change:
      toNumber(source.scenario_margin_pool) -
      toNumber(baseline.margin_pool),
    recovery_gap_change:
      toNumber(source.scenario_recovery_gap_per_hour) -
      toNumber(baseline.recovery_gap_per_hour),
  };
}

export function buildBusinessModellingSelectedModelOutput({
  selected_model_type,
  baseline_snapshot,
  active_scenario,
}) {
  const selected = active_scenario || baseline_snapshot;
  const selected_type = selected_model_type || "baseline";

  return {
    selected_model_id: selected?.scenario_id || selected?.baseline_id || "",
    selected_model_name: selected?.scenario_name || selected?.baseline_name || "Baseline",
    selected_model_type: selected_type,
    selected_model_trust_state: selected?.scenario_trust_state || selected?.model_trust_state || "blocked",
    selected_model_total_revenue:
      toNumber(selected?.scenario_total_revenue) || toNumber(selected?.total_revenue),
    selected_model_direct_costs:
      toNumber(selected?.scenario_total_direct_costs) || toNumber(selected?.total_direct_costs),
    selected_model_margin_pool:
      toNumber(selected?.scenario_margin_pool) || toNumber(selected?.margin_pool),
    selected_model_total_cost_burden:
      toNumber(selected?.scenario_total_cost_burden) || toNumber(selected?.total_cost_burden),
    selected_model_total_productive_output:
      toNumber(selected?.scenario_total_productive_output) || toNumber(selected?.total_productive_output),
    selected_model_required_recovery_rate:
      toNumber(selected?.scenario_required_recovery_rate) || toNumber(selected?.required_recovery_rate),
    selected_model_margin_per_productive_hour:
      toNumber(selected?.scenario_margin_per_productive_hour) || toNumber(selected?.current_margin_per_productive_hour),
    selected_model_recovery_gap_per_hour:
      toNumber(selected?.scenario_recovery_gap_per_hour) || toNumber(selected?.recovery_gap_per_hour),
    selected_model_net_position:
      toNumber(selected?.scenario_net_position) || toNumber(selected?.net_position),
  };
}
