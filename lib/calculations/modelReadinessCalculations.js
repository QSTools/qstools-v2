function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toCheckItem(check = {}) {
  return {
    id: check.id ?? check.check_id ?? "",
    module: check.module ?? "Model Readiness",
    label: check.label ?? "",
    message: check.message ?? "",
    status: check.status ?? "unknown",
    severity: check.severity ?? "",
    recommended_action: check.recommended_action ?? "",
  };
}

function buildGroup({ id, label, checks = [] }) {
  const normalisedChecks = asArray(checks).map(toCheckItem);
  const blockers = normalisedChecks.filter((check) => check.status === "fail");
  const warnings = normalisedChecks.filter((check) => check.status === "warn");

  const status =
    blockers.length > 0 ? "blocked" : warnings.length > 0 ? "warning" : "ready";

  return {
    id,
    label,
    status,
    checks: normalisedChecks,
    passed_count: normalisedChecks.filter((check) => check.status === "pass").length,
    warning_count: warnings.length,
    blocking_count: blockers.length,
  };
}

export function calculateModelReadiness(reconciliation_status = {}) {
  const reconciliation_checks = asArray(
    reconciliation_status.reconciliation_checks,
  );

  const blocking_items = reconciliation_checks
    .filter((check) => check.is_blocking)
    .map(toCheckItem);

  const warning_items = reconciliation_checks
    .filter((check) => check.is_warning && !check.is_blocking)
    .map(toCheckItem);

  const passed_items = reconciliation_checks
    .filter((check) => check.status === "pass" || check.passed === true)
    .map(toCheckItem);

  const source_input_checks = reconciliation_checks.filter((check) =>
    ["Profit & Loss"].includes(check.module),
  );

  const module_output_checks = reconciliation_checks.filter((check) =>
    ["Labour", "Assets", "General Overheads"].includes(check.module),
  );

  const reconciliation_group_checks = reconciliation_checks.filter((check) =>
    ["Model Readiness"].includes(check.module),
  );

  const readiness_groups = [
    buildGroup({
      id: "source_inputs",
      label: "Source Inputs",
      checks: source_input_checks,
    }),
    buildGroup({
      id: "module_outputs",
      label: "Module Outputs",
      checks: module_output_checks,
    }),
    buildGroup({
      id: "reconciliation",
      label: "Reconciliation",
      checks: reconciliation_group_checks,
    }),
    {
      id: "traceability",
      label: "Traceability",
      status: "warning",
      checks: [
        {
          id: "calculation_trace_first_chain",
          module: "Calculation Trace",
          label: "First selected output chain",
          message:
            "Calculation Trace pilot shell is implemented and the first selected output chain is source-verified.",
          status: "pass",
          severity: "info",
          recommended_action:
            "Continue source verification for remaining pilot nodes in a future stage.",
        },
      ],
      passed_count: 1,
      warning_count: 0,
      blocking_count: 0,
    },
    {
      id: "modelling_readiness",
      label: "Modelling Readiness",
      status: blocking_items.length > 0 ? "blocked" : "ready",
      checks: [
        {
          id: "business_model_gate",
          module: "Model Readiness",
          label: "Business model gate",
          message:
            blocking_items.length > 0
              ? "Business modelling is blocked until readiness blockers are resolved."
              : "Business modelling can proceed from the current reconciliation state.",
          status: blocking_items.length > 0 ? "fail" : "pass",
          severity: blocking_items.length > 0 ? "blocker" : "info",
          recommended_action:
            blocking_items.length > 0
              ? "Resolve blocking readiness checks before modelling."
              : "Proceed to Business Modelling setup.",
        },
      ],
      passed_count: blocking_items.length > 0 ? 0 : 1,
      warning_count: 0,
      blocking_count: blocking_items.length > 0 ? 1 : 0,
    },
  ];

  const is_ready_for_modelling = blocking_items.length === 0;
  const is_ready_for_ai_export = is_ready_for_modelling;
  const is_ready_for_dashboard = reconciliation_checks.length > 0;

  const overall_status =
    blocking_items.length > 0
      ? "blocked"
      : warning_items.length > 0
        ? "warning"
        : "ready";

  return {
    ...reconciliation_status,

    overall_status,
    model_ready: is_ready_for_modelling,
    model_readiness_status: overall_status,

    is_ready_for_modelling,
    is_ready_for_ai_export,
    is_ready_for_dashboard,

    blocking_items,
    warning_items,
    passed_items,
    readiness_groups,
    last_checked_at: new Date().toISOString(),
  };
}
