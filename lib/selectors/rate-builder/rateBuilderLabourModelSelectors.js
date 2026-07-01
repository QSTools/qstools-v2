export const LABOUR_UNIT_LABEL = "hr";
export const PRODUCTIVE_EFFICIENCY_PERCENT = 100;
export const RECOVERY_ALLOWANCE_RATE = 0;

export function build_cost_allocation_output_contract(cost_allocation = {}) {
  return {
    ...(cost_allocation?.output_contract ?? {}),
    recovery_plan: cost_allocation?.card?.recovery_plan ?? {},
    card: cost_allocation?.card ?? {},
  };
}

export function normalise_loaded_labour_rate_models({
  loaded_models = [],
  saved_labour_source_rates = {},
  get_rate_map,
}) {
  return loaded_models.map((model) => ({
    ...model,
    charge_out_rates_by_labour_source: {
      ...get_rate_map(model),
      ...saved_labour_source_rates,
    },
  }));
}

export function get_active_labour_rate_model({
  labour_rate_models = [],
  active_labour_rate_model_id,
}) {
  return (
    labour_rate_models.find(
      (model) => model.labour_rate_model_id === active_labour_rate_model_id
    ) || labour_rate_models[0]
  );
}

export function get_selected_source_charge_out_rate({
  active_model,
  selected_labour_source,
  is_all_productive_summary,
  weighted_summary,
  get_source_charge_out_rate,
}) {
  if (is_all_productive_summary) {
    return weighted_summary.weighted_current_charge_out_rate;
  }

  return get_source_charge_out_rate(active_model, selected_labour_source);
}

export function build_active_labour_rate_model_for_calculation({
  active_model,
  selected_labour_source,
  selected_source_charge_out_rate,
}) {
  if (!active_model) {
    return {};
  }

  if (!selected_labour_source) {
    return {
      ...active_model,
      labour_unit_label: LABOUR_UNIT_LABEL,
      productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
      recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,
    };
  }

  return {
    ...active_model,
    current_charge_out_rate: selected_source_charge_out_rate,
    labour_unit_label: LABOUR_UNIT_LABEL,
    productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
    recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,

    labour_cost_rate: selected_labour_source.labour_cost_rate,
    labour_source_type_id: selected_labour_source.labour_source_type_id,
    labour_source_type_name: selected_labour_source.labour_source_type_name,
    labour_source_kind: selected_labour_source.labour_source_kind,
    labour_group_name: selected_labour_source.labour_source_type_name,

    pnl_implied_recovered_rate:
      selected_labour_source.pnl_implied_recovered_rate,
    pnl_recovery_gap_to_cost_rate:
      selected_labour_source.pnl_recovery_gap_to_cost_rate,

    non_productive_labour_pressure_rate:
      selected_labour_source.non_productive_labour_pressure_rate,
    non_productive_labour_recovery_rate:
      selected_labour_source.non_productive_labour_recovery_rate,
    allocated_business_overhead_recovery_rate:
      selected_labour_source.allocated_business_overhead_recovery_rate,
    minimum_recoverable_charge_out_rate:
      selected_labour_source.minimum_recoverable_charge_out_rate,
    fully_loaded_labour_rate: selected_labour_source.fully_loaded_labour_rate,
  };
}

export function build_labour_rate_result_metrics({
  result = {},
  selected_labour_source,
}) {
  const current_charge_out_rate = Number(result.current_charge_out_rate || 0);

  const effective_labour_cost_rate = Number(
    result.effective_labour_cost_rate || result.labour_cost_rate || 0
  );

  const minimum_recoverable_charge_out_rate = Number(
    selected_labour_source?.minimum_recoverable_charge_out_rate || 0
  );

  const current_rate_gap_to_minimum =
    current_charge_out_rate - minimum_recoverable_charge_out_rate;

  const current_rate_above_minimum = current_rate_gap_to_minimum >= 0;

  const current_margin_after_recovery_percent =
    current_charge_out_rate > 0
      ? (current_rate_gap_to_minimum / current_charge_out_rate) * 100
      : 0;

  return {
    current_charge_out_rate,
    effective_labour_cost_rate,
    minimum_recoverable_charge_out_rate,
    current_rate_gap_to_minimum,
    current_rate_above_minimum,
    current_margin_after_recovery_percent,
  };
}

export function build_new_labour_rate_model_payload({
  first_source,
  saved_labour_source_rates = {},
}) {
  return {
    labour_rate_model_name: "New Labour Rate",
    labour_source_type_id:
      first_source?.labour_source_type_id || "all_productive",
    labour_source_type_name:
      first_source?.labour_source_type_name ||
      "All productive labour weighted rate",
    labour_source_kind: first_source?.labour_source_kind || "all_productive",
    labour_group_name:
      first_source?.labour_source_type_name ||
      "All productive labour weighted rate",
    labour_cost_rate: first_source?.labour_cost_rate || 45,
    current_charge_out_rate: 0,
    charge_out_rates_by_labour_source: saved_labour_source_rates,
    labour_unit_label: LABOUR_UNIT_LABEL,

    pnl_implied_recovered_rate: first_source?.pnl_implied_recovered_rate || 0,
    pnl_recovery_gap_to_cost_rate:
      first_source?.pnl_recovery_gap_to_cost_rate || 0,

    non_productive_labour_pressure_rate:
      first_source?.non_productive_labour_pressure_rate || 0,
    non_productive_labour_recovery_rate:
      first_source?.non_productive_labour_recovery_rate || 0,
    allocated_business_overhead_recovery_rate:
      first_source?.allocated_business_overhead_recovery_rate || 0,
    minimum_recoverable_charge_out_rate:
      first_source?.minimum_recoverable_charge_out_rate || 0,
    fully_loaded_labour_rate: first_source?.fully_loaded_labour_rate || 0,

    productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
    recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,
  };
}

export function build_duplicated_labour_rate_model_payload({
  active_model,
  get_rate_map,
}) {
  return {
    ...active_model,
    charge_out_rates_by_labour_source: {
      ...get_rate_map(active_model),
    },
    labour_unit_label: LABOUR_UNIT_LABEL,
    productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
    recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,
    labour_rate_model_id: crypto.randomUUID(),
    labour_rate_model_name: `${active_model.labour_rate_model_name} Copy`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}