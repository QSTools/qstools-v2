import {
  LABOUR_UNIT_LABEL,
  PRODUCTIVE_EFFICIENCY_PERCENT,
  RECOVERY_ALLOWANCE_RATE,
  build_duplicated_labour_rate_model_payload,
  build_new_labour_rate_model_payload,
} from "@/lib/selectors/rate-builder/rateBuilderLabourModelSelectors";

import { create_labour_rate_model } from "@/lib/storage/rateBuilderLabourRatesStorage";

import {
  readRateBuilderLabourSourceRates,
  saveRateBuilderLabourSourceRate,
} from "@/lib/storage/rateBuilderLabourSourceRatesStorage";

import {
  get_rate_map,
  get_source_charge_out_rate,
} from "@/lib/selectors/rate-builder/rateBuilderLabourRateSummarySelectors";

export function update_active_labour_rate_model({
  active_model,
  set_labour_rate_models,
  field_name,
  value,
}) {
  if (!active_model) {
    return;
  }

  set_labour_rate_models((current_models) =>
    current_models.map((model) => {
      if (model.labour_rate_model_id !== active_model.labour_rate_model_id) {
        return model;
      }

      return {
        ...model,
        [field_name]: value,
        labour_unit_label: LABOUR_UNIT_LABEL,
        productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
        recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,
        updated_at: new Date().toISOString(),
      };
    })
  );
}

export function update_labour_source_charge_out_rate({
  active_model,
  selected_labour_source,
  is_all_productive_summary,
  set_labour_rate_models,
  set_labour_source_rate_save_status,
  value,
}) {
  if (!active_model || !selected_labour_source || is_all_productive_summary) {
    return;
  }

  set_labour_source_rate_save_status("");

  const source_id = selected_labour_source.labour_source_type_id;

  set_labour_rate_models((current_models) =>
    current_models.map((model) => {
      if (model.labour_rate_model_id !== active_model.labour_rate_model_id) {
        return model;
      }

      const next_rate_map = {
        ...get_rate_map(model),
        [source_id]: Number(value),
      };

      return {
        ...model,
        current_charge_out_rate: Number(value),
        charge_out_rates_by_labour_source: next_rate_map,
        labour_unit_label: LABOUR_UNIT_LABEL,
        productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
        recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,
        updated_at: new Date().toISOString(),
      };
    })
  );
}

export function save_selected_labour_source_charge_out_rate({
  active_model,
  selected_labour_source,
  selected_source_charge_out_rate,
  is_all_productive_summary,
  set_labour_rate_models,
  set_labour_source_rate_save_status,
}) {
  if (!active_model || !selected_labour_source || is_all_productive_summary) {
    return;
  }

  const source_id = selected_labour_source.labour_source_type_id;

  if (!source_id) {
    return;
  }

  const saved_rate = Number(selected_source_charge_out_rate || 0);

  saveRateBuilderLabourSourceRate(source_id, saved_rate);

  set_labour_rate_models((current_models) =>
    current_models.map((model) => {
      if (model.labour_rate_model_id !== active_model.labour_rate_model_id) {
        return model;
      }

      const next_rate_map = {
        ...get_rate_map(model),
        [source_id]: saved_rate,
      };

      return {
        ...model,
        current_charge_out_rate: saved_rate,
        charge_out_rates_by_labour_source: next_rate_map,
        labour_unit_label: LABOUR_UNIT_LABEL,
        productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
        recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,
        updated_at: new Date().toISOString(),
      };
    })
  );

  set_labour_source_rate_save_status("Saved");
}

export function change_labour_source({
  active_model,
  labour_source_options,
  set_labour_rate_models,
  set_labour_source_rate_save_status,
  labour_source_type_id,
}) {
  const selected_source = labour_source_options.find(
    (option) => option.labour_source_type_id === labour_source_type_id
  );

  if (!selected_source || !active_model) {
    return;
  }

  set_labour_source_rate_save_status("");

  set_labour_rate_models((current_models) =>
    current_models.map((model) => {
      if (model.labour_rate_model_id !== active_model.labour_rate_model_id) {
        return model;
      }

      const source_rate = get_source_charge_out_rate(model, selected_source);

      return {
        ...model,
        labour_source_type_id: selected_source.labour_source_type_id,
        labour_source_type_name: selected_source.labour_source_type_name,
        labour_source_kind: selected_source.labour_source_kind,
        labour_group_name: selected_source.labour_source_type_name,
        labour_cost_rate: selected_source.labour_cost_rate,
        current_charge_out_rate:
          selected_source.labour_source_kind === "all_productive"
            ? model.current_charge_out_rate
            : source_rate,
        labour_unit_label: LABOUR_UNIT_LABEL,

        pnl_implied_recovered_rate:
          selected_source.pnl_implied_recovered_rate,
        pnl_recovery_gap_to_cost_rate:
          selected_source.pnl_recovery_gap_to_cost_rate,

        non_productive_labour_pressure_rate:
          selected_source.non_productive_labour_pressure_rate,
        non_productive_labour_recovery_rate:
          selected_source.non_productive_labour_recovery_rate,
        allocated_business_overhead_recovery_rate:
          selected_source.allocated_business_overhead_recovery_rate,
        minimum_recoverable_charge_out_rate:
          selected_source.minimum_recoverable_charge_out_rate,
        fully_loaded_labour_rate: selected_source.fully_loaded_labour_rate,

        charge_out_rates_by_labour_source: get_rate_map(model),
        productive_efficiency_percent: PRODUCTIVE_EFFICIENCY_PERCENT,
        recovery_allowance_rate: RECOVERY_ALLOWANCE_RATE,
        updated_at: new Date().toISOString(),
      };
    })
  );
}

export function add_new_labour_rate_model({
  labour_source_options,
  set_labour_rate_models,
  set_active_labour_rate_model_id,
}) {
  const first_source = labour_source_options[0];

  const new_model = create_labour_rate_model(
    build_new_labour_rate_model_payload({
      first_source,
      saved_labour_source_rates: readRateBuilderLabourSourceRates(),
    })
  );

  set_labour_rate_models((current_models) => [...current_models, new_model]);

  set_active_labour_rate_model_id(new_model.labour_rate_model_id);
}

export function duplicate_labour_rate_model({
  active_model,
  set_labour_rate_models,
  set_active_labour_rate_model_id,
}) {
  if (!active_model) {
    return;
  }

  const duplicated_model = create_labour_rate_model(
    build_duplicated_labour_rate_model_payload({
      active_model,
      get_rate_map,
    })
  );

  set_labour_rate_models((current_models) => [
    ...current_models,
    duplicated_model,
  ]);

  set_active_labour_rate_model_id(duplicated_model.labour_rate_model_id);
}

export function delete_labour_rate_model({
  active_model,
  labour_rate_models,
  set_labour_rate_models,
  set_active_labour_rate_model_id,
}) {
  if (!active_model || labour_rate_models.length <= 1) {
    return;
  }

  const remaining_models = labour_rate_models.filter(
    (model) => model.labour_rate_model_id !== active_model.labour_rate_model_id
  );

  set_labour_rate_models(remaining_models);
  set_active_labour_rate_model_id(
    remaining_models[0]?.labour_rate_model_id || null
  );
}