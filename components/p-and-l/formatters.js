export function format_number_with_commas(value) {
  const raw = String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "");

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