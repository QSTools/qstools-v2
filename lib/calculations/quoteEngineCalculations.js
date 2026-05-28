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

  const cog_cost_total = toNumber(
    quote_state.cog_cost_total || quote_state.material_cost_total
  );

  const cog_pricing_mode = "markup";

  const cog_markup_percent = toNumber(
    quote_state.cog_markup_percent || quote_state.material_markup_percent
  );

  const cog_sell_total = cog_cost_total * (1 + cog_markup_percent / 100);
  const cog_margin_total = cog_sell_total - cog_cost_total;

  const labour_hours_allowed = toNumber(
    quote_state.labour_hours_allowed || quote_state.base_labour_hours_allowed
  );

  const labour_hourly_cost_rate = toNumber(
    quote_state.labour_hourly_cost_rate
  );

  const labour_cost_total =
    labour_hours_allowed * labour_hourly_cost_rate;

  const labour_charge_total = Math.max(0, quote_price_total - cog_sell_total);

  const labour_margin_total =
    labour_charge_total - labour_cost_total;

  const required_recovery_rate = toNumber(
    cost_summary_output_contract.required_recovery_rate
  );

  const total_productive_output = toNumber(
    cost_summary_output_contract.total_productive_output
  );

  const total_cost_burden = toNumber(
    cost_summary_output_contract.total_cost_burden
  );

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

  const model_labour_cost_total =
    labour_hours_allowed * productive_labour_cost_rate;

  const labour_cost_variance =
    labour_cost_total - model_labour_cost_total;

  const labour_charge_out_rate =
    labour_hours_allowed > 0
      ? safeDivide(labour_charge_total, labour_hours_allowed)
      : 0;

  const estimated_job_cost_total =
    cog_cost_total + labour_cost_total;

  const quote_margin_pool = quote_price_total - estimated_job_cost_total;

  const quote_margin_percent =
    quote_price_total > 0
      ? safeDivide(quote_margin_pool, quote_price_total)
      : 0;

  const business_recovery_required_total =
    labour_hours_allowed * required_recovery_rate;

  const achieved_margin_per_hour =
    labour_hours_allowed > 0
      ? safeDivide(quote_margin_pool, labour_hours_allowed)
      : 0;

  const hourly_gap =
    labour_hours_allowed > 0
      ? achieved_margin_per_hour - required_recovery_rate
      : 0;

  const quote_gap = quote_margin_pool - business_recovery_required_total;

  const max_viable_hours =
    required_recovery_rate > 0
      ? safeDivide(quote_margin_pool, required_recovery_rate)
      : 0;

  const required_price_at_allowed_hours =
    estimated_job_cost_total + business_recovery_required_total;

  const price_gap = required_price_at_allowed_hours - quote_price_total;

  const quote_model_used = "balanced-cog-markup-plus-labour-hourly-cost";

  const quote_model_trust_state =
    business_summary_output_contract.model_trust_state ||
    model_readiness_status ||
    (model_ready ? "ready" : "blocked");

  return {
    quote_revenue: quote_price_total,
    quote_price_total,

    cog_cost_total,
    cog_pricing_mode,
    cog_markup_percent,
    cog_sell_total,
    cog_margin_total,

    labour_hours_allowed,
    labour_hourly_cost_rate,
    labour_cost_total,
    labour_charge_total,
    labour_charge_out_rate,
    labour_margin_total,

    estimated_labour_cost_total: labour_cost_total,
    estimated_labour_cost_rate: labour_hourly_cost_rate,

    model_labour_cost_total,
    labour_cost_variance,
    productive_labour_cost_rate,

    estimated_job_cost_total,
    direct_cost_total: estimated_job_cost_total,

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

    material_cost_total: cog_cost_total,
    material_sell_total: cog_sell_total,
    material_markup_percent: cog_markup_percent,
    labour_sell_total: labour_charge_total,
    base_labour_hours_allowed: labour_hours_allowed,
    true_labour_cost_total: labour_cost_total,
    direct_cost_package_allowance_total: 0,
    direct_cost_package_cost_total: 0,

    quote_id: String(quote_state.quote_id || ""),
    quote_job_id: String(quote_state.quote_job_id || ""),
    quote_version_id: String(quote_state.quote_version_id || ""),

    job_id: String(quote_state.job_id || ""),
    job_number: String(quote_state.job_number || ""),
    job_name: String(quote_state.job_name || ""),

    client_id: String(quote_state.client_id || ""),
    client_name: String(quote_state.client_name || ""),
    client_contact_name: String(quote_state.client_contact_name || ""),
    client_phone: String(quote_state.client_phone || ""),
    client_email: String(quote_state.client_email || ""),

    job_type_id: String(quote_state.job_type_id || ""),
    job_type_name: String(quote_state.job_type_name || ""),

    quote_name: String(quote_state.quote_name || quote_state.job_name || ""),
    quote_reference: String(
      quote_state.quote_reference || quote_state.job_number || ""
    ),
    quote_date: String(quote_state.quote_date || ""),
    quote_status: String(quote_state.quote_status || "draft"),
    quote_version: String(quote_state.quote_version || "1"),

    is_winning_quote: Boolean(quote_state.is_winning_quote),
    is_live_job: Boolean(quote_state.is_live_job),
    live_job_id: String(quote_state.live_job_id || ""),

    created_at: String(quote_state.created_at || ""),
    updated_at: String(quote_state.updated_at || ""),
  };
}