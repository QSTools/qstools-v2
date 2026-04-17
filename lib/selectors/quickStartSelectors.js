function format_currency(value) {
  return `$${Math.round(value || 0).toLocaleString()}`;
}

function format_rate(value) {
  return `${format_currency(value)}/hr`;
}

function format_hours(value) {
  return `${Number(value || 0).toFixed(1)} hrs`;
}

export function buildQuickStartCard({
  quick_start_state,
  output_contract,
  update_quick_start_field,
  reset_quick_start_state,
}) {
  const is_labour_reality =
    output_contract.mode_key === "labour_rate_reality_check";

  const primary_value = format_rate(output_contract.primary_value);

  const primary_label =
    output_contract.mode_key === "m2_rate"
      ? "This is what the job is earning per person per hour"
      : output_contract.primary_label;

  const metrics = is_labour_reality
    ? [
        {
          label: "Paid hours per year",
          value: format_hours(output_contract.paid_hours_per_year),
        },
        {
          label: "Unpaid time across the year",
          value: format_hours(output_contract.non_working_hours),
        },
        {
          label: "Hours you actually work",
          value: format_hours(output_contract.working_hours),
        },
        {
          label: "Hourly drop",
          value: format_rate(output_contract.rate_drop_amount),
        },
      ]
    : output_contract.mode_key === "asset_operator"
      ? [
          {
            label: "Direct operating cost",
            value: format_rate(output_contract.direct_cost),
          },
          {
            label: "Weekly buffer",
            value: format_currency(output_contract.weekly_buffer),
          },
          {
            label: "Hours per week",
            value: format_hours(output_contract.labour_hours),
          },
        ]
      : output_contract.mode_key === "m2_rate"
        ? [
            {
              label: "Team rate per hour",
              value: format_rate(output_contract.team_rate_per_hour),
            },
            {
              label: "Implied cost per person per hour",
              value: format_rate(
                output_contract.implied_cost_per_person_per_hour
              ),
            },
            {
              label: "Expected labour margin",
              value: `${output_contract.expected_labour_margin_percent.toFixed(1)}%`,
            },
            {
              label: "Total days",
              value: `${output_contract.total_days.toFixed(1)} days`,
            },
            {
              label: "Total job value",
              value: format_currency(output_contract.total_job_price),
            },
          ]
        : [
            {
              label: "Hours per person",
              value: format_hours(output_contract.hours_per_person),
            },
            {
              label: "Crew days",
              value: `${output_contract.crew_days.toFixed(1)} days`,
            },
          ];

  return {
    business_type: quick_start_state.business_type,
    update_quick_start_field,
    reset_quick_start_state,

    fields: {
      labour_rate: quick_start_state.labour_rate,
      hours_per_week: quick_start_state.hours_per_week,

      labour_hours: quick_start_state.labour_hours,
      total_job_price: quick_start_state.total_job_price,
      staff_assigned: quick_start_state.staff_assigned,
      product_cost: quick_start_state.product_cost,
      product_margin_percent: quick_start_state.product_margin_percent,
      total_m2: quick_start_state.total_m2,
      rate_per_m2: quick_start_state.rate_per_m2,
      expected_task_hours: quick_start_state.expected_task_hours,
      expected_labour_margin_percent:
        quick_start_state.expected_labour_margin_percent,
      machine_rate: quick_start_state.machine_rate,
      operator_rate: quick_start_state.operator_rate,
      charge_out_rate: quick_start_state.charge_out_rate,
      utilisation_hours: quick_start_state.utilisation_hours,
    },

    primary_value,
    primary_label,
    sub_label: output_contract.sub_label,
    metrics,

    total_job_value: format_currency(output_contract.total_job_price),

    cost_value: format_currency(output_contract.cost_value),
    labour_value: format_currency(output_contract.labour_value),
    remaining_value: format_currency(output_contract.remaining_value),

    cost_pct: output_contract.cost_pct,
    labour_pct: output_contract.labour_pct,
    remaining_pct: output_contract.remaining_pct,

    headline_rate_text: format_rate(output_contract.labour_rate),
    equivalent_rate_text: format_rate(output_contract.equivalent_rate),
    headline_rate_value: format_rate(output_contract.labour_rate),
    equivalent_rate_value: format_rate(output_contract.equivalent_rate),
    headline_rate_pct: output_contract.fill_percent,
    lost_rate_pct: 100 - output_contract.fill_percent,
    annual_perfect_text: `If everything went perfectly: ${format_currency(output_contract.perfect_world_income)} / year`,
    annual_real_text: `More realistically: ~ ${format_currency(output_contract.annual_income)} / year`,

    insight_text: output_contract.insight_text,
  };
}