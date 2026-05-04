function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDivide(value, divisor) {
  if (Number(divisor) === 0) {
    return 0;
  }

  return Number(value) / Number(divisor);
}

export function calculateQuoteEngine({
  quote_state = {},
  cost_summary_output_contract = {},
  business_summary_output_contract = {},
  labour_output_contract = {},
}) {
  const quote_price_total = toNumber(quote_state.quote_price_total);
  const material_cost_total = toNumber(quote_state.material_cost_total);
  const material_markup_percent = toNumber(quote_state.material_markup_percent);
  const material_sell_total_input = toNumber(quote_state.material_sell_total);
  const labour_charge_out_rate_input = toNumber(quote_state.labour_charge_out_rate);
  const base_labour_hours_allowed = toNumber(quote_state.base_labour_hours_allowed);
  const direct_cost_package_allowance_total = toNumber(
    quote_state.direct_cost_package_allowance_total
  );
  const direct_cost_package_cost_total = toNumber(
    quote_state.direct_cost_package_cost_total
  );

  const required_recovery_rate = toNumber(
    cost_summary_output_contract.required_recovery_rate
  );
  const total_productive_output = toNumber(
    cost_summary_output_contract.total_productive_output
  );
  const total_cost_burden = toNumber(cost_summary_output_contract.total_cost_burden);
  const total_people_cost_annual = toNumber(
    cost_summary_output_contract.total_people_cost_annual
  );
  const total_asset_cost_annual = toNumber(
    cost_summary_output_contract.total_asset_cost_annual
  );
  const total_business_overheads = toNumber(
    cost_summary_output_contract.total_business_overheads
  );
  const model_ready = cost_summary_output_contract.model_ready === true;
  const model_readiness_status =
    cost_summary_output_contract.model_readiness_status || "blocked";

  const productive_labour_cost_rate = toNumber(
    labour_output_contract.productive_labour_cost_rate
  );
  const labour_state_charge_out_rate = toNumber(
    labour_output_contract.current_staff?.charge_out_rate
  );
  const labour_charge_out_rate =
    labour_charge_out_rate_input > 0
      ? labour_charge_out_rate_input
      : labour_state_charge_out_rate;
  const labour_sell_total_input = toNumber(quote_state.labour_sell_total);
  const labour_sell_total =
    labour_sell_total_input > 0
      ? labour_sell_total_input
      : labour_charge_out_rate * base_labour_hours_allowed;

  const material_sell_total =
    material_sell_total_input > 0
      ? material_sell_total_input
      : material_cost_total * (1 + material_markup_percent / 100);

  const true_labour_cost_total =
    base_labour_hours_allowed * productive_labour_cost_rate;
  const direct_cost_total =
    material_cost_total + true_labour_cost_total + direct_cost_package_cost_total;
  const quote_margin_pool = quote_price_total - direct_cost_total;
  const quote_margin_percent =
    quote_price_total > 0
      ? safeDivide(quote_margin_pool, quote_price_total)
      : 0;
  const business_recovery_required_total =
    base_labour_hours_allowed * required_recovery_rate;
  const achieved_margin_per_hour =
    base_labour_hours_allowed > 0
      ? safeDivide(quote_margin_pool, base_labour_hours_allowed)
      : 0;
  const hourly_gap =
    base_labour_hours_allowed > 0
      ? achieved_margin_per_hour - required_recovery_rate
      : 0;
  const quote_gap = quote_margin_pool - business_recovery_required_total;
  const max_viable_hours =
    required_recovery_rate > 0
      ? safeDivide(quote_margin_pool, required_recovery_rate)
      : 0;
  const required_price_at_allowed_hours =
    direct_cost_total + business_recovery_required_total;
  const price_gap = required_price_at_allowed_hours - quote_price_total;

  const quote_model_used = "baseline-only";
  const quote_model_trust_state =
    business_summary_output_contract.model_trust_state ||
    model_readiness_status ||
    (model_ready ? "ready" : "blocked");

  return {
    quote_revenue: quote_price_total,
    quote_price_total,
    material_cost_total,
    material_sell_total,
    material_markup_percent,
    labour_sell_total,
    labour_charge_out_rate,
    base_labour_hours_allowed,
    direct_cost_package_allowance_total,
    direct_cost_package_cost_total,
    true_labour_cost_total,
    direct_cost_total,
    quote_margin_pool,
    quote_margin_percent,
    business_recovery_required_total,
    achieved_margin_per_hour,
    required_recovery_rate,
    hourly_gap,
    quote_gap,
    max_viable_hours,
    required_price_at_allowed_hours,
    price_gap,
    quote_model_used,
    quote_model_trust_state,
    model_ready,
    model_readiness_status,
    total_productive_output,
    total_cost_burden,
    total_people_cost_annual,
    total_asset_cost_annual,
    total_business_overheads,
    productive_labour_cost_rate,
    quote_id: String(quote_state.quote_id || ""),
    job_id: String(quote_state.job_id || ""),
    job_name: String(quote_state.job_name || ""),
    quote_name: String(quote_state.quote_name || ""),
    quote_reference: String(quote_state.quote_reference || ""),
    quote_date: String(quote_state.quote_date || ""),
    quote_status: String(quote_state.quote_status || "draft"),
    quote_version: String(quote_state.quote_version || "1"),
    created_at: String(quote_state.created_at || ""),
    updated_at: String(quote_state.updated_at || ""),
  };
}
