function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function selectCostSummaryLabour(labour) {
  const contract_active_staff = Array.isArray(
    labour?.output_contract?.active_staff
  )
    ? labour.output_contract.active_staff
    : [];

  const output_contract = labour?.output_contract ?? {};
  const profiles = Array.isArray(labour?.profiles) ? labour.profiles : [];

  return {
    saved_profile_count: profiles.length,
    active_profile_count: contract_active_staff.length,
    active_staff: contract_active_staff,
    all_staff_rows: contract_active_staff,
    total_labour_cost_annual: toNumber(
      output_contract.total_labour_cost_annual
    ),
    total_productive_output: toNumber(
      output_contract.total_productive_output
    ),
    total_gross_wages_annual: toNumber(
      output_contract.total_gross_wages_annual
    ),
    total_entitlements_annual: toNumber(
      output_contract.total_entitlements_annual
    ),
    total_employer_kiwisaver_annual: toNumber(
      output_contract.total_employer_kiwisaver_annual
    ),
    total_esct_annual: toNumber(output_contract.total_esct_annual),
    total_acc_levy_annual: toNumber(output_contract.total_acc_levy_annual),
    total_employer_contribution_annual: toNumber(
      output_contract.total_employer_contribution_annual
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

  const has_saved_labour = labour_data.saved_profile_count > 0;
  const has_active_labour = labour_data.active_profile_count > 0;

  if (!has_saved_labour) {
    warnings.push("No saved Labour profiles.");
    missing_modules.push("Labour");
  }

  if (!has_active_labour) {
    warnings.push("No Labour profiles available for aggregation.");
  }

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

  if (!has_asset_data) {
    warnings.push("Asset costs are not flowing into Business Cost yet.");
  }

  if (!has_general_overhead_data) {
    warnings.push("General Overheads are not flowing into Business Cost yet.");
  }

  if (!has_productive_output) {
    warnings.push(
      "Productive output is zero, so required recovery rate is set to 0."
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
    labour_profiles_label: `${labour_data.active_profile_count} active`,
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
  const asset_rows = Array.isArray(asset_data?.active_assets)
    ? asset_data.active_assets
    : Array.isArray(asset_data?.assets)
      ? asset_data.assets
      : [];
  const people_rows = [...calculations.people_rows].sort(
    (a, b) => b.total_people_cost_annual - a.total_people_cost_annual
  );

  const labour_share =
    calculations.total_cost_burden > 0
      ? (calculations.total_people_cost_annual /
          calculations.total_cost_burden) *
        100
      : 0;

  let highlight_insight =
    "Active Labour profiles are aggregated through the Labour output contract.";

  if (labour_data.active_profile_count === 0) {
    highlight_insight =
      "No stored Labour profiles are available for aggregation.";
  } else if (calculations.total_productive_output <= 0) {
    highlight_insight =
      "Productive output is zero, so recovery cannot be calculated.";
  } else {
    highlight_insight = `Labour represents ${labour_share.toFixed(
      1
    )}% of the current cost burden baseline.`;
  }

  return {
    recovery_model_block: {
      recovery_model_label: "Cost Baseline",
      linked_staff_count: labour_data.active_profile_count,
      linked_asset_count: asset_rows.length,
      warnings:
        labour_data.active_profile_count === 0
          ? ["No stored Labour profiles available"]
          : [],
    },

    people_cost_total: calculations.total_people_cost_annual,
    gross_wages_total: calculations.total_gross_wages_annual,
    entitlements_total: calculations.total_entitlements_annual,
    employer_kiwisaver_total: calculations.total_employer_kiwisaver_annual,
    esct_total: calculations.total_esct_annual,
    acc_levy_total: calculations.total_acc_levy_annual,
    employer_contribution_total:
      calculations.total_employer_contribution_annual,
    people_rows,

    business_cost_total: calculations.total_business_cost_annual,
    asset_cost_total: calculations.total_asset_cost_annual,
    general_overheads_total: calculations.total_business_overheads,
    asset_rows,
    general_overhead_rows: general_overhead_data?.overhead_rows ?? [],

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
