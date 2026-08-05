export function create_custom_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

export function round_allocation_amount(value) {
  const rounded = Number(to_number(value).toFixed(2));

  return Object.is(rounded, -0) ? 0 : rounded;
}
