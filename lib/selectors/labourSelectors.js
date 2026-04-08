function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function format_number(value, maximum_fraction_digits = 0) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maximum_fraction_digits,
  }).format(Number(value || 0));
}

function format_percent(value, maximum_fraction_digits = 0) {
  return `${format_number(Number(value || 0), maximum_fraction_digits)}%`;
}

function has_value(value) {
  return value !== null && value !== undefined && value !== "";
}

function has_positive_number(value) {
  return Number(value || 0) > 0;
}

function get_profile_label(state = {}, active_profile_id = "") {
  if (active_profile_id) {
    return "Profile active";
  }

  if (has_value(state.staff_id)) {
    return "Unsaved profile";
  }

  return "No active profile";
}

function get_margin_health(outputs = {}) {
  const margin_gap = Number(outputs.margin_gap ?? 0);

  if (margin_gap > 0) {
    return "healthy";
  }

  if (margin_gap === 0) {
    return "at_risk";
  }

  return "under";
}

export function buildLabourStatus({
  state = {},
  outputs = {},
  profiles = [],
  active_profile_id = "",
  inputs_enabled = false,
}) {
  const warnings = [];

  if (!has_value(state.staff_name)) {
    warnings.push("Staff name is missing.");
  }

  if (!has_value(state.staff_role)) {
    warnings.push("Staff role is missing.");
  }

  if (!has_value(state.labour_class)) {
    warnings.push("Labour class is missing.");
  }

  if (!inputs_enabled) {
    warnings.push("Create a profile before editing Labour inputs.");
  }

  if (!has_positive_number(state.hours_per_week)) {
    warnings.push("Hours per week must be greater than 0.");
  }

  if (!has_positive_number(state.days_per_week)) {
    warnings.push("Days per week must be greater than 0.");
  }

  if (!has_positive_number(state.labour_rate)) {
    warnings.push("Labour rate must be greater than 0.");
  }

  if (!has_positive_number(state.charge_out_rate)) {
    warnings.push("Charge-out rate must be greater than 0.");
  }

  if (!has_positive_number(state.productivity_percent)) {
    warnings.push("Productivity percent must be greater than 0.");
  }

  if (Number(outputs.productive_hours ?? 0) <= 0) {
    warnings.push("Productive hours are zero or below.");
  }

  if (Number(outputs.margin_gap ?? 0) < 0) {
    warnings.push("Charge-out is below minimum recovery.");
  }

  const margin_health = get_margin_health(outputs);

  return {
    is_ready: warnings.length === 0,
    warning_count: warnings.length,
    warnings,
    profile_state_label: get_profile_label(state, active_profile_id),
    staff_name_label: state.staff_name || "Unnamed staff",
    staff_role_label: state.staff_role || "No role",
    labour_class_label: state.labour_class || "No class",
    margin_health_label:
      margin_health === "healthy"
        ? "Healthy"
        : margin_health === "at_risk"
        ? "At risk"
        : "Under recovery",
    saved_profiles_label: `${profiles.length} saved`,
    active_profile_label: active_profile_id ? "1 active" : "0 active",
    productive_hours_label: `${format_number(outputs.productive_hours, 0)} hrs`,
    minimum_charge_out_label: format_currency(outputs.minimum_charge_out_rate),
  };
}

export function buildLabourSummary({
  state = {},
  outputs = {},
}) {
  return {
    meta: {
      staff_name: state.staff_name || "Unnamed staff",
      staff_role: state.staff_role || "No role",
      labour_class: state.labour_class || "No class",
    },
    rows: [
      {
        label: "Paid Hours per Year",
        value: `${format_number(outputs.paid_hours_per_year, 0)} hrs`,
      },
      {
        label: "Non-Productive Paid Hours",
        value: `${format_number(outputs.non_productive_paid_hours, 0)} hrs`,
      },
      {
        label: "Productive Hours",
        value: `${format_number(outputs.productive_hours, 0)} hrs`,
        emphasis: true,
      },
      {
        label: "Loaded Labour Cost Rate",
        value: format_currency(outputs.loaded_labour_cost_rate),
      },
      {
        label: "Productive Labour Cost Rate",
        value: format_currency(outputs.productive_labour_cost_rate),
        emphasis: true,
      },
      {
        label: "Minimum Charge-Out Rate",
        value: format_currency(outputs.minimum_charge_out_rate),
        emphasis: true,
      },
      {
        label: "Actual Margin",
        value: format_percent(outputs.actual_margin_percent, 1),
      },
      {
        label: "Margin Gap",
        value: format_currency(outputs.margin_gap),
      },
      {
        label: "Profit per Hour",
        value: format_currency(outputs.profit_per_hour),
      },
      {
        label: "Above Recovery",
        value: format_currency(outputs.above_recovery),
      },
      {
        label: "Gross Wages Annual",
        value: format_currency(outputs.gross_wages_annual),
      },
      {
        label: "Entitlements Annual",
        value: format_currency(outputs.entitlements_annual),
      },
      {
        label: "Employer KiwiSaver",
        value: format_currency(outputs.employer_kiwisaver_gross),
      },
      {
        label: "ESCT",
        value: format_currency(outputs.esct_amount),
      },
      {
        label: "Employer Contribution Total",
        value: format_currency(outputs.total_employer_contribution_cost),
      },
    ],
  };
}

export function buildLabourDrivers({
  state = {},
  outputs = {},
  has_profile = false,
}) {
  function format_metric_currency(value) {
    return `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function format_metric_percent(value) {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  if (!has_profile) {
    return {
      driver_key: "no_profile",
      driver_title: "No live driver yet",
      driver_body:
        "Create or load a labour profile to see what is driving your live labour cost.",
      driver_insight: "",
      tone: "neutral",
      metric_label: "Status",
      metric_value: "Waiting for profile",
    };
  }

  const productivity = Number(state.productivity_percent ?? 0);
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const non_productive = Number(outputs.non_productive_paid_hours ?? 0);
  const employer_cost = Number(outputs.total_employer_contribution_cost ?? 0);
  const total_labour_cost = Number(outputs.total_labour_cost_annual ?? 0);
  const margin_gap = Number(outputs.margin_gap ?? 0);
  const above_recovery = Number(outputs.above_recovery ?? 0);

  const entitlement_ratio =
    paid_hours > 0 ? non_productive / paid_hours : 0;

  const employer_cost_ratio =
    total_labour_cost > 0 ? employer_cost / total_labour_cost : 0;

  if (productivity > 0 && productivity < 80) {
    return {
      driver_key: "low_productivity",
      driver_title: "Productivity is driving cost",
      driver_body:
        "Your productive hours are being compressed, which pushes up the cost of every hour you sell. Small improvements here can have a strong upside.",
      driver_insight:
        "Improving productivity usually reduces cost per productive hour faster than small pay adjustments.",
      tone: "bad",
      metric_label: "Productivity",
      metric_value: format_metric_percent(productivity),
    };
  }

  if (entitlement_ratio >= 0.18) {
    return {
      driver_key: "entitlement_pressure",
      driver_title: "Entitlements are adding pressure",
      driver_body:
        "A larger share of paid hours is being lost to leave and non-productive time. That increases cost per productive hour and lifts the charge-out you need.",
      driver_insight:
        "This does not mean entitlements are wrong, but it does mean recovery pressure rises sharply if productivity is not strong.",
      tone: "warn",
      metric_label: "Non-productive hours",
      metric_value: format_metric_percent(entitlement_ratio * 100),
    };
  }

  if (employer_cost_ratio >= 0.05) {
    return {
      driver_key: "employer_cost_share",
      driver_title: "Employer costs are materially lifting labour cost",
      driver_body:
        "KiwiSaver and ESCT are now a meaningful part of your true labour cost. These costs need to be recovered through your productive hours.",
      driver_insight:
        "These are real employer costs and should stay visible rather than being silently absorbed.",
      tone: "warn",
      metric_label: "Employer cost share",
      metric_value: format_metric_percent(employer_cost_ratio * 100),
    };
  }

  if (margin_gap < 0) {
    return {
      driver_key: "margin_shortfall",
      driver_title: "Your charge-out is below target",
      driver_body:
        "Your current charge-out rate is not covering the margin target set in the model. That leaves your commercial position exposed.",
      driver_insight:
        "Raise charge-out, improve productivity, or reduce underlying labour cost pressure.",
      tone: "bad",
      metric_label: "Margin gap",
      metric_value: format_metric_currency(margin_gap),
    };
  }

  return {
    driver_key: "healthy_state",
    driver_title: "Your labour position looks healthy",
    driver_body:
      "No single pressure point is dominating the live labour model right now. Your cost structure and recovery position appear reasonably balanced.",
    driver_insight:
      "Keep watching productivity and charge-out discipline, because they remain the fastest moving commercial drivers.",
    tone: "good",
    metric_label: "Above recovery",
    metric_value: format_metric_currency(above_recovery),
  };
}

export function buildLabourProfileRows({
  profiles = [],
  active_profile_id = "",
}) {
  return [...profiles]
    .sort((left, right) => {
      const left_time = new Date(left.updated_at || left.created_at || 0).getTime();
      const right_time = new Date(right.updated_at || right.created_at || 0).getTime();
      return right_time - left_time;
    })
    .map((profile) => {
      const data = profile?.data ?? {};

      return {
        profile_id: profile?.profile_id ?? "",
        staff_id: data.staff_id ?? "",
        staff_name: data.staff_name || "Unnamed staff",
        staff_role: data.staff_role || "No role",
        labour_class: data.labour_class || "No class",
        is_current: profile?.profile_id === active_profile_id,
        updated_at_label: profile?.updated_at || profile?.created_at || "",
      };
    });
}

export function buildLabourOutputContract({
  active_staff = [],
  outputs = {},
  state = {},
}) {
  return {
    current_staff: {
      staff_id: state.staff_id || "",
      staff_name: state.staff_name || "",
      staff_role: state.staff_role || "",
      labour_class: state.labour_class || "",
      ...outputs,
    },
    active_staff,
  };
}