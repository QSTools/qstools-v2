function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function selectCostSummaryLabour(labour) {
  const output_contract = labour?.output_contract ?? {};

  return {
    total_labour_cost_annual: toNumber(
      output_contract.total_labour_cost_annual
    ),
    total_productive_output: toNumber(
      output_contract.total_productive_output
    ),
    total_available_hours_before_productivity: toNumber(
      output_contract.total_available_hours_before_productivity
    ),
    weighted_productivity_percent: toNumber(
      output_contract.weighted_productivity_percent
    ),
  };
}

export function buildCostSummaryStatus({
  labour_data,
  asset_data,
  general_overhead_data,
  calculations,
  model_readiness = {},
}) {
  const warnings = [];
  const missing_modules = [];
  const has_labour_data = Object.prototype.hasOwnProperty.call(
    labour_data ?? {},
    "total_labour_cost_annual"
  );

  const has_asset_data = Object.prototype.hasOwnProperty.call(
    asset_data ?? {},
    "total_asset_cost_annual"
  );
  const has_general_overhead_data = Object.prototype.hasOwnProperty.call(
    general_overhead_data ?? {},
    "total_general_overheads"
  );
  const has_productive_output =
    toNumber(calculations?.total_productive_output) > 0;

  if (!has_labour_data) {
    warnings.push("Labour output is missing. Fix Labour before trusting Cost Summary.");
    missing_modules.push("Labour");
  }

  if (!has_asset_data) {
    warnings.push("Assets output is missing. Fix Assets before trusting Cost Summary.");
    missing_modules.push("Assets");
  }

  if (!has_general_overhead_data) {
    warnings.push(
      "General Overheads output is missing. Fix General Overheads before trusting Cost Summary."
    );
    missing_modules.push("General Overheads");
  }

  if (!has_productive_output) {
    warnings.push(
      "Productive output is zero. Fix Labour productive output; required recovery rate remains 0 until then."
    );
  }

  const model_ready = model_readiness.model_ready === true;
  const model_readiness_status =
    model_readiness.model_readiness_status ?? "blocked";
  const blocking_checks = Array.isArray(model_readiness.blocking_checks)
    ? model_readiness.blocking_checks
    : [];
  const warning_checks = Array.isArray(model_readiness.warning_checks)
    ? model_readiness.warning_checks
    : [];

  return {
    labour_profiles_label: has_labour_data ? "Connected" : "Missing",
    asset_costs_label: has_asset_data ? "Connected" : "Missing",
    general_overheads_label: has_general_overhead_data ? "Connected" : "Missing",
    productive_output_label: has_productive_output
      ? calculations.total_productive_output.toFixed(0)
      : "0",
    missing_modules,
    warnings: [...warnings, ...warning_checks],
    is_ready: model_ready && has_productive_output,
    model_ready,
    model_readiness_status,
    blocking_modules: model_readiness.blocking_modules ?? [],
    warning_modules: model_readiness.warning_modules ?? [],
    blocking_checks,
    warning_checks,
  };
}

export function buildCostSummaryCard({
  labour_data,
  asset_data,
  general_overhead_data,
  calculations,
  model_readiness = {},
}) {
  const labour_share =
    calculations.total_cost_burden > 0
      ? (calculations.total_people_cost_annual /
          calculations.total_cost_burden) *
        100
      : 0;

  let highlight_insight =
    "Cost Summary is using Labour, Assets, and General Overheads outputs only.";

  if (calculations.total_productive_output <= 0) {
    highlight_insight =
      "Productive output is zero, so the required recovery rate is held at 0.";
  } else {
    highlight_insight = `Labour represents ${labour_share.toFixed(
      1
    )}% of the current cost burden baseline.`;
  }

  return {
    people_cost_total: calculations.total_people_cost_annual,

    business_cost_total: calculations.total_business_cost_annual,
    asset_cost_total: calculations.total_asset_cost_annual,
    total_asset_interest_annual: calculations.total_asset_interest_annual,
    general_overheads_total: calculations.total_business_overheads,

    total_cost_burden: calculations.total_cost_burden,
    required_revenue: calculations.required_revenue,
    required_recovery_rate: calculations.required_recovery_rate,
    total_productive_output: calculations.total_productive_output,
    model_ready: model_readiness.model_ready === true,
    model_readiness_status:
      model_readiness.model_readiness_status ?? "blocked",

    highlight_insight,
  };
}
