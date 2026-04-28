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
  const pnl_lines = Array.isArray(pnl_output_contract.pnl_lines)
    ? pnl_output_contract.pnl_lines
    : [];

  const has_employee_overheads = pnl_lines.some(
    (line) => line.category === "employee_overheads" && toNumber(line.amount) !== 0,
  );

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
  const assets_ready = Boolean(asset_status.is_ready);

  const module_total_business_costs =
    total_labour_cost_annual +
    total_asset_cost_annual +
    total_general_overheads;

  const module_ready_checks = [
    getModuleReadyCheck("Profit & Loss", pnl_status.is_ready),
    getModuleReadyCheck("Labour", labour_status.labour_ready),
    getModuleReadyCheck("General Overheads", general_overheads_status.is_ready),
    getModuleReadyCheck("Assets", asset_status.is_ready),
  ];

  const employee_overheads_check = getEmployeeOverheadsCheck(pnl_output_contract);
  const legacy_running_cost_check = getLegacyAssetRunningCostCheck(asset_output_contract);
  const business_cost_variance_check = getBusinessCostVarianceCheck({
    total_business_costs,
    module_total_business_costs,
  });

  const reconciliation_checks = [
    ...module_ready_checks,
    employee_overheads_check,
    legacy_running_cost_check,
    business_cost_variance_check,
  ];

  const blocking_checks = reconciliation_checks
    .filter((check) => check.is_blocking)
    .map((check) => check.message);

  const normalised_reconciliation_inputs = {
    pnl_ready: Boolean(pnl_status.is_ready),
    total_business_costs,
    unassigned_balance,
    total_labour_cost_annual,
    total_general_overheads,
    total_asset_cost_annual,
    total_productive_output,
    general_overheads_ready,
    labour_ready,
    assets_ready,
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
