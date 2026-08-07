import {
  format_number,
  has_positive_number,
  has_value,
} from "@/lib/selectors/labour/labourFormatters";

function get_profile_label(state = {}, active_profile_id = "") {
  if (active_profile_id) return "Profile active";
  if (has_value(state.staff_id)) return "Unsaved profile";
  return "No active profile";
}

// P&L variance/reconciliation is NOT calculated here. Labour has no
// direct access to P&L data (useLabour is a standalone hook), so this
// file previously computed its own variance against a hardcoded
// pnl_benchmark_total of 0 - which meant it always read as balanced
// regardless of the real numbers. That was a live bug, not a design
// choice. The real, correct labour-vs-P&L comparison (including S21's
// timing-aware wages/on-costs split) lives in
// lib/reconciliation/reconciliationRules.js via useModuleReconciliation,
// which the Labour page now calls separately and passes down as its
// own prop. buildLabourStatus below covers Labour's own completeness
// only - whether the module itself is filled in and calculable, not
// whether it matches the P&L.

export function buildLabourStatus({
  state = {},
  outputs = {},
  profiles = [],
  active_profile_id = "",
  inputs_enabled = false,
}) {
  const warnings = [];

  if (!has_value(state.staff_name)) warnings.push("Staff name is missing.");
  if (!has_value(state.staff_role)) warnings.push("Staff role is missing.");
  if (!has_value(state.labour_class)) warnings.push("Labour class is missing.");

  if (!inputs_enabled) {
    warnings.push("Create a profile before editing Labour inputs.");
  }

  if (!has_positive_number(state.hours_per_week)) {
    warnings.push("Hours per week must be greater than 0.");
  }

  if (!has_positive_number(state.labour_rate)) {
    warnings.push("Labour rate must be greater than 0.");
  }

  if (!has_positive_number(state.productivity_percent)) {
    warnings.push("Productivity percent must be greater than 0.");
  }

  if (Number(outputs.productive_hours ?? 0) <= 0) {
    warnings.push("Productive hours are zero or below.");
  }

  if (Number(outputs.total_labour_cost_annual ?? 0) <= 0) {
    warnings.push("Annual labour cost is zero or below.");
  }

  const is_ready = warnings.length === 0;

  return {
    is_ready,
    warning_count: warnings.length,
    warnings,

    profile_state_label: get_profile_label(state, active_profile_id),
    staff_name_label: state.staff_name || "Unnamed staff",
    staff_role_label: state.staff_role || "No role",
    labour_class_label: state.labour_class || "No class",

    margin_health_label: "Moved to Rate Builder",

    saved_profiles_label: `${profiles.length} saved`,
    active_profile_label: active_profile_id ? "1 active" : "0 active",
    productive_hours_label: `${format_number(outputs.productive_hours, 0)} hrs`,
    minimum_charge_out_label: "Moved to Rate Builder",

    reconciliation_label: is_ready ? "Ready" : "Review required",
  };
}
