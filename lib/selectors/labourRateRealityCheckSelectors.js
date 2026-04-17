function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function format_currency_precise(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function format_hours(value) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

export function buildLabourRateRealityCheckStatus({ state, outputs }) {
  const has_hourly_rate = Number(state?.labour_rate || 0) > 0;
  const has_hours_per_week = Number(state?.hours_per_week || 0) > 0;
  const has_days_per_week = Number(state?.days_per_week || 0) > 0;

  const missing_inputs = [];
  if (!has_hourly_rate) missing_inputs.push("Hourly rate");
  if (!has_hours_per_week) missing_inputs.push("Hours per week");
  if (!has_days_per_week) missing_inputs.push("Days per week");

  const ready = missing_inputs.length === 0;

  return {
    title: ready ? "Reality check ready" : "Enter your rate to see the drop",
    readiness_label: ready ? "Ready" : "Waiting",
    warning_count: missing_inputs.length,
    warnings: ready ? [] : missing_inputs,
    summary: ready
      ? `${format_currency_precise(outputs.headline_rate)} → ${format_currency_precise(outputs.equivalent_rate)}`
      : "Add 3 simple inputs",
  };
}

export function buildLabourRateRealityCheckCard({
  state,
  outputs,
  update_reality_check_field,
  reset_reality_check_state,
}) {
  return {
    title: "Labour Rate Reality Check",
    kicker: "Quick reality check for contractor rates",

    inputs: {
      labour_rate: state.labour_rate,
      hours_per_week: state.hours_per_week,
      days_per_week: state.days_per_week,
      on_change: update_reality_check_field,
      on_reset: reset_reality_check_state,
    },

    hero: {
      think_line: `You think you’re earning ${format_currency_precise(outputs.headline_rate)}/hr`,
      actual_line: `You’re actually closer to ${format_currency_precise(outputs.equivalent_rate)}/hr`,
    },

    graph: {
      headline_rate_label: `What you think: ${format_currency_precise(outputs.headline_rate)}/hr`,
      equivalent_rate_label: `What it really is: ${format_currency_precise(outputs.equivalent_rate)}/hr`,
      fill_percent: outputs.graph_fill_percent,
      caption: "That drop is the cost of unpaid time.",
    },

    explanation: {
      line_1: "You only get paid when you work.",
      line_2: "Time off and downtime come out of your pocket.",
    },

    annual_snapshot: {
      perfect_world_label: "If everything went perfectly",
      perfect_world_value: `${format_currency(outputs.perfect_world_income)} / year`,
      realistic_label: "More realistically",
      realistic_value: `~ ${format_currency(outputs.annual_income)} / year`,
    },

    detail_rows: [
      {
        label: "Paid hours per year",
        value: `${format_hours(outputs.paid_hours_per_year)} hrs`,
      },
      {
        label: "Unpaid time across the year",
        value: `${format_hours(outputs.non_working_hours)} hrs`,
      },
      {
        label: "Hours you actually work",
        value: `${format_hours(outputs.working_hours)} hrs`,
      },
      {
        label: "Hourly drop",
        value: `${format_currency_precise(outputs.rate_drop_amount)}/hr`,
      },
    ],

    soft_warning:
      "Based on standard NZ time off. Does not include ACC, vehicle, tools, insurance, or gaps between jobs.",

    cta: {
      label: "See what you should really be charging →",
      href: "/labour",
    },
  };
}