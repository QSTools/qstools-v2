export function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function format_number(value, suffix = "") {
  return `${new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))}${suffix}`;
}

export function format_rate(value, suffix = "/hr") {
  return `${format_currency(value)}${suffix}`;
}

export function format_status_label(value) {
  const status_map = {
    pending_live_feedback: "Pending live job feedback",
    estimated: "Estimated until verified",
    not_selected: "Not selected",
  };

  return status_map[value] || value || "Not available";
}
