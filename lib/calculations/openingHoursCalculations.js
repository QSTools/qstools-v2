function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_number(value, decimals = 2) {
  const parsed = to_number(value);
  return Number(parsed.toFixed(decimals));
}

function parse_time_to_minutes(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [hours_raw, minutes_raw] = value.split(":");
  const hours = Number(hours_raw);
  const minutes = Number(minutes_raw);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function calculate_daily_open_hours(day) {
  if (!day?.is_open) {
    return {
      daily_open_hours: 0,
      invalid_time_range: false,
    };
  }

  const open_minutes = parse_time_to_minutes(day.open_time);
  const close_minutes = parse_time_to_minutes(day.close_time);
  const break_minutes = Math.max(to_number(day.break_minutes), 0);

  if (
    open_minutes === null ||
    close_minutes === null ||
    close_minutes <= open_minutes
  ) {
    return {
      daily_open_hours: 0,
      invalid_time_range: true,
    };
  }

  const gross_minutes = close_minutes - open_minutes;
  const net_minutes = Math.max(gross_minutes - break_minutes, 0);

  return {
    daily_open_hours: round_number(net_minutes / 60),
    invalid_time_range: false,
  };
}

function build_warning({
  warning_id,
  severity = "warning",
  message,
  affected_variable,
  blocking = false,
  review_action,
}) {
  return {
    warning_id,
    source_module: "opening_hours",
    severity,
    message,
    affected_variable,
    blocking,
    review_action,
  };
}

export function calculate_opening_hours(input_state = {}) {
  const standard_week_days = Array.isArray(input_state.standard_week_days)
    ? input_state.standard_week_days
    : [];

  const warnings = [];

  const calculated_week_days = standard_week_days.map((day) => {
    const day_result = calculate_daily_open_hours(day);

    if (day_result.invalid_time_range) {
      warnings.push(
        build_warning({
          warning_id: "opening_hours_invalid_time_range",
          severity: "critical",
          message: `${day.day_name} has an invalid opening or closing time.`,
          affected_variable: "standard_week_days",
          blocking: true,
          review_action:
            "Review the opening and closing times for this day.",
        })
      );
    }

    return {
      ...day,
      daily_open_hours: day_result.daily_open_hours,
      invalid_time_range: day_result.invalid_time_range,
    };
  });

  const open_day_count = calculated_week_days.filter((day) => day.is_open).length;
  const closed_day_count = calculated_week_days.length - open_day_count;

  const standard_weekly_open_hours = round_number(
    calculated_week_days.reduce(
      (total, day) => total + to_number(day.daily_open_hours),
      0
    )
  );

  const open_days = calculated_week_days.filter((day) => day.is_open);
  const standard_daily_open_hours =
    open_days.length > 0
      ? round_number(standard_weekly_open_hours / open_days.length)
      : 0;

  const seasonal_shutdown_weeks = Math.max(
    to_number(input_state.seasonal_shutdown_weeks),
    0
  );

  let annual_open_weeks = round_number(52 - seasonal_shutdown_weeks);

  if (seasonal_shutdown_weeks >= 52) {
    annual_open_weeks = 0;

    warnings.push(
      build_warning({
        warning_id: "opening_hours_shutdown_exceeds_year",
        severity: "critical",
        message:
          "Seasonal shutdown weeks equal or exceed the full year.",
        affected_variable: "seasonal_shutdown_weeks",
        blocking: true,
        review_action:
          "Reduce shutdown weeks so the business has operating weeks available.",
      })
    );
  }

  const annual_business_open_hours = round_number(
    standard_weekly_open_hours * annual_open_weeks
  );

  const public_holiday_days = Math.max(
    to_number(input_state.public_holiday_days),
    0
  );

  const public_holiday_closed_hours = round_number(
    public_holiday_days * standard_daily_open_hours
  );

  const additional_closed_days = Array.isArray(
    input_state.additional_closed_days
  )
    ? input_state.additional_closed_days
    : [];

  const additional_closed_hours = round_number(
    additional_closed_days.reduce((total, closed_day) => {
      return total + Math.max(to_number(closed_day.closed_hours), 0);
    }, 0)
  );

  let net_annual_business_open_hours = round_number(
    annual_business_open_hours -
      public_holiday_closed_hours -
      additional_closed_hours
  );

  if (net_annual_business_open_hours < 0) {
    net_annual_business_open_hours = 0;

    warnings.push(
      build_warning({
        warning_id: "opening_hours_negative_net_hours",
        severity: "critical",
        message:
          "Closed days and holidays exceed the available annual open hours.",
        affected_variable: "net_annual_business_open_hours",
        blocking: true,
        review_action:
          "Review shutdown weeks, public holidays, and additional closed days.",
      })
    );
  }

  if (standard_week_days.length === 0) {
    warnings.push(
      build_warning({
        warning_id: "opening_hours_missing",
        severity: "critical",
        message: "No opening hours setup exists.",
        affected_variable: "standard_week_days",
        blocking: true,
        review_action: "Create a standard weekly opening pattern.",
      })
    );
  }

  if (open_day_count === 0) {
    warnings.push(
      build_warning({
        warning_id: "opening_hours_no_open_days",
        severity: "critical",
        message: "No open business days are selected.",
        affected_variable: "standard_week_days",
        blocking: true,
        review_action: "Select at least one normal operating day.",
      })
    );
  }

  if (standard_weekly_open_hours === 0) {
    warnings.push(
      build_warning({
        warning_id: "opening_hours_zero_weekly_hours",
        severity: "critical",
        message: "Standard weekly open hours are zero.",
        affected_variable: "standard_weekly_open_hours",
        blocking: true,
        review_action:
          "Add valid opening times for at least one operating day.",
      })
    );
  }

  const default_used =
    standard_weekly_open_hours === 45 &&
    seasonal_shutdown_weeks === 4 &&
    public_holiday_days === 0 &&
    additional_closed_days.length === 0;

  if (default_used) {
    warnings.push(
      build_warning({
        warning_id: "opening_hours_default_used",
        severity: "info",
        message:
          "Default operating hours are being used. Review and adjust if these do not match the business.",
        affected_variable: "standard_week_days",
        blocking: false,
        review_action:
          "Confirm the operating week, shutdown weeks, and closed days.",
      })
    );
  }

  const has_blocking_warning = warnings.some((warning) => warning.blocking);

  let opening_hours_status = "ready";

  if (has_blocking_warning) {
    opening_hours_status = "blocked";
  } else if (warnings.length > 0) {
    opening_hours_status = "ready_with_warnings";
  }

  const opening_hours_model_trust_state = has_blocking_warning
    ? "blocked"
    : warnings.length > 0
      ? "warning"
      : "ready";

  const default_hours_per_week = standard_weekly_open_hours;
  const default_days_per_week = open_day_count;

  return {
    ...input_state,

    standard_week_days: calculated_week_days,
    open_day_count,
    closed_day_count,

    standard_daily_open_hours,
    standard_weekly_open_hours,

    seasonal_shutdown_weeks,
    annual_open_weeks,
    annual_business_open_hours,

    public_holiday_days,
    public_holiday_closed_hours,

    additional_closed_days,
    additional_closed_hours,

    net_annual_business_open_hours,

    default_hours_per_week,
    default_days_per_week,

    opening_hours_ready: !has_blocking_warning,
    opening_hours_status,
    opening_hours_warnings: warnings,
    opening_hours_warning_count: warnings.length,
    opening_hours_model_trust_state,
  };
}