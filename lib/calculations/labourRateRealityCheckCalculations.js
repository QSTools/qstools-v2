function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number((value || 0).toFixed(2));
}

function round_hours(value) {
  return Number((value || 0).toFixed(1));
}

export function calculateLabourRateRealityCheck(inputs = {}) {
  const labour_rate = Math.max(0, to_number(inputs.labour_rate));
  const hours_per_week = Math.max(0, to_number(inputs.hours_per_week));
  const days_per_week = Math.max(0, to_number(inputs.days_per_week));

  const annual_leave_weeks = 4;
  const public_holiday_days = 12;
  const sick_days = 10;
  const bereavement_days = 1;

  const paid_hours_per_year = hours_per_week * 52;

  const safe_days_per_week = days_per_week > 0 ? days_per_week : 0;
  const daily_hours =
    safe_days_per_week > 0 ? hours_per_week / safe_days_per_week : 0;

  const non_working_hours =
    annual_leave_weeks * hours_per_week +
    public_holiday_days * daily_hours +
    sick_days * daily_hours +
    bereavement_days * daily_hours;

  const working_hours = Math.max(0, paid_hours_per_year - non_working_hours);

  const perfect_world_income = labour_rate * paid_hours_per_year;
  const annual_income = labour_rate * working_hours;

  const equivalent_rate =
    paid_hours_per_year > 0 ? annual_income / paid_hours_per_year : 0;

  const rate_drop_amount = Math.max(0, labour_rate - equivalent_rate);
  const rate_drop_percent =
    labour_rate > 0 ? (rate_drop_amount / labour_rate) * 100 : 0;

  const graph_fill_percent =
    labour_rate > 0 ? Math.max(0, Math.min(100, (equivalent_rate / labour_rate) * 100)) : 0;

  return {
    headline_rate: round_currency(labour_rate),
    equivalent_rate: round_currency(equivalent_rate),
    annual_income: round_currency(annual_income),
    perfect_world_income: round_currency(perfect_world_income),
    paid_hours_per_year: round_hours(paid_hours_per_year),
    working_hours: round_hours(working_hours),
    non_working_hours: round_hours(non_working_hours),
    rate_drop_amount: round_currency(rate_drop_amount),
    rate_drop_percent: round_currency(rate_drop_percent),
    graph_fill_percent: round_currency(graph_fill_percent),

    assumptions: {
      annual_leave_weeks,
      public_holiday_days,
      sick_days,
      bereavement_days,
    },
  };
}