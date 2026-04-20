export function format_number_with_commas(value) {
  const raw = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  if (!raw || raw === "-" || raw === "." || raw === "-.") {
    return raw;
  }

  const [whole, decimal] = raw.split(".");
  const formatted_whole = Number(whole || 0).toLocaleString("en-NZ");

  if (decimal !== undefined) {
    return `${formatted_whole}.${decimal}`;
  }

  return formatted_whole;
}

export function parse_number_string(value) {
  return String(value ?? "").replace(/,/g, "");
}

export function format_number(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

export function format_number_precise(value, decimals = 2) {
  return Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function format_percent(value) {
  return `${((Number(value || 0) || 0) * 100).toFixed(1)}%`;
}

// Backwards-compatible alias.
// Keeps older components working while we remove format_currency imports.
export function format_currency(value) {
  return format_number(value);
}