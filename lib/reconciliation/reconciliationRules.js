function toNumber(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getEmployeeOverheadsCheck(pnl_output_contract = {}) {
  const has_employee_overheads =
    toNumber(pnl_output_contract.employee_overheads_benchmark_total) > 0 ||
    (Array.isArray(pnl_output_contract.employee_overheads_lines) &&
      pnl_output_contract.employee_overheads_lines.length > 0);

  return {
    id: "employee_overheads",
    module: "Profit & Loss",
    label: "Employee overheads detected",
    message: has_employee_overheads
      ? "The P&L still contains employee overheads, which must be reconciled into general overheads for v3.6 readiness."
      : "No employee overheads are present in the P&L.",
    status: has_employee_overheads ? "fail" : "pass",
    is_blocking: has_employee_overheads,
    is_warning: false,
  };
}

function getLegacyAssetRunningCostCheck(asset_output_contract = {}) {
  const running_cost_annual = toNumber(asset_output_contract.running_cost_annual);
  const has_legacy_running_cost = running_cost_annual > 0;

  return {
    id: "running_cost_annual",
    module: "Assets",
    label: "Legacy asset running costs",
    message: has_legacy_running_cost
      ? "Assets still include legacy running_cost_annual values. Reconcile these into the v3.6 asset cost structure."
      : "No legacy running_cost_annual asset values detected.",
    status: has_legacy_running_cost ? "warn" : "pass",
    is_blocking: false,
    is_warning: has_legacy_running_cost,
  };
}

function getModuleReadyCheck(module_name, is_ready) {
  return {
    id: `${module_name.toLowerCase().replace(/\s+/g, "_")}_ready`,
    module: module_name,
    label: `${module_name} readiness`,
    message: is_ready
      ? `${module_name} is ready.`
      : `${module_name} is not ready and requires attention.`,
    status: is_ready ? "pass" : "fail",
    is_blocking: !is_ready,
    is_warning: false,
  };
}

function getAssetsReadinessCheck({
  asset_status = {},
  asset_output_contract = {},
}) {
  const active_assets = Array.isArray(asset_output_contract.active_assets)
    ? asset_output_contract.active_assets
    : Array.isArray(asset_output_contract.assets)
      ? asset_output_contract.assets
      : [];
  const total_asset_cost_annual = toNumber(
    asset_output_contract.total_asset_cost_annual,
  );
  const no_active_assets_confirmed =
    asset_output_contract.no_active_assets_confirmed === true;
  const assets_ready = Boolean(
    asset_output_contract.assets_ready ?? asset_status.is_ready,
  );
  const has_active_assets = active_assets.length > 0;
  const no_assets_confirmed_ready =
    !has_active_assets &&
    no_active_assets_confirmed &&
    total_asset_cost_annual === 0;
  const active_assets_ready = has_active_assets && assets_ready;
  const passed = active_assets_ready || no_assets_confirmed_ready;

  return {
    id: "assets_ready",
    check_id: "assets_ready",
    module: "Assets",
    label: "Assets readiness",
    severity: passed ? "info" : "blocker",
    passed,
    message: active_assets_ready
      ? "Assets are ready with active ownership-only asset records."
      : no_assets_confirmed_ready
        ? "No active assets have been explicitly confirmed for this business model."
        : has_active_assets
          ? "Assets have active records but are not ready under the existing asset readiness checks."
          : "No active assets are saved and no explicit no-active-assets confirmation exists.",
    detail: active_assets_ready
      ? "Active assets exist and the Assets module readiness flag is passing."
      : no_assets_confirmed_ready
        ? "no_active_assets_confirmed is true and total_asset_cost_annual is 0."
        : has_active_assets
          ? "Active asset setup must satisfy the existing valid readiness path."
          : "Missing asset data is not treated as confirmation that no assets are required.",
    recommended_action: passed
      ? "No action required for Assets readiness."
      : has_active_assets
        ? "Review the active asset setup and resolve the existing Assets warnings."
        : "Add an active asset or explicitly confirm that no active assets are required.",
    status: passed ? "pass" : "fail",
    is_blocking: !passed,
    is_warning: false,
    has_active_assets,
    no_active_assets_confirmed,
  };
}

function getBusinessCostVarianceCheck({
  total_business_costs,
  module_total_business_costs,
}) {
  const variance_amount = module_total_business_costs - total_business_costs;
  const variance_percent =
    total_business_costs > 0
      ? (Math.abs(variance_amount) / total_business_costs) * 100
      : 0;

  const is_blocking = variance_percent > 5;
  const is_warning = variance_percent > 1 && variance_percent <= 5;

  return {
    id: "business_cost_variance",
    module: "Module Reconciliation",
    label: "Business cost variance",
    message: is_blocking
      ? "The reconciled module cost is more than 5% different from the P&L business cost."
      : is_warning
      ? "The reconciled module cost is between 1% and 5% different from the P&L business cost."
      : "The reconciled module cost is aligned with the P&L business cost.",
    status: is_blocking ? "fail" : is_warning ? "warn" : "pass",
    is_blocking,
    is_warning,
    variance_amount,
    variance_percent,
  };
}

export function buildModuleReconciliationChecks({
  pnl_status = {},
  pnl_output_contract = {},
  labour_status = {},
  labour_outputs = {},
  asset_status = {},
  asset_output_contract = {},
  general_overheads_status = {},
  general_overheads_output_contract = {},
}) {
  const total_business_costs = toNumber(pnl_output_contract.total_business_costs);
  const unassigned_balance = toNumber(pnl_output_contract.unassigned_balance);
  const total_labour_cost_annual = toNumber(labour_outputs.total_labour_cost_annual);
  const total_general_overheads = toNumber(
    general_overheads_output_contract.total_general_overheads,
  );
  const total_asset_cost_annual = toNumber(
    asset_output_contract.total_asset_cost_annual,
  );
  const total_productive_output = toNumber(
    pnl_output_contract.total_productive_output,
  );
  const general_overheads_ready = Boolean(general_overheads_status.is_ready);
  const labour_ready = Boolean(labour_status.labour_ready);
  const active_assets = Array.isArray(asset_output_contract.active_assets)
    ? asset_output_contract.active_assets
    : Array.isArray(asset_output_contract.assets)
      ? asset_output_contract.assets
      : [];
  const no_active_assets_confirmed =
    asset_output_contract.no_active_assets_confirmed === true;
  const assets_ready = Boolean(
    asset_output_contract.assets_ready ?? asset_status.is_ready,
  );

  const module_total_business_costs =
    total_labour_cost_annual +
    total_asset_cost_annual +
    total_general_overheads;

  const profit_and_loss_ready = Boolean(pnl_output_contract.pnl_ready);

  const module_ready_checks = [
    getModuleReadyCheck("Profit & Loss", profit_and_loss_ready),
    getModuleReadyCheck("Labour", labour_status.labour_ready),
    getModuleReadyCheck("General Overheads", general_overheads_status.is_ready),
  ];

  const employee_overheads_check = getEmployeeOverheadsCheck(pnl_output_contract);
  const legacy_running_cost_check = getLegacyAssetRunningCostCheck(asset_output_contract);
  const assets_readiness_check = getAssetsReadinessCheck({
    asset_status,
    asset_output_contract,
  });
  const business_cost_variance_check = getBusinessCostVarianceCheck({
    total_business_costs,
    module_total_business_costs,
  });

  const reconciliation_checks = [
    ...module_ready_checks,
    assets_readiness_check,
    employee_overheads_check,
    legacy_running_cost_check,
    business_cost_variance_check,
  ];

  const blocking_checks = reconciliation_checks
    .filter((check) => check.is_blocking)
    .map((check) => check.message);

  const normalised_reconciliation_inputs = {
    pnl_ready: profit_and_loss_ready,
    total_business_costs,
    unassigned_balance,
    total_labour_cost_annual,
    total_general_overheads,
    total_asset_cost_annual,
    total_productive_output,
    general_overheads_ready,
    labour_ready,
    assets_ready,
    active_asset_count: active_assets.length,
    no_active_assets_confirmed,
    has_employee_overheads: employee_overheads_check.status !== "pass",
    has_legacy_running_costs: legacy_running_cost_check.status !== "pass",
  };

  const warning_checks = reconciliation_checks
    .filter((check) => check.is_warning && !check.is_blocking)
    .map((check) => check.message);

  const blocking_modules = [
    ...new Set(
      reconciliation_checks
        .filter((check) => check.is_blocking)
        .map((check) => check.module),
    ),
  ];

  const warning_modules = [
    ...new Set(
      reconciliation_checks
        .filter((check) => check.is_warning && !check.is_blocking)
        .map((check) => check.module),
    ),
  ];

  return {
    reconciliation_checks,
    blocking_checks,
    warning_checks,
    blocking_modules,
    warning_modules,
    reconciliation_ready: blocking_checks.length === 0,
    module_total_business_costs,
    pnl_business_cost_variance: business_cost_variance_check.variance_amount,
    pnl_business_cost_variance_percent: business_cost_variance_check.variance_percent,
    total_business_costs,
    total_acc_levy_annual: toNumber(labour_outputs.acc_work_levy_annual),
    acc_rate_percent: toNumber(labour_outputs.acc_rate),
    general_overheads_ready: Boolean(general_overheads_status.is_ready),
    normalised_reconciliation_inputs,
  };
}
