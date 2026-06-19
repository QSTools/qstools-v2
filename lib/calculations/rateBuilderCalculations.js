function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  const parsed = to_number(value);
  return Number(parsed.toFixed(2));
}

function get_output_driver_line(line_totals = []) {
  const selected_line = line_totals.find((line) => line.is_output_driver);

  if (selected_line) {
    return selected_line;
  }

  return line_totals[0] || null;
}

export function calculateRateBuilderQuotePreview(rate_lines = []) {
  const line_totals = rate_lines.map((line) => {
    const rate = to_number(line.rate);
    const quantity = to_number(line.quantity);
    const total = round_currency(rate * quantity);

    return {
      ...line,
      rate,
      quantity,
      total,
    };
  });

  const total_charge = round_currency(
    line_totals.reduce((total, line) => total + line.total, 0)
  );

  const output_driver_line = get_output_driver_line(line_totals);

  const output_driver_quantity = output_driver_line
    ? to_number(output_driver_line.quantity)
    : 0;

  const effective_rate_per_output_unit =
    output_driver_quantity > 0
      ? round_currency(total_charge / output_driver_quantity)
      : 0;

  return {
    line_totals,
    total_charge,
    output_driver_id: output_driver_line?.id || "",
    output_driver_name: output_driver_line?.name || "No output driver selected",
    output_driver_unit: output_driver_line?.unit || "unit",
    output_driver_quantity,
    effective_rate_per_output_unit,
  };
}

export function formatCurrency(value) {
  const parsed = to_number(value);

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

export function formatRate(value, unit_label = "unit") {
  const parsed = to_number(value);

  return `${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed)} / ${unit_label}`;
}

export function formatNumber(value) {
  const parsed = to_number(value);

  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 0,
  }).format(parsed);
}