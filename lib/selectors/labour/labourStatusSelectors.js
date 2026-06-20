import {
  format_currency,
  format_number,
  format_percent,
  has_positive_number,
  has_value,
} from "@/lib/selectors/labour/labourFormatters";

function get_profile_label(state = {}, active_profile_id = "") {
  if (active_profile_id) return "Profile active";
  if (has_value(state.staff_id)) return "Unsaved profile";
  return "No active profile";
}

function get_labour_reconciliation(pnl_benchmark_total = 0, module_total = 0) {
  const benchmark = Number(pnl_benchmark_total || 0);
  const module_value = Number(module_total || 0);

  const labour_variance_amount = module_value - benchmark;
  const labour_variance_percent =
    benchmark > 0 ? (Math.abs(labour_variance_amount) / benchmark) * 100 : 0;

  let labour_status = "green";
  let labour_ready = true;

  if (labour_variance_percent <= 1) {
    labour_status = "green";
    labour_ready = true;
  } else if (labour_variance_percent <= 5) {
    labour_status = "amber";
    labour_ready = false;
  } else {
    labour_status = "red";
    labour_ready = false;
  }

  return {
    pnl_benchmark_total: benchmark,
    module_total: module_value,
    labour_variance_amount,
    labour_variance_percent,
    labour_status,
    labour_ready,
  };
}

export function buildLabourStatus({
  state = {},
  outputs = {},
  profiles = [],
  active_profile_id = "",
  inputs_enabled = false,
  pnl_benchmark_total = 0,
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

  const reconciliation = get_labour_reconciliation(
    pnl_benchmark_total,
    outputs.total_labour_cost_annual
  );

  if (reconciliation.labour_status === "amber") {
    warnings.push(
      "Labour is within amber reconciliation range and needs explanation."
    );
  }

  if (reconciliation.labour_status === "red") {
    warnings.push("Labour reconciliation is outside the allowed threshold.");
  }

  return {
    is_ready: warnings.length === 0 && reconciliation.labour_status === "green",
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

    reconciliation_label:
      reconciliation.labour_status === "green"
        ? "Ready"
        : reconciliation.labour_status === "amber"
          ? "Review required"
          : "Blocked",

    pnl_benchmark_total: reconciliation.pnl_benchmark_total,
    module_total: reconciliation.module_total,
    labour_variance_amount: reconciliation.labour_variance_amount,
    labour_variance_percent: reconciliation.labour_variance_percent,
    labour_status: reconciliation.labour_status,
    labour_ready: reconciliation.labour_ready,

    pnl_benchmark_total_label: format_currency(
      reconciliation.pnl_benchmark_total
    ),
    module_total_label: format_currency(reconciliation.module_total),
    labour_variance_amount_label: format_currency(
      reconciliation.labour_variance_amount
    ),
    labour_variance_percent_label: format_percent(
      reconciliation.labour_variance_percent,
      1
    ),
  };
}