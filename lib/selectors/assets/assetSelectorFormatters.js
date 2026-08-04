export function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function format_percent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export function format_number(value, decimals = 2) {
  return Number(value || 0).toFixed(decimals);
}

export function format_hours(value, decimals = 0) {
  return `${Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} hrs`;
}

export function has_value(value) {
  return value !== null && value !== undefined && value !== "";
}

export function has_positive_number(value) {
  return Number(value || 0) > 0;
}

export function has_valid_number(value) {
  return Number.isFinite(Number(value));
}

export function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

