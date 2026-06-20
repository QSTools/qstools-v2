export function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function round_currency(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

export function round_percent(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

export function clamp_percent(value) {
  return Math.min(Math.max(to_number(value), 0), 99.99);
}

export function calculate_labour_rate_result(rate_model) {
  const labour_cost_rate = Math.max(to_number(rate_model.labour_cost_rate), 0);
  const productive_efficiency_percent = Math.max(
    to_number(rate_model.productive_efficiency_percent),
    0
  );
  const recovery_allowance_rate = Math.max(
    to_number(rate_model.recovery_allowance_rate),
    0
  );
  const target_margin_percent = clamp_percent(rate_model.target_margin_percent);
  const current_charge_out_rate = Math.max(
    to_number(rate_model.current_charge_out_rate),
    0
  );

  const efficiency_factor =
    productive_efficiency_percent > 0
      ? productive_efficiency_percent / 100
      : 0;

  const effective_labour_cost_rate =
    efficiency_factor > 0 ? labour_cost_rate / efficiency_factor : 0;

  const cost_with_recovery =
    effective_labour_cost_rate + recovery_allowance_rate;

  const margin_factor = 1 - target_margin_percent / 100;

  const suggested_charge_out_rate =
    margin_factor > 0 ? cost_with_recovery / margin_factor : 0;

  const profit_per_hour =
    current_charge_out_rate - cost_with_recovery;

  const current_margin_percent =
    current_charge_out_rate > 0
      ? (profit_per_hour / current_charge_out_rate) * 100
      : 0;

  const rate_gap =
    current_charge_out_rate - suggested_charge_out_rate;

  const above_target = rate_gap >= 0;

  return {
    labour_cost_rate: round_currency(labour_cost_rate),
    productive_efficiency_percent: round_percent(productive_efficiency_percent),
    effective_labour_cost_rate: round_currency(effective_labour_cost_rate),
    recovery_allowance_rate: round_currency(recovery_allowance_rate),
    cost_with_recovery: round_currency(cost_with_recovery),
    target_margin_percent: round_percent(target_margin_percent),
    suggested_charge_out_rate: round_currency(suggested_charge_out_rate),
    current_charge_out_rate: round_currency(current_charge_out_rate),
    profit_per_hour: round_currency(profit_per_hour),
    current_margin_percent: round_percent(current_margin_percent),
    rate_gap: round_currency(rate_gap),
    above_target,
  };
}

export function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(to_number(value));
}

export function format_rate(value, unit = "hr") {
  return `${format_currency(value)} / ${unit || "hr"}`;
}

export function format_percent(value) {
  return `${round_percent(value)}%`;
}