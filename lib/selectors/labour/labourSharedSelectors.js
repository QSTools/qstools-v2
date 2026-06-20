import { to_number } from "@/lib/selectors/labour/labourFormatters";

export function get_acc_rate_value(outputs = {}) {
  return Number(outputs.acc_rate_percent ?? outputs.acc_rate ?? 0);
}

export function get_acc_levy_value(outputs = {}) {
  return Number(outputs.acc_levy_annual ?? outputs.acc_work_levy_annual ?? 0);
}

export function sum_staff_acc_levy(active_staff = []) {
  return active_staff.reduce((total, staff) => {
    return total + get_acc_levy_value(staff);
  }, 0);
}

export function get_staff_labour_cost(staff = {}) {
  return to_number(
    staff?.total_labour_cost_annual ??
      staff?.total_people_cost_annual ??
      staff?.annual_labour_cost ??
      staff?.annual_cost
  );
}

export function get_staff_productive_hours(staff = {}) {
  return to_number(
    staff?.productive_hours_annual ??
      staff?.recovery_hours ??
      staff?.productive_hours
  );
}

export function get_available_hours_before_productivity(outputs = {}) {
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const non_productive_hours = Number(outputs.non_productive_paid_hours ?? 0);
  return Math.max(paid_hours - non_productive_hours, 0);
}

export function get_lost_hours_to_productivity(outputs = {}) {
  const available_hours = get_available_hours_before_productivity(outputs);
  const productive_hours = Number(outputs.productive_hours ?? 0);
  return Math.max(available_hours - productive_hours, 0);
}