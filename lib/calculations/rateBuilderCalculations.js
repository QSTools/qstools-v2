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
export function calculateRateBuilderRecoveryPreview({
  total_charge = 0,
  selected_recovery_rate = 0,
  recovery_driver_quantity = 0,
  output_driver_quantity = 0,
}) {
  const safe_total_charge = to_number(total_charge);
  const safe_selected_recovery_rate = to_number(selected_recovery_rate);
  const safe_recovery_driver_quantity = to_number(recovery_driver_quantity);
  const safe_output_driver_quantity = to_number(output_driver_quantity);

  const selected_recovery_cost = round_currency(
    safe_selected_recovery_rate * safe_recovery_driver_quantity
  );

  const profit_amount = round_currency(
    safe_total_charge - selected_recovery_cost
  );

  const profit_margin_percent =
    safe_total_charge > 0 ? (profit_amount / safe_total_charge) * 100 : 0;

  const recovery_cost_per_output_unit =
    safe_output_driver_quantity > 0
      ? round_currency(selected_recovery_cost / safe_output_driver_quantity)
      : 0;

  const profit_per_output_unit =
    safe_output_driver_quantity > 0
      ? round_currency(profit_amount / safe_output_driver_quantity)
      : 0;

  const recovery_status =
    safe_total_charge > 0 &&
    safe_selected_recovery_rate > 0 &&
    safe_recovery_driver_quantity > 0
      ? profit_amount >= 0
        ? "profitable"
        : "shortfall"
      : "not_ready";

  return {
    total_charge: safe_total_charge,
    selected_recovery_rate: safe_selected_recovery_rate,
    recovery_driver_quantity: safe_recovery_driver_quantity,
    output_driver_quantity: safe_output_driver_quantity,
    selected_recovery_cost,
    profit_amount,
    profit_margin_percent,
    recovery_cost_per_output_unit,
    profit_per_output_unit,
    recovery_status,
  };
}

// CM-1b (v6.0, 2026-09-25) - the ONE rule for a calculator's recovery
// hours, shared by Rate Builder's own result panel and Business Outcome so
// the two cannot drift. Hours = sum of the quantities on lines priced per
// hour (unit "hr"); only when there are none, the output driver quantity.
// The output driver is a display choice (price per m3, per hour, ...) and
// must not change the hourly rate. Replaces Business Outcome's old copy,
// which read a line `type` field that current calculators no longer carry.
export function get_calculator_recovery_hours(line_totals = [], output_driver_quantity = 0) {
  const hour_line_quantity = (Array.isArray(line_totals) ? line_totals : [])
    .filter((line) => line?.unit === "hr")
    .reduce((total, line) => total + to_number(line.quantity), 0);
  return hour_line_quantity > 0 ? hour_line_quantity : to_number(output_driver_quantity);
}

// CM-1 (v6.0, 2026-09-25) - net asset rate. Owner rule (signed off
// 2026-09-24; location moved into Rate Builder 2026-09-25): a working
// unit's calculator rate is ALL-IN (labour + asset). Labour's share is
// the charge-out rates set first on the Labour tab, weighted by the hours
// each staff type is actually assigned to that unit in Cost Allocation.
// The asset earns what is left. Deliberately NOT clamped - a negative
// result is a genuine underpricing signal, reported as is.
export function calculate_labour_mix_charge_rate(labour_assignments = [], charge_out_rate_by_staff_type_id = new Map()) {
  const assignments = Array.isArray(labour_assignments) ? labour_assignments : [];
  const total_hours = assignments.reduce((sum, a) => sum + to_number(a?.assigned_hours), 0);
  if (total_hours <= 0) {
    return 0;
  }
  const weighted = assignments.reduce(
    (sum, a) => sum + to_number(a?.assigned_hours) * to_number(charge_out_rate_by_staff_type_id.get(a?.staff_type_id)),
    0
  );
  return weighted / total_hours;
}

export function calculate_net_asset_rate(combined_rate, labour_mix_charge_rate = 0) {
  if (combined_rate === null || combined_rate === undefined) {
    return null;
  }
  return to_number(combined_rate) - to_number(labour_mix_charge_rate);
}

export function formatPercent(value) {
  const parsed = to_number(value);

  return `${new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed)}%`;
}
