function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function get_rate_map(model = {}) {
  return model?.charge_out_rates_by_labour_source &&
    typeof model.charge_out_rates_by_labour_source === "object"
    ? model.charge_out_rates_by_labour_source
    : {};
}

export function get_source_charge_out_rate(model = {}, source = {}) {
  const source_id = source?.labour_source_type_id;
  const rate_map = get_rate_map(model);

  if (source_id && rate_map[source_id] !== undefined) {
    return to_number(rate_map[source_id]);
  }

  if (source?.labour_source_kind !== "all_productive") {
    return to_number(model?.current_charge_out_rate);
  }

  return 0;
}

export function get_staff_type_sources(labour_source_options = []) {
  return labour_source_options.filter(
    (source) => source.labour_source_kind === "staff_type"
  );
}

export function calculate_weighted_summary_charge_out_rate({
  labour_source_options = [],
  active_model = {},
} = {}) {
  const staff_type_sources = get_staff_type_sources(labour_source_options);
  const rate_map = get_rate_map(active_model);

  let weighted_revenue = 0;
  let weighted_hours = 0;
  let missing_rate_count = 0;

  const rows = staff_type_sources.map((source) => {
    const productive_hours = to_number(source.total_productive_hours);
    const current_charge_out_rate =
      rate_map[source.labour_source_type_id] !== undefined
        ? to_number(rate_map[source.labour_source_type_id])
        : 0;

    const has_rate = current_charge_out_rate > 0;

    if (!has_rate) {
      missing_rate_count += 1;
    }

    const modelled_labour_revenue =
      productive_hours * current_charge_out_rate;

    weighted_revenue += modelled_labour_revenue;
    weighted_hours += productive_hours;

    return {
      labour_source_type_id: source.labour_source_type_id,
      labour_source_type_name: source.labour_source_type_name,
      productive_hours,
      current_charge_out_rate,
      modelled_labour_revenue,
      has_rate,
    };
  });

  return {
    weighted_current_charge_out_rate:
      weighted_hours > 0 ? weighted_revenue / weighted_hours : 0,
    weighted_modelled_labour_revenue: weighted_revenue,
    weighted_productive_hours: weighted_hours,
    weighted_summary_rows: rows,
    missing_rate_count,
    summary_complete: missing_rate_count === 0 && staff_type_sources.length > 0,
  };
}