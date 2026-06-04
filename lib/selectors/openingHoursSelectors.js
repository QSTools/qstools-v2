function format_number(value, decimals = 2) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(decimals) : "0.00";
}

function format_hours(value) {
  return `${format_number(value)} hrs`;
}

export function build_opening_hours_status(opening_hours) {
  return {
    opening_hours_status: opening_hours.opening_hours_status,
    opening_hours_ready: opening_hours.opening_hours_ready,
    opening_hours_model_trust_state:
      opening_hours.opening_hours_model_trust_state,
    warning_count: opening_hours.opening_hours_warning_count,
    standard_weekly_open_hours:
      opening_hours.standard_weekly_open_hours,
    annual_open_weeks: opening_hours.annual_open_weeks,
    net_annual_business_open_hours:
      opening_hours.net_annual_business_open_hours,
    warnings: opening_hours.opening_hours_warnings || [],
  };
}

export function build_opening_hours_card(opening_hours) {
  return {
    opening_hours_profile_name:
      opening_hours.opening_hours_profile_name || "Opening Hours",
    effective_from: opening_hours.effective_from || "",
    standard_week_days: opening_hours.standard_week_days || [],
    additional_closed_days: opening_hours.additional_closed_days || [],

    seasonal_shutdown_weeks: opening_hours.seasonal_shutdown_weeks,
    public_holiday_days: opening_hours.public_holiday_days,
    calendar_notes: opening_hours.calendar_notes || "",

    summary_rows: [
      {
        label: "Open days per week",
        value: opening_hours.open_day_count,
      },
      {
        label: "Standard daily open hours",
        value: format_hours(opening_hours.standard_daily_open_hours),
      },
      {
        label: "Standard weekly open hours",
        value: format_hours(opening_hours.standard_weekly_open_hours),
      },
      {
        label: "Annual open weeks",
        value: format_number(opening_hours.annual_open_weeks),
      },
      {
        label: "Annual business open hours",
        value: format_hours(opening_hours.annual_business_open_hours),
      },
      {
        label: "Public holiday closed hours",
        value: format_hours(opening_hours.public_holiday_closed_hours),
      },
      {
        label: "Additional closed hours",
        value: format_hours(opening_hours.additional_closed_hours),
      },
      {
        label: "Net annual business open hours",
        value: format_hours(opening_hours.net_annual_business_open_hours),
      },
    ],

    downstream_rows: [
      {
        label: "Labour",
        value:
          "May use opening hours as setup context only. Labour still owns productive hours.",
      },
      {
        label: "Assets",
        value:
          "May use opening hours as utilisation context only. Assets still own actual utilisation hours.",
      },
      {
        label: "Rate Builder",
        value:
          "Future use for capacity pressure and working-time context.",
      },
      {
        label: "Quote Checker",
        value:
          "Future use for weekend, after-hours, shutdown, and delivery-window checks.",
      },
    ],

    warnings: opening_hours.opening_hours_warnings || [],
  };
}