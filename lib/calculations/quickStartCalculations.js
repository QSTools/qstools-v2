function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safe_divide(a, b) {
  if (!Number.isFinite(b) || b <= 0) return 0;
  return a / b;
}

function round_currency(value) {
  return Number((value || 0).toFixed(2));
}

function round_number(value) {
  return Number((value || 0).toFixed(2));
}

function clamp_percent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function build_labour_only(inputs) {
  const labour_hours = to_number(inputs.labour_hours);
  const total_job_price = to_number(inputs.total_job_price);
  const staff_assigned = Math.max(1, to_number(inputs.staff_assigned));

  const time_earning_rate = safe_divide(total_job_price, labour_hours);
  const hours_per_person = safe_divide(labour_hours, staff_assigned);
  const crew_days = safe_divide(labour_hours, staff_assigned * 8);

  const cost_value = 0;
  const labour_value = total_job_price;
  const remaining_value = 0;

  return {
    mode_key: "labour_only",
    mode_label: "Labour",
    primary_value: round_currency(time_earning_rate),
    primary_label: "This is what your time is actually earning",
    sub_label: "Based on total job value and labour time",

    labour_hours: round_number(labour_hours),
    total_job_price: round_currency(total_job_price),
    staff_assigned: round_number(staff_assigned),
    hours_per_person: round_number(hours_per_person),
    crew_days: round_number(crew_days),

    cost_value: round_currency(cost_value),
    labour_value: round_currency(labour_value),
    remaining_value: round_currency(remaining_value),

    cost_pct: 0,
    labour_pct: 100,
    remaining_pct: 0,

    insight_text: "This shows how your quote converts into time-based return.",
  };
}

function build_product_time(inputs) {
  const labour_hours = to_number(inputs.labour_hours);
  const total_job_price = to_number(inputs.total_job_price);
  const staff_assigned = Math.max(1, to_number(inputs.staff_assigned));
  const product_cost = to_number(inputs.product_cost);
  const product_margin_percent = to_number(inputs.product_margin_percent);

  const product_sell_value =
    product_cost * (1 + product_margin_percent / 100);

  const time_value = total_job_price - product_sell_value;
  const time_earning_rate = safe_divide(time_value, labour_hours);

  const hours_per_person = safe_divide(labour_hours, staff_assigned);
  const crew_days = safe_divide(labour_hours, staff_assigned * 8);

  const remaining_value = Math.max(product_sell_value - product_cost, 0);
  const labour_value = Math.max(time_value, 0);
  const cost_value = product_cost;

  const cost_pct = clamp_percent(safe_divide(cost_value, total_job_price) * 100);
  const labour_pct = clamp_percent(
    safe_divide(labour_value, total_job_price) * 100,
  );
  const remaining_pct = clamp_percent(
    safe_divide(remaining_value, total_job_price) * 100,
  );

  const insight_text =
    labour_value >= remaining_value
      ? "Most of this quote is being carried by labour."
      : "A large portion of this quote is being carried by remaining margin.";

  return {
    mode_key: "product_time",
    mode_label: "Product + Time",
    primary_value: round_currency(time_earning_rate),
    primary_label: "This is what your time is actually earning",
    sub_label: "After the product is covered",

    labour_hours: round_number(labour_hours),
    total_job_price: round_currency(total_job_price),
    staff_assigned: round_number(staff_assigned),
    hours_per_person: round_number(hours_per_person),
    crew_days: round_number(crew_days),

    cost_value: round_currency(cost_value),
    labour_value: round_currency(labour_value),
    remaining_value: round_currency(remaining_value),

    cost_pct,
    labour_pct,
    remaining_pct,

    insight_text,
  };
}

function build_m2_rate(inputs) {
  const total_m2 = to_number(inputs.total_m2);
  const rate_per_m2 = to_number(inputs.rate_per_m2);
  const expected_task_hours = to_number(inputs.expected_task_hours);
  const staff_assigned = Math.max(1, to_number(inputs.staff_assigned));
  const expected_labour_margin_percent = clamp_percent(
    to_number(inputs.expected_labour_margin_percent),
  );

  const margin_decimal = expected_labour_margin_percent / 100;

  const total_job_price = total_m2 * rate_per_m2;
  const total_days = safe_divide(expected_task_hours, 8);

  const team_rate_per_hour = safe_divide(total_job_price, expected_task_hours);
  const rate_per_person_per_hour = safe_divide(
    total_job_price,
    expected_task_hours * staff_assigned,
  );

  const implied_cost_per_person_per_hour =
    rate_per_person_per_hour * (1 - margin_decimal);

  const total_labour_cost = total_job_price * (1 - margin_decimal);
  const remaining_value = Math.max(total_job_price - total_labour_cost, 0);

  const cost_pct = clamp_percent(
    safe_divide(total_labour_cost, total_job_price) * 100,
  );
  const labour_pct = 0;
  const remaining_pct = clamp_percent(
    safe_divide(remaining_value, total_job_price) * 100,
  );

  return {
    mode_key: "m2_rate",
    mode_label: "m² Rate",
    primary_value: round_currency(rate_per_person_per_hour),
    primary_label: "Charge-out rate per staff hour",
    sub_label: "What each person must earn per hour for this job to work",

    labour_hours: round_number(expected_task_hours),
    total_job_price: round_currency(total_job_price),
    staff_assigned: round_number(staff_assigned),
    hours_per_person: round_number(
      safe_divide(expected_task_hours, staff_assigned),
    ),
    crew_days: round_number(total_days),

    team_rate_per_hour: round_currency(team_rate_per_hour),
    rate_per_person_per_hour: round_currency(rate_per_person_per_hour),
    implied_cost_per_person_per_hour: round_currency(
      implied_cost_per_person_per_hour,
    ),
    expected_labour_margin_percent: round_number(expected_labour_margin_percent),
    total_days: round_number(total_days),

    cost_value: round_currency(total_labour_cost),
    labour_value: 0,
    remaining_value: round_currency(remaining_value),

    cost_pct,
    labour_pct,
    remaining_pct,

    insight_text:
      "This shows what the job is generating per person per hour. The full QS Tools system models how many m² you need each month to support your business.",
  };
}

function build_asset_operator(inputs) {
  const machine_rate = to_number(inputs.machine_rate);
  const operator_rate = to_number(inputs.operator_rate);
  const charge_out_rate = to_number(inputs.charge_out_rate);
  const utilisation_hours = to_number(inputs.utilisation_hours);

  const direct_cost = machine_rate + operator_rate;
  const hourly_buffer = charge_out_rate - direct_cost;
  const weekly_buffer = hourly_buffer * utilisation_hours;

  const cost_pct = clamp_percent(safe_divide(machine_rate, charge_out_rate) * 100);
  const labour_pct = clamp_percent(
    safe_divide(operator_rate, charge_out_rate) * 100,
  );
  const remaining_pct = clamp_percent(
    safe_divide(Math.max(hourly_buffer, 0), charge_out_rate) * 100,
  );

  return {
    mode_key: "asset_operator",
    mode_label: "Asset + Operator",
    primary_value: round_currency(hourly_buffer),
    primary_label: "This is what this work leaves per hour",
    sub_label: "Before wider business costs",

    labour_hours: round_number(utilisation_hours),
    total_job_price: 0,
    staff_assigned: 1,
    hours_per_person: round_number(utilisation_hours),
    crew_days: round_number(utilisation_hours / 8),

    cost_value: round_currency(machine_rate),
    labour_value: round_currency(operator_rate),
    remaining_value: round_currency(Math.max(hourly_buffer, 0)),

    cost_pct,
    labour_pct,
    remaining_pct,

    direct_cost: round_currency(direct_cost),
    weekly_buffer: round_currency(weekly_buffer),

    insight_text:
      "This model depends on consistent utilisation, not just a strong hourly rate.",
  };
}

export function calculateQuickStart(inputs = {}) {
  const business_type = inputs.business_type || "product_time";

  switch (business_type) {
    case "labour_only":
      return build_labour_only(inputs);
    case "m2_rate":
      return build_m2_rate(inputs);
    case "asset_operator":
      return build_asset_operator(inputs);
    case "product_time":
    default:
      return build_product_time(inputs);
  }
}