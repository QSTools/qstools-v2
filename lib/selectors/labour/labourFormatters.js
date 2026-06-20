export function format_currency(value, decimals = 0) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value || 0));
}

export function format_number(value, maximum_fraction_digits = 0) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maximum_fraction_digits,
  }).format(Number(value || 0));
}

export function format_percent(value, maximum_fraction_digits = 0) {
  return `${format_number(Number(value || 0), maximum_fraction_digits)}%`;
}

export function has_value(value) {
  return value !== null && value !== undefined && value !== "";
}

export function has_positive_number(value) {
  return Number(value || 0) > 0;
}

export function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sum_staff_value(active_staff = [], field = "") {
  return active_staff.reduce((total, staff) => {
    return total + to_number(staff?.[field]);
  }, 0);
}