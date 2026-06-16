const MODEL_CONFIDENCE_WARNING_IDS = new Set([
  "business_summary_not_trusted",
  "business_summary_not_ready",
  "upstream_model_not_ready",
]);

export function is_model_confidence_warning(warning = {}) {
  return MODEL_CONFIDENCE_WARNING_IDS.has(
    warning.warning_id || warning.warning_key
  );
}

export function get_commercial_failure_path(recovery_failure_path = []) {
  const rows = Array.isArray(recovery_failure_path)
    ? recovery_failure_path
    : [];

  return rows.filter((warning) => !is_model_confidence_warning(warning));
}

export function get_model_confidence_warnings(recovery_failure_path = []) {
  const rows = Array.isArray(recovery_failure_path)
    ? recovery_failure_path
    : [];

  return rows.filter((warning) => is_model_confidence_warning(warning));
}

export function has_model_confidence_warning(recovery_failure_path = []) {
  return get_model_confidence_warnings(recovery_failure_path).length > 0;
}

export function get_primary_commercial_warning({
  primary_recovery_warning,
  recovery_failure_path = [],
}) {
  if (
    primary_recovery_warning &&
    !is_model_confidence_warning(primary_recovery_warning)
  ) {
    return primary_recovery_warning;
  }

  const commercial_failures = get_commercial_failure_path(
    recovery_failure_path
  );

  return commercial_failures[0] || null;
}

export function has_commercial_blocking_warning(recovery_failure_path = []) {
  return get_commercial_failure_path(recovery_failure_path).some(
    (warning) => warning.severity === "blocking"
  );
}

export function get_status_label({
  recovery_ready,
  warning_count,
  primary_commercial_warning,
  recovery_failure_path = [],
}) {
  const has_commercial_failure =
    get_commercial_failure_path(recovery_failure_path).length > 0;

  const has_confidence_warning =
    has_model_confidence_warning(recovery_failure_path);

  if (has_commercial_blocking_warning(recovery_failure_path)) {
    return "Not recoverable";
  }

  if (primary_commercial_warning?.severity === "review") {
    return "Marginal";
  }

  if (!has_commercial_failure && has_confidence_warning) {
    return "Provisional";
  }

  if (recovery_ready && warning_count > 0) {
    return "Usable with warnings";
  }

  if (recovery_ready) {
    return "Recoverable";
  }

  return "Needs attention";
}

export function get_status_tone(status_label) {
  if (status_label === "Not recoverable") return "critical";
  if (status_label === "Marginal") return "warning";
  if (status_label === "Provisional") return "warning";
  if (status_label === "Recoverable") return "success";
  if (status_label === "Usable with warnings") return "warning";

  return "neutral";
}

export function get_business_type_label(business_type) {
  return business_type === "product_based"
    ? "Product / unit-based business"
    : "Hours-based business";
}

export function get_recovery_driver_label(
  activity_driver_type,
  activity_driver_label
) {
  if (activity_driver_label) {
    return activity_driver_label;
  }

  return activity_driver_type === "units"
    ? "Units sold"
    : "Selected recovery hours";
}

export function get_annual_recovery_gap({ margin_pool, total_cost_burden }) {
  return Number(margin_pool ?? 0) - Number(total_cost_burden ?? 0);
}