function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

export function get_nested_value(source, paths) {
  for (const path of paths) {
    const value = path.reduce((current_value, key) => {
      if (!current_value || typeof current_value !== "object") {
        return undefined;
      }

      return current_value[key];
    }, source);

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

export function extract_labour_output(labour) {
  if (!labour || typeof labour !== "object") {
    return {};
  }

  return (
    get_nested_value(labour, [
      ["output_contract"],
      ["outputs"],
      ["card", "output_contract"],
      ["card", "outputs"],
      ["card", "labour_output"],
      ["labour_output"],
      ["summary"],
      ["card"],
    ]) || labour
  );
}

export function build_labour_source_options(
  labour_output,
  recovery_summary_output = {}
) {
  const productive_staff_type_rates =
    labour_output?.productive_staff_type_rates || [];

  const weighted_all_productive_labour_rate = to_number(
    labour_output?.weighted_all_productive_labour_rate
  );

  const pnl_derived_recovered_labour_rate = to_number(
    labour_output?.pnl_derived_recovered_labour_rate
  );

  const gross_profit = to_number(labour_output?.gross_profit);
  const labour_recovery_pool = to_number(labour_output?.labour_recovery_pool);
  const pnl_labour_recovery_multiplier = to_number(
    labour_output?.pnl_labour_recovery_multiplier
  );

  const total_productive_labour_cost = to_number(
    labour_output?.total_productive_labour_cost
  );

  const total_non_productive_labour_cost = Math.max(
    to_number(labour_output?.total_non_productive_labour_cost),
    0
  );

  const total_productive_labour_hours = to_number(
    labour_output?.total_productive_labour_hours
  );

  const total_business_overheads = to_number(
    recovery_summary_output?.total_business_overheads
  );

  const labour_share_percent = to_number(
    recovery_summary_output?.labour_share_percent ??
      recovery_summary_output?.recovery_plan_split?.labour_share_percent ??
      100
  );

  const labour_allocated_business_overhead_pool = round_currency(
    total_business_overheads * (labour_share_percent / 100)
  );

  const non_productive_labour_pressure_rate =
    total_productive_labour_hours > 0
      ? total_non_productive_labour_cost / total_productive_labour_hours
      : 0;

  const allocated_business_overhead_recovery_rate =
    total_productive_labour_hours > 0
      ? labour_allocated_business_overhead_pool / total_productive_labour_hours
      : 0;

  const labour_status =
    labour_output?.labour_status ||
    labour_output?.labour_model_trust_state ||
    "ready";

  function build_recovery_fields(labour_cost_rate) {
    const safe_labour_cost_rate = to_number(labour_cost_rate);

    const minimum_recoverable_charge_out_rate = round_currency(
      safe_labour_cost_rate + allocated_business_overhead_recovery_rate
    );

    return {
      total_productive_labour_cost,
      total_non_productive_labour_cost,
      total_productive_labour_hours,
      total_business_overheads,
      labour_share_percent,
      labour_allocated_business_overhead_pool,

      non_productive_labour_pressure_rate: round_currency(
        non_productive_labour_pressure_rate
      ),

      // Backwards-compatible name while UI migrates.
      non_productive_labour_recovery_rate: round_currency(
        non_productive_labour_pressure_rate
      ),

      allocated_business_overhead_recovery_rate: round_currency(
        allocated_business_overhead_recovery_rate
      ),

      minimum_recoverable_charge_out_rate,
      fully_loaded_labour_rate: minimum_recoverable_charge_out_rate,
    };
  }

  const options = [];

  if (weighted_all_productive_labour_rate > 0) {
    options.push({
      labour_source_type_id: "all_productive",
      labour_source_type_name: "All productive labour weighted rate",
      labour_source_kind: "all_productive",
      labour_cost_rate: weighted_all_productive_labour_rate,
      pnl_implied_recovered_rate: pnl_derived_recovered_labour_rate,
      pnl_recovery_gap_to_cost_rate:
        pnl_derived_recovered_labour_rate - weighted_all_productive_labour_rate,
      gross_profit,
      labour_recovery_pool,
      pnl_labour_recovery_multiplier,
      rate_status: labour_status,
      source: "labour",
      is_derived_summary: true,
      ...build_recovery_fields(weighted_all_productive_labour_rate),
    });
  }

  productive_staff_type_rates.forEach((rate) => {
    const labour_cost_rate = to_number(rate.weighted_productive_hourly_rate);

    if (labour_cost_rate <= 0) {
      return;
    }

    options.push({
      labour_source_type_id: rate.staff_type_id,
      labour_source_type_name: rate.staff_type_name,
      labour_source_kind: "staff_type",
      labour_cost_rate,
      pnl_implied_recovered_rate: to_number(rate.pnl_implied_recovered_rate),
      pnl_recovery_gap_to_cost_rate: to_number(
        rate.pnl_recovery_gap_to_cost_rate
      ),
      gross_profit,
      labour_recovery_pool,
      pnl_labour_recovery_multiplier,
      staff_count: rate.staff_count,
      total_annual_cost: rate.total_annual_cost,
      total_productive_hours: rate.total_productive_hours,
      productive_share_percent: rate.productive_share_percent,
      rate_status: rate.rate_status,
      source: rate.source || "labour",
      is_derived_summary: false,
      ...build_recovery_fields(labour_cost_rate),
    });
  });

  if (options.length === 0) {
    options.push({
      labour_source_type_id: "manual_preview",
      labour_source_type_name: "Manual preview rate",
      labour_source_kind: "manual",
      labour_cost_rate: 45,
      pnl_implied_recovered_rate: 0,
      pnl_recovery_gap_to_cost_rate: 0,
      gross_profit: 0,
      labour_recovery_pool: 0,
      pnl_labour_recovery_multiplier: 0,
      rate_status: "preview_only",
      source: "rate_builder",
      is_derived_summary: false,
      ...build_recovery_fields(45),
    });
  }

  return options;
}

export function get_selected_labour_source(labour_source_options, active_model) {
  const selected_source = labour_source_options.find(
    (option) =>
      option.labour_source_type_id === active_model?.labour_source_type_id
  );

  return selected_source || labour_source_options[0] || null;
}