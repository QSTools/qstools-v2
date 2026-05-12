function format_currency(value, decimals = 0) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
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

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum_staff_value(active_staff = [], field = "") {
  return active_staff.reduce((total, staff) => {
    return total + to_number(staff?.[field]);
  }, 0);
}

function get_acc_rate_value(outputs = {}) {
  return Number(outputs.acc_rate_percent ?? outputs.acc_rate ?? 0);
}

function get_acc_levy_value(outputs = {}) {
  return Number(outputs.acc_levy_annual ?? outputs.acc_work_levy_annual ?? 0);
}

function sum_staff_acc_levy(active_staff = []) {
  return active_staff.reduce((total, staff) => {
    return total + get_acc_levy_value(staff);
  }, 0);
}

function get_profile_label(state = {}, active_profile_id = "") {
  if (active_profile_id) return "Profile active";
  if (has_value(state.staff_id)) return "Unsaved profile";
  return "No active profile";
}

function get_margin_health(outputs = {}) {
  const margin_gap = Number(outputs.margin_gap ?? 0);

  if (margin_gap > 0) return "healthy";
  if (margin_gap === 0) return "at_risk";
  return "under";
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

function get_available_hours_before_productivity(outputs = {}) {
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const non_productive_hours = Number(outputs.non_productive_paid_hours ?? 0);
  return Math.max(paid_hours - non_productive_hours, 0);
}

function get_lost_hours_to_productivity(outputs = {}) {
  const available_hours = get_available_hours_before_productivity(outputs);
  const productive_hours = Number(outputs.productive_hours ?? 0);
  return Math.max(available_hours - productive_hours, 0);
}

function get_total_lost_hours_before_recovery(outputs = {}) {
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const productive_hours = Number(outputs.productive_hours ?? 0);
  return Math.max(paid_hours - productive_hours, 0);
}

function get_annual_labour_recovery_surplus(outputs = {}) {
  const profit_per_hour = Number(outputs.profit_per_hour ?? 0);
  const productive_hours = Number(outputs.productive_hours ?? 0);
  return profit_per_hour * productive_hours;
}

function get_labour_decision_status(outputs = {}) {
  const productive_hours = Number(outputs.productive_hours ?? 0);
  const margin_gap = Number(outputs.margin_gap ?? 0);
  const productive_labour_cost_rate = Number(
    outputs.productive_labour_cost_rate ?? 0
  );
  const minimum_charge_out_rate = Number(outputs.minimum_charge_out_rate ?? 0);

  if (productive_hours <= 0) {
    return {
      status_key: "incomplete",
      status_label: "Incomplete",
      message:
        "Productive hours are missing, so the labour recovery position is not ready yet.",
    };
  }

  if (productive_labour_cost_rate <= 0 || minimum_charge_out_rate <= 0) {
    return {
      status_key: "incomplete",
      status_label: "Incomplete",
      message:
        "Labour cost or charge-out assumptions are missing, so the recovery position is not ready yet.",
    };
  }

  if (margin_gap < 0) {
    return {
      status_key: "under_recovered",
      status_label: "Under recovery",
      message: "Charge-out is below the minimum required recovery rate.",
    };
  }

  if (margin_gap === 0) {
    return {
      status_key: "warning",
      status_label: "On the line",
      message:
        "Charge-out is exactly on the minimum recovery line, with no recovery buffer.",
    };
  }

  return {
    status_key: "healthy",
    status_label: "Recoverable",
    message: "This staff member is recoverable at the current assumptions.",
  };
}

function get_rate_build(outputs = {}) {
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const available_hours = get_available_hours_before_productivity(outputs);
  const productive_hours = Number(outputs.productive_hours ?? 0);

  const gross_wages_annual = Number(outputs.gross_wages_annual ?? 0);
  const employer_kiwisaver_gross = Number(
    outputs.employer_kiwisaver_gross ?? 0
  );
  const esct_amount = Number(outputs.esct_amount ?? 0);
  const acc_work_levy_annual = get_acc_levy_value(outputs);

  const paid_rate = paid_hours > 0 ? gross_wages_annual / paid_hours : 0;

  const available_rate =
    available_hours > 0 ? gross_wages_annual / available_hours : 0;

  const entitlement_uplift = Math.max(available_rate - paid_rate, 0);

  const productive_wage_rate =
    productive_hours > 0 ? gross_wages_annual / productive_hours : 0;

  const productivity_uplift = Math.max(
    productive_wage_rate - available_rate,
    0
  );

  const kiwisaver_per_productive_hr =
    productive_hours > 0 ? employer_kiwisaver_gross / productive_hours : 0;

  const esct_per_productive_hr =
    productive_hours > 0 ? esct_amount / productive_hours : 0;

  const acc_per_productive_hr =
    productive_hours > 0 ? acc_work_levy_annual / productive_hours : 0;

  const employer_uplift =
    kiwisaver_per_productive_hr +
    esct_per_productive_hr +
    acc_per_productive_hr;

  return {
    paid_rate,
    available_rate,
    entitlement_uplift,
    productive_wage_rate,
    productivity_uplift,
    kiwisaver_per_productive_hr,
    esct_per_productive_hr,
    acc_per_productive_hr,
    employer_uplift,
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

  const margin_health = get_margin_health(outputs);

  return {
    is_ready: warnings.length === 0 && reconciliation.labour_status === "green",
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

export function buildLabourSummary({ state = {}, outputs = {} }) {
  const rate_build = get_rate_build(outputs);
  const decision_status = get_labour_decision_status(outputs);
  const annual_labour_recovery_surplus =
    get_annual_labour_recovery_surplus(outputs);

  return {
    meta: {
      staff_name: state.staff_name || "Unnamed staff",
      staff_role: state.staff_role || "No role",
      labour_class: state.labour_class || "No class",
    },

    decision_status,

    decision_rows: [
      {
        label: "Hours you pay for",
        value: format_number(outputs.paid_hours_per_year, 0),
        helper: "Total annual paid hours before leave and productivity.",
      },
      {
        label: "Hours that can recover cost",
        value: format_number(outputs.productive_hours, 0),
        helper:
          "Final productive hours after paid non-productive time and productivity.",
        is_total: true,
      },
      {
        label: "Paid hours lost before recovery",
        value: format_number(get_total_lost_hours_before_recovery(outputs), 0),
        helper: "Paid hours that do not become recoverable productive hours.",
      },
      {
        label: "Real cost per productive hour",
        value: format_currency(outputs.productive_labour_cost_rate, 2),
        helper: "True Labour cost spread over productive hours only.",
        is_total: true,
      },
      {
        label: "Minimum required charge-out",
        value: format_currency(outputs.minimum_charge_out_rate, 2),
        helper: "Minimum charge-out needed to hit the current margin target.",
        is_total: true,
      },
    ],

    charge_out_result_rows: [
      {
        label: "Current charge-out",
        value: format_currency(state.charge_out_rate, 2),
        helper: "The rate currently entered for this Labour profile.",
      },
      {
        label: "Profit per productive hour",
        value: format_currency(outputs.profit_per_hour, 2),
        helper:
          "Labour-only surplus after true productive labour cost is recovered.",
        is_total: true,
      },
      {
        label: "Annual labour recovery surplus",
        value: format_currency(annual_labour_recovery_surplus, 0),
        helper:
          "Profit per productive hour multiplied by productive hours. Labour-only, before wider business overhead and asset recovery.",
        is_total: true,
      },
    ],

    sections: [
      {
        key: "time",
        title: "Paid to productive hours",
        summary:
          "You pay for the full year, but only productive hours can recover cost.",
        rows: [
          {
            label: "Paid Labour Hrs",
            value: format_number(outputs.paid_hours_per_year, 0),
          },
          {
            label: "Non-Productive Paid Hours",
            value: format_number(outputs.non_productive_paid_hours, 0),
          },
          {
            label: "Available Hrs Before Productivity",
            value: format_number(
              get_available_hours_before_productivity(outputs),
              0
            ),
          },
          {
            label: "Lost Hrs to Productivity",
            value: format_number(get_lost_hours_to_productivity(outputs), 0),
          },
          {
            label: "Productive Hrs",
            value: format_number(outputs.productive_hours, 0),
            is_total: true,
          },
        ],
      },

      {
        key: "rate_build",
        title: "Rate build evidence",
        summary:
          "Shows how wage cost is lifted as paid hours reduce into productive hours.",
        rows: [
          {
            label: "1. Hourly Wage Rate",
            value: format_currency(rate_build.paid_rate, 2),
          },
          {
            label: "2. Entitlement Hours Removed",
            value: `${format_number(outputs.non_productive_paid_hours, 0)} hrs`,
          },
          {
            label: "3. Available Chargeable Hours",
            value: `${format_number(
              get_available_hours_before_productivity(outputs),
              0
            )} hrs`,
          },
          {
            label: "4. Wage Rate After Entitlements",
            value: format_currency(rate_build.available_rate, 2),
            is_total: true,
          },
          {
            label: "Entitlement Uplift",
            value: `+${format_currency(rate_build.entitlement_uplift, 2)}/hr`,
          },
          {
            label: "5. Productivity Hours Lost",
            value: `${format_number(
              get_lost_hours_to_productivity(outputs),
              0
            )} hrs`,
          },
          {
            label: "6. Final Productive Hours",
            value: `${format_number(outputs.productive_hours, 0)} hrs`,
          },
          {
            label: "7. Wage Rate After Productivity",
            value: format_currency(rate_build.productive_wage_rate, 2),
            is_total: true,
          },
          {
            label: "Productivity Uplift",
            value: `+${format_currency(
              rate_build.productivity_uplift,
              2
            )}/hr`,
          },
          {
            label: "8. KiwiSaver / Productive Hr",
            value: format_currency(rate_build.kiwisaver_per_productive_hr, 2),
          },
          {
            label: "9. ESCT / Productive Hr",
            value: format_currency(rate_build.esct_per_productive_hr, 2),
          },
          {
            label: "10. ACC / Productive Hr",
            value: format_currency(rate_build.acc_per_productive_hr, 2),
          },
          {
            label: "Employer Cost Uplift",
            value: `+${format_currency(rate_build.employer_uplift, 2)}/hr`,
          },
          {
            label: "Minimum Recoverable Labour Cost Rate",
            value: format_currency(outputs.productive_labour_cost_rate, 2),
            is_total: true,
          },
        ],
      },

      {
        key: "cost_build",
        title: "Annual labour cost build",
        summary:
          "Annual employer cost before spreading it across productive hours.",
        rows: [
          {
            label: "Gross Wages",
            value: format_currency(outputs.gross_wages_annual),
          },
          {
            label: "Entitlements Included in Gross Wages",
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
            label: "ACC Work Levy",
            value: format_currency(get_acc_levy_value(outputs)),
          },
          {
            label: "Employer Contribution Total",
            value: format_currency(outputs.total_employer_contribution_cost),
          },
          {
            label: "Total Labour Cost",
            value: format_currency(outputs.total_labour_cost_annual),
            is_total: true,
          },
        ],
      },

      {
        key: "hourly_position",
        title: "Hourly labour position",
        summary:
          "Shows the current hourly cost position after productivity and employer cost.",
        rows: [
          {
            label: "Productivity",
            value: format_percent(state.productivity_percent, 0),
          },
          {
            label: "ACC Rate",
            value: format_percent(get_acc_rate_value(outputs), 2),
          },
          {
            label: "Loaded Labour Cost Rate",
            value: format_currency(outputs.loaded_labour_cost_rate, 2),
          },
          {
            label: "Productive Labour Cost Rate",
            value: format_currency(outputs.productive_labour_cost_rate, 2),
            is_total: true,
          },
        ],
      },

      {
        key: "commercial",
        title: "Recovery and margin position",
        summary:
          "Shows whether the current charge-out clears the required recovery rate.",
        rows: [
          {
            label: "Minimum Charge-Out Rate",
            value: format_currency(outputs.minimum_charge_out_rate, 2),
            is_total: true,
          },
          {
            label: "Actual Margin",
            value: format_percent(outputs.actual_margin_percent, 1),
          },
          {
            label: "Margin Gap",
            value: format_currency(outputs.margin_gap, 2),
          },
          {
            label: "Profit per Hour",
            value: format_currency(outputs.profit_per_hour, 2),
          },
          {
            label: "Annual Labour Recovery Surplus",
            value: format_currency(annual_labour_recovery_surplus, 0),
          },
          {
            label: "Above Recovery",
            value: format_currency(outputs.above_recovery, 2),
            is_total: true,
          },
        ],
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

  const entitlement_ratio = paid_hours > 0 ? non_productive / paid_hours : 0;
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
        "KiwiSaver, ESCT and ACC are now a meaningful part of your true labour cost. These costs need to be recovered through your productive hours.",
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
      const left_time = new Date(
        left.updated_at || left.created_at || 0
      ).getTime();
      const right_time = new Date(
        right.updated_at || right.created_at || 0
      ).getTime();
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
  const total_gross_wages_annual = sum_staff_value(
    active_staff,
    "gross_wages_annual"
  );
  const total_entitlements_annual = sum_staff_value(
    active_staff,
    "entitlements_annual"
  );
  const total_employer_kiwisaver_annual = sum_staff_value(
    active_staff,
    "employer_kiwisaver_gross"
  );
  const total_esct_annual = sum_staff_value(active_staff, "esct_amount");
  const total_acc_levy_annual = sum_staff_acc_levy(active_staff);
  const total_employer_contribution_annual = sum_staff_value(
    active_staff,
    "total_employer_contribution_cost"
  );
  const total_labour_cost_annual = sum_staff_value(
    active_staff,
    "total_labour_cost_annual"
  );
  const total_productive_output = sum_staff_value(
    active_staff,
    "productive_hours"
  );
  const total_available_hours_before_productivity = active_staff.reduce(
    (total, staff) => {
      return total + get_available_hours_before_productivity(staff);
    },
    0
  );
  const weighted_productivity_percent =
    total_available_hours_before_productivity > 0
      ? (total_productive_output / total_available_hours_before_productivity) *
        100
      : 0;
  const labour_ready =
    active_staff.length > 0 &&
    total_labour_cost_annual > 0 &&
    total_productive_output > 0 &&
    total_employer_contribution_annual > 0 &&
    total_acc_levy_annual > 0;
  const productive_labour_cost_rate =
    total_productive_output > 0
      ? total_labour_cost_annual / total_productive_output
      : 0;

  return {
    current_staff: {
      staff_id: state.staff_id || "",
      staff_name: state.staff_name || "",
      staff_role: state.staff_role || "",
      labour_class: state.labour_class || "",
      ...outputs,
    },
    active_staff,
    total_gross_wages_annual,
    total_entitlements_annual,
    total_employer_kiwisaver_annual,
    total_esct_annual,
    total_acc_levy_annual,
    total_employer_contribution_annual,
    total_labour_cost_annual,
    total_productive_output,
    total_available_hours_before_productivity,
    weighted_productivity_percent,
    productive_labour_cost_rate,
    labour_ready,
  };
}