export function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function format_number(value, suffix = "") {
  return `${new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))}${suffix}`;
}

export function format_percent(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));
}
