export function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function to_number(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function format_allocation_amount(value) {
  const rounded = Number(to_number(value).toFixed(2));
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function format_input_amount(value) {
  const parsed = to_number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}