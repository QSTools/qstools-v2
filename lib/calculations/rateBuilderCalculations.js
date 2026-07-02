function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  const parsed = to_number(value);
  return Number(parsed.toFixed(2));
}

function round_percent(value) {
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

export function calculateRateBuilderRecoveryPreview({
  total_charge = 0,
  selected_recovery_rate = 0,
  recovery_driver_quantity = 0,
  output_driver_quantity = 0,
} = {}) {
  const safe_total_charge = round_currency(total_charge);
  const safe_selected_recovery_rate = round_currency(selected_recovery_rate);
  const safe_recovery_driver_quantity = to_number(recovery_driver_quantity);
  const safe_output_driver_quantity = to_number(output_driver_quantity);

  const selected_recovery_cost = round_currency(
    safe_selected_recovery_rate * safe_recovery_driver_quantity
  );

  const profit_amount = round_currency(
    safe_total_charge - selected_recovery_cost
  );

  const profit_margin_percent =
    safe_total_charge > 0
      ? round_percent((profit_amount / safe_total_charge) * 100)
      : 0;

  const recovery_cost_per_output_unit =
    safe_output_driver_quantity > 0
      ? round_currency(selected_recovery_cost / safe_output_driver_quantity)
      : 0;

  const profit_per_output_unit =
    safe_output_driver_quantity > 0
      ? round_currency(profit_amount / safe_output_driver_quantity)
      : 0;

  let recovery_status = "not_available";

  if (
    safe_total_charge > 0 &&
    safe_selected_recovery_rate > 0 &&
    safe_recovery_driver_quantity > 0
  ) {
    recovery_status =
      profit_amount >= 0 ? "recovering" : "under_recovering";
  }

  return {
    total_charge: safe_total_charge,
    selected_recovery_rate: safe_selected_recovery_rate,
    recovery_driver_quantity: safe_recovery_driver_quantity,
    selected_recovery_cost,
    profit_amount,
    profit_margin_percent,
    recovery_cost_per_output_unit,
    profit_per_output_unit,
    recovery_status,
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

export function formatPercent(value) {
  return `${round_percent(value)}%`;
}


