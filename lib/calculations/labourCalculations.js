function to_number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_nz_esct_rate(esct_income_base) {
  if (esct_income_base <= 18720) return 0.105;
  if (esct_income_base <= 64200) return 0.175;
  if (esct_income_base <= 93720) return 0.30;
  if (esct_income_base <= 216000) return 0.33;
  return 0.39;
}

export function calculateLabourOutputs(input) {
  const hours_per_week = to_number(input.hours_per_week);
  const days_per_week = to_number(input.days_per_week);
  const labour_rate = to_number(input.labour_rate);
  const charge_out_rate = to_number(input.charge_out_rate);
  const productivity_percent = to_number(input.productivity_percent);
  const margin_target_percent = to_number(input.margin_target_percent);

  const annual_leave_weeks = to_number(input.annual_leave_weeks);
  const public_holiday_days = to_number(input.public_holiday_days);
  const sick_days = to_number(input.sick_days);
  const bereavement_days = to_number(input.bereavement_days);
  const family_violence_days = to_number(input.family_violence_days);

  const employee_kiwisaver_enabled = Boolean(input.employee_kiwisaver_enabled);

  const paid_hours_per_year = hours_per_week * 52;

  const daily_hours =
    days_per_week > 0 ? hours_per_week / days_per_week : 0;

  const non_productive_paid_hours =
    annual_leave_weeks * hours_per_week +
    public_holiday_days * daily_hours +
    sick_days * daily_hours +
    bereavement_days * daily_hours +
    family_violence_days * daily_hours;

  const productive_hours =
    (paid_hours_per_year - non_productive_paid_hours) *
    (productivity_percent / 100);

  const annual_gross_wages = labour_rate * paid_hours_per_year;

  const entitlements_annual = labour_rate * non_productive_paid_hours;

  const gross_wages_annual =
    labour_rate * (paid_hours_per_year - non_productive_paid_hours);

  const employer_kiwisaver_rate = employee_kiwisaver_enabled ? 0.035 : 0;

  const employer_kiwisaver_gross = employee_kiwisaver_enabled
    ? annual_gross_wages * employer_kiwisaver_rate
    : 0;

  const esct_income_base = annual_gross_wages + employer_kiwisaver_gross;

  const esct_rate = employee_kiwisaver_enabled
    ? get_nz_esct_rate(esct_income_base)
    : 0;

  const esct_amount = employee_kiwisaver_enabled
    ? employer_kiwisaver_gross * esct_rate
    : 0;

  const total_employer_contribution_cost = employee_kiwisaver_enabled
    ? employer_kiwisaver_gross + esct_amount
    : 0;

  const base_labour_cost_annual =
    gross_wages_annual + entitlements_annual;

  const total_labour_cost_annual =
    base_labour_cost_annual + total_employer_contribution_cost;

  const loaded_labour_cost_rate =
    paid_hours_per_year > 0
      ? total_labour_cost_annual / paid_hours_per_year
      : 0;

  const productive_labour_cost_rate =
    productive_hours > 0
      ? total_labour_cost_annual / productive_hours
      : 0;

  const labour_cost_rate = productive_labour_cost_rate;

  const margin_decimal = margin_target_percent / 100;

  const minimum_charge_out_rate =
    1 - margin_decimal > 0
      ? productive_labour_cost_rate / (1 - margin_decimal)
      : 0;

  const actual_margin_percent =
    charge_out_rate > 0
      ? ((charge_out_rate - productive_labour_cost_rate) / charge_out_rate) * 100
      : 0;

  const margin_gap = charge_out_rate - minimum_charge_out_rate;
  const profit_per_hour = charge_out_rate - productive_labour_cost_rate;
  const above_recovery = charge_out_rate - minimum_charge_out_rate;

  return {
    paid_hours_per_year,
    daily_hours,
    non_productive_paid_hours,
    productive_hours,
    employer_kiwisaver_rate,
    employer_kiwisaver_gross,
    esct_rate,
    esct_amount,
    total_employer_contribution_cost,
    annual_gross_wages,
    base_labour_cost_annual,
    gross_wages_annual,
    entitlements_annual,
    total_labour_cost_annual,
    loaded_labour_cost_rate,
    productive_labour_cost_rate,
    labour_cost_rate,
    minimum_charge_out_rate,
    actual_margin_percent,
    margin_gap,
    profit_per_hour,
    above_recovery,
  };
}

export default calculateLabourOutputs;