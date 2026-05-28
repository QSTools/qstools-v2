function to_number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_staff_labour_cost(staff = {}) {
  return to_number(
    staff?.annual_labour_cost ??
      staff?.total_labour_cost_annual ??
      staff?.total_people_cost_annual ??
      staff?.annual_cost
  );
}

function get_staff_productive_hours(staff = {}) {
  return to_number(
    staff?.productive_hours_annual ??
      staff?.recovery_hours ??
      staff?.productive_hours
  );
}

export function isProductiveStaff(staff = {}) {
  const labour_class = String(staff?.labour_class || "")
    .trim()
    .toLowerCase();

  return staff?.is_productive === true || labour_class === "productive";
}

function get_staff_type_rate_status({
  staff_type_id = "",
  total_annual_cost = 0,
  total_productive_hours = 0,
}) {
  if (staff_type_id === "unassigned_productive_review") {
    return "review_unassigned_staff_type";
  }

  if (total_annual_cost > 0 && total_productive_hours <= 0) {
    return "invalid_zero_productive_hours";
  }

  if (total_productive_hours > 0 && total_annual_cost <= 0) {
    return "review_zero_cost";
  }

  return "ready";
}

function build_productive_staff_type_rate_warnings({
  productive_staff_type_rates = [],
  total_productive_labour_hours = 0,
}) {
  const warnings = [];

  productive_staff_type_rates.forEach((rate) => {
    if (rate.rate_status === "invalid_zero_productive_hours") {
      warnings.push({
        warning_key: "productive_staff_type_zero_hours",
        message: `${rate.staff_type_name} has annual labour cost but no productive hours. Assign productive hours before using this rate.`,
        staff_type_name: rate.staff_type_name,
      });
    }

    if (rate.rate_status === "review_zero_cost") {
      warnings.push({
        warning_key: "productive_staff_type_zero_cost",
        message: `${rate.staff_type_name} has productive hours but no annual labour cost. Review labour cost setup.`,
        staff_type_name: rate.staff_type_name,
      });
    }

    if (rate.rate_status === "review_unassigned_staff_type") {
      warnings.push({
        warning_key: "productive_staff_type_unassigned",
        message:
          "Productive staff have no staff type assigned. Assign staff type before using staff type rates.",
        staff_type_name: rate.staff_type_name,
      });
    }
  });

  if (
    productive_staff_type_rates.length > 0 &&
    total_productive_labour_hours <= 0
  ) {
    warnings.push({
      warning_key: "total_productive_hours_zero",
      message:
        "Total productive labour hours are zero, so weighted productive labour rates cannot be used yet.",
    });
  }

  return warnings;
}

export function calculateProductiveStaffTypeRates(active_staff = []) {
  const productive_staff = (active_staff ?? []).filter((staff) => {
    return staff?.is_active !== false && isProductiveStaff(staff);
  });
  const total_productive_labour_hours = productive_staff.reduce(
    (total, staff) => total + get_staff_productive_hours(staff),
    0
  );
  const total_productive_labour_cost = productive_staff.reduce(
    (total, staff) => total + get_staff_labour_cost(staff),
    0
  );
  const groups = new Map();

  productive_staff.forEach((staff) => {
    const staff_type_id = String(staff?.staff_type_id || "").trim();
    const staff_type_name = String(staff?.staff_type_name || "").trim();
    const group_id = staff_type_id || "unassigned_productive_review";
    const group_name = staff_type_id
      ? staff_type_name || "Unnamed staff type"
      : "Unassigned / Review required";
    const annual_cost = get_staff_labour_cost(staff);
    const productive_hours = get_staff_productive_hours(staff);

    if (!groups.has(group_id)) {
      groups.set(group_id, {
        staff_type_id: group_id,
        staff_type_name: group_name,
        staff_count: 0,
        total_annual_cost: 0,
        total_productive_hours: 0,
        weighted_productive_hourly_rate: 0,
        productive_share_percent: 0,
        is_productive: true,
        rate_status: "ready",
        source: "labour_module",
      });
    }

    const group = groups.get(group_id);
    group.staff_count += 1;
    group.total_annual_cost += annual_cost;
    group.total_productive_hours += productive_hours;
  });

  const productive_staff_type_rates = Array.from(groups.values())
    .map((group) => {
      const weighted_productive_hourly_rate =
        group.total_productive_hours > 0 && group.total_annual_cost > 0
          ? group.total_annual_cost / group.total_productive_hours
          : 0;
      const productive_share_percent =
        total_productive_labour_hours > 0
          ? (group.total_productive_hours / total_productive_labour_hours) * 100
          : 0;

      return {
        ...group,
        weighted_productive_hourly_rate,
        productive_share_percent,
        rate_status: get_staff_type_rate_status(group),
      };
    })
    .sort((left, right) =>
      left.staff_type_name.localeCompare(right.staff_type_name)
    );

  return {
    productive_staff_type_rates,
    total_productive_labour_hours,
    total_productive_labour_cost,
    weighted_all_productive_labour_rate:
      total_productive_labour_hours > 0
        ? total_productive_labour_cost / total_productive_labour_hours
        : 0,
    productive_staff_type_rate_warnings:
      build_productive_staff_type_rate_warnings({
        productive_staff_type_rates,
        total_productive_labour_hours,
      }),
  };
}

function get_nz_esct_rate(esct_income_base) {
  if (esct_income_base <= 18720) return 0.105;
  if (esct_income_base <= 64200) return 0.175;
  if (esct_income_base <= 93720) return 0.30;
  if (esct_income_base <= 216000) return 0.33;
  return 0.39;
}

export function calculateLabourOutputs(input = {}) {
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

  const acc_enabled = input.acc_enabled !== false;

  const acc_rate = input.acc_manual_override_enabled
    ? to_number(input.acc_manual_rate)
    : to_number(input.acc_rate);

  const paid_hours_per_year = hours_per_week * 52;

  const daily_hours = days_per_week > 0 ? hours_per_week / days_per_week : 0;

  const annual_leave_hours = annual_leave_weeks * hours_per_week;
  const public_holiday_hours = public_holiday_days * daily_hours;
  const sick_leave_hours = sick_days * daily_hours;
  const bereavement_leave_hours = bereavement_days * daily_hours;
  const family_violence_leave_hours = family_violence_days * daily_hours;

  const non_productive_paid_hours =
    annual_leave_hours +
    public_holiday_hours +
    sick_leave_hours +
    bereavement_leave_hours +
    family_violence_leave_hours;

  const productive_hours =
    (paid_hours_per_year - non_productive_paid_hours) *
    (productivity_percent / 100);

  const contributes_to_recovery_hours =
    input.contributes_to_recovery_hours !== false;

  const recovery_hours = contributes_to_recovery_hours ? productive_hours : 0;

  const base_labour_cost_annual = labour_rate * paid_hours_per_year;

  const gross_wages_annual = base_labour_cost_annual;

  const annual_leave_cost_annual = labour_rate * annual_leave_hours;
  const public_holiday_cost_annual = labour_rate * public_holiday_hours;
  const sick_leave_cost_annual = labour_rate * sick_leave_hours;
  const bereavement_leave_cost_annual = labour_rate * bereavement_leave_hours;
  const family_violence_leave_cost_annual =
    labour_rate * family_violence_leave_hours;

  const entitlements_annual = labour_rate * non_productive_paid_hours;

  const employer_kiwisaver_rate = employee_kiwisaver_enabled ? 0.035 : 0;

  const employer_kiwisaver_gross = employee_kiwisaver_enabled
    ? gross_wages_annual * employer_kiwisaver_rate
    : 0;

  const esct_income_base = gross_wages_annual + employer_kiwisaver_gross;

  const esct_rate = employee_kiwisaver_enabled
    ? get_nz_esct_rate(esct_income_base)
    : 0;

  const esct_amount = employee_kiwisaver_enabled
    ? employer_kiwisaver_gross * esct_rate
    : 0;

  const acc_work_levy_annual = acc_enabled
    ? gross_wages_annual * (acc_rate / 100)
    : 0;

  const total_employer_contribution_cost =
    employer_kiwisaver_gross + esct_amount + acc_work_levy_annual;

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
      ? ((charge_out_rate - productive_labour_cost_rate) / charge_out_rate) *
        100
      : 0;

  const margin_gap = charge_out_rate - minimum_charge_out_rate;
  const profit_per_hour = charge_out_rate - productive_labour_cost_rate;
  const above_recovery = charge_out_rate - minimum_charge_out_rate;

  return {
    paid_hours_per_year,
    daily_hours,
    annual_leave_hours,
    public_holiday_hours,
    sick_leave_hours,
    bereavement_leave_hours,
    family_violence_leave_hours,
    non_productive_paid_hours,
    productive_hours,
    recovery_hours,
    contributes_to_recovery_hours,

    employer_kiwisaver_rate,
    employer_kiwisaver_gross,
    esct_rate,
    esct_amount,
    acc_rate,
    acc_work_levy_annual,
    total_employer_contribution_cost,

    base_labour_cost_annual,
    gross_wages_annual,
    annual_leave_cost_annual,
    public_holiday_cost_annual,
    sick_leave_cost_annual,
    bereavement_leave_cost_annual,
    family_violence_leave_cost_annual,
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
