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

function extract_rate_builder_labour_recovery_rows(cost_allocation_output = {}) {
  const rows =
    get_nested_value(cost_allocation_output, [
      ["rate_builder_labour_recovery_rows"],
      ["recovery_plan", "rate_builder_labour_recovery_rows"],
      ["card", "recovery_plan", "rate_builder_labour_recovery_rows"],
      ["output_contract", "rate_builder_labour_recovery_rows"],
      ["output_contract", "recovery_plan", "rate_builder_labour_recovery_rows"],
    ]) || [];

  return Array.isArray(rows) ? rows : [];
}

function get_recovery_row_map(cost_allocation_output = {}) {
  const rows = extract_rate_builder_labour_recovery_rows(cost_allocation_output);
  const row_map = new Map();

  rows.forEach((row) => {
    const row_id = row?.labour_source_type_id || row?.staff_type_id || "";

    if (!row_id) {
      return;
    }

    row_map.set(row_id, row);
  });

  return row_map;
}

function get_all_productive_recovery_row(cost_allocation_output = {}) {
  const rows = extract_rate_builder_labour_recovery_rows(cost_allocation_output);

  return (
    rows.find((row) => {
      return (
        row?.labour_source_type_id === "all_productive" ||
        row?.staff_type_id === "all_productive" ||
        row?.labour_source_kind === "all_productive"
      );
    }) || null
  );
}

function build_recovery_fields({
  labour_cost_rate,
  labour_output,
  cost_allocation_output,
  recovery_row,
}) {
  const safe_labour_cost_rate = to_number(labour_cost_rate);

  const total_non_productive_labour_cost = Math.max(
    to_number(labour_output?.total_non_productive_labour_cost),
    0
  );

  const total_productive_labour_hours = to_number(
    labour_output?.total_productive_labour_hours
  );

  const non_productive_labour_pressure_rate =
    total_productive_labour_hours > 0
      ? total_non_productive_labour_cost / total_productive_labour_hours
      : 0;

  const allocated_business_overhead_recovery_rate = to_number(
    recovery_row?.allocated_business_overhead_recovery_rate
  );

  const labour_allocated_business_overhead_pool = round_currency(
    recovery_row?.labour_allocated_business_overhead_pool ??
      recovery_row?.allocated_business_overhead_amount ??
      recovery_row?.assigned_overhead_amount ??
      0
  );

  const total_business_overheads = round_currency(
    recovery_row?.total_business_overheads ?? 0
  );

  const minimum_recoverable_charge_out_rate = round_currency(
    safe_labour_cost_rate + allocated_business_overhead_recovery_rate
  );

  return {
    total_productive_labour_cost: to_number(
      labour_output?.total_productive_labour_cost
    ),
    total_non_productive_labour_cost,
    total_productive_labour_hours,
    total_business_overheads,

    labour_share_percent: to_number(
      recovery_row?.labour_share_percent ??
        cost_allocation_output?.labour_share_percent ??
        cost_allocation_output?.recovery_plan?.labour_share_percent ??
        0
    ),

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

    overhead_allocation_source:
      recovery_row?.overhead_allocation_source || "cost_allocation",
    overhead_allocation_method: recovery_row?.overhead_allocation_method || "",
  };
}

export function build_labour_source_options(
  labour_output,
  cost_allocation_output = {}
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

  const labour_status =
    labour_output?.labour_status ||
    labour_output?.labour_model_trust_state ||
    "ready";

  const recovery_row_map = get_recovery_row_map(cost_allocation_output);
  const all_productive_recovery_row =
    get_all_productive_recovery_row(cost_allocation_output);

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
      ...build_recovery_fields({
        labour_cost_rate: weighted_all_productive_labour_rate,
        labour_output,
        cost_allocation_output,
        recovery_row: all_productive_recovery_row,
      }),
    });
  }

  productive_staff_type_rates.forEach((rate) => {
    const labour_cost_rate = to_number(rate.weighted_productive_hourly_rate);

    if (labour_cost_rate <= 0) {
      return;
    }

    const recovery_row =
      recovery_row_map.get(rate.staff_type_id) ||
      recovery_row_map.get(rate.labour_type_id) ||
      recovery_row_map.get(rate.labour_type_key) ||
      null;

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
      ...build_recovery_fields({
        labour_cost_rate,
        labour_output,
        cost_allocation_output,
        recovery_row,
      }),
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
      ...build_recovery_fields({
        labour_cost_rate: 45,
        labour_output,
        cost_allocation_output,
        recovery_row: null,
      }),
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