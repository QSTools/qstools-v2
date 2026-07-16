function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function resolveTrustState({ model_readiness = {}, business_modelling = {} }) {
  const readinessStatus =
    model_readiness.overall_status ||
    model_readiness.model_readiness_status ||
    "blocked";

  const modellingStatus =
    business_modelling?.readiness_status?.selected_scenario_status ||
    business_modelling?.readiness_status?.model_readiness_gate_status ||
    "blocked";

  if (readinessStatus === "blocked" || modellingStatus === "blocked") {
    return "blocked";
  }

  const hasWarnings =
    safeArray(model_readiness.warning_items).length > 0 ||
    safeArray(business_modelling.warnings).length > 0 ||
    readinessStatus === "warning" ||
    modellingStatus === "ready_with_warnings";

  return hasWarnings ? "warning" : "trusted";
}

export function buildAiBusinessStateExport({
  model_readiness = {},
  business_modelling = {},
  business_summary = {},
}) {
  const trust_state = resolveTrustState({
    model_readiness,
    business_modelling,
  });

  const blockers = [
    ...safeArray(model_readiness.blocking_items),
    ...safeArray(business_modelling.blockers),
  ];

  const warnings = [
    ...safeArray(model_readiness.warning_items),
    ...safeArray(business_modelling.warnings),
  ];

  const downstream_permissions = {
    can_use_for_ai:
      trust_state !== "blocked" &&
      business_modelling.is_ready_for_ai_export === true,
    can_use_for_dashboard:
      trust_state !== "blocked" &&
      business_modelling.is_ready_for_dashboard === true,
    can_use_for_quote_checker:
      trust_state !== "blocked" &&
      business_modelling.is_ready_for_quote_checker === true,
    can_use_for_reporting: trust_state !== "blocked",
  };

  return {
    export_version: "mirra_v5_ai_business_state_export_1",
    generated_at: new Date().toISOString(),
    trust_state,

    readiness: {
      overall_status: model_readiness.overall_status,
      model_readiness_status: model_readiness.model_readiness_status,
      is_ready_for_modelling: model_readiness.is_ready_for_modelling === true,
      is_ready_for_ai_export: model_readiness.is_ready_for_ai_export === true,
      is_ready_for_dashboard: model_readiness.is_ready_for_dashboard === true,
      readiness_groups: safeArray(model_readiness.readiness_groups),
    },

    source_modules: {
      model_readiness_available: Object.keys(model_readiness).length > 0,
      business_modelling_available: Object.keys(business_modelling).length > 0,
      business_summary_available: Object.keys(business_summary).length > 0,
    },

    business_summary,

    business_modelling,

    selected_model: business_modelling.target_model || business_modelling.actual_model,

    blockers,
    warnings,

    traceability: {
      calculation_trace_selected_chain:
        "business_summary.required_recovery_per_driver",
      first_selected_chain_source_verified: true,
      full_trace_source_verification_complete: false,
    },

    downstream_permissions,
  };
}
