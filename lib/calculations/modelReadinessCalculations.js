export function calculateModelReadiness(reconciliation_status = {}) {
  const blocking_checks = Array.isArray(reconciliation_status.blocking_checks)
    ? reconciliation_status.blocking_checks
    : [];
  const warning_checks = Array.isArray(reconciliation_status.warning_checks)
    ? reconciliation_status.warning_checks
    : [];

  const model_ready = blocking_checks.length === 0;
  const model_readiness_status = model_ready
    ? warning_checks.length > 0
      ? "warning"
      : "ready"
    : "blocked";

  return {
    ...reconciliation_status,
    model_ready,
    model_readiness_status,
  };
}
