"use client";

import { useEffect, useMemo, useState } from "react";

import useLabour from "@/hooks/useLabour";
import useCostAllocation from "@/hooks/useCostAllocation";

import {
  build_labour_source_options,
  extract_labour_output,
  get_selected_labour_source,
} from "@/lib/selectors/rate-builder/rateBuilderLabourSourceSelectors";

import {
  calculate_weighted_summary_charge_out_rate,
  get_rate_map,
  get_source_charge_out_rate,
} from "@/lib/selectors/rate-builder/rateBuilderLabourRateSummarySelectors";

import {
  LABOUR_UNIT_LABEL,
  build_active_labour_rate_model_for_calculation,
  build_cost_allocation_output_contract,
  build_labour_rate_result_metrics,
  get_active_labour_rate_model,
  get_selected_source_charge_out_rate,
  normalise_loaded_labour_rate_models,
} from "@/lib/selectors/rate-builder/rateBuilderLabourModelSelectors";

import {
  add_new_labour_rate_model,
  change_labour_source,
  delete_labour_rate_model,
  duplicate_labour_rate_model,
  save_selected_labour_source_charge_out_rate,
  update_active_labour_rate_model,
  update_labour_source_charge_out_rate,
} from "@/lib/actions/rate-builder/rateBuilderLabourRateModelActions";

import { calculate_labour_rate_result } from "@/lib/calculations/rateBuilderLabourRateCalculations";

import {
  load_labour_rate_models,
  save_labour_rate_models,
} from "@/lib/storage/rateBuilderLabourRatesStorage";

import { readRateBuilderLabourSourceRates } from "@/lib/storage/rateBuilderLabourSourceRatesStorage";

export function useRateBuilderLabourRates() {
  const labour = useLabour();
  const cost_allocation = useCostAllocation();

  const [labour_rate_models, set_labour_rate_models] = useState([]);
  const [active_labour_rate_model_id, set_active_labour_rate_model_id] =
    useState(null);
  const [labour_source_rate_save_status, set_labour_source_rate_save_status] =
    useState("");

  const cost_allocation_output_contract = useMemo(() => {
    return build_cost_allocation_output_contract(cost_allocation);
  }, [cost_allocation]);

  const labour_output = useMemo(() => {
    return extract_labour_output(labour);
  }, [labour]);

  const labour_source_options = useMemo(() => {
    return build_labour_source_options(
      labour_output,
      cost_allocation_output_contract
    );
  }, [labour_output, cost_allocation_output_contract]);

  useEffect(() => {
    const saved_labour_source_rates = readRateBuilderLabourSourceRates();
    const loaded_models = load_labour_rate_models();

    const normalised_models = normalise_loaded_labour_rate_models({
      loaded_models,
      saved_labour_source_rates,
      get_rate_map,
    });

    set_labour_rate_models(normalised_models);
    set_active_labour_rate_model_id(
      normalised_models[0]?.labour_rate_model_id || null
    );
  }, []);

  useEffect(() => {
    if (labour_rate_models.length > 0) {
      save_labour_rate_models(labour_rate_models);
    }
  }, [labour_rate_models]);

  const active_model = useMemo(() => {
    return get_active_labour_rate_model({
      labour_rate_models,
      active_labour_rate_model_id,
    });
  }, [labour_rate_models, active_labour_rate_model_id]);

  const selected_labour_source = useMemo(() => {
    return get_selected_labour_source(labour_source_options, active_model);
  }, [labour_source_options, active_model]);

  const is_all_productive_summary =
    selected_labour_source?.labour_source_kind === "all_productive";

  const weighted_summary = useMemo(() => {
    return calculate_weighted_summary_charge_out_rate({
      labour_source_options,
      active_model,
    });
  }, [labour_source_options, active_model]);

  const selected_source_charge_out_rate = useMemo(() => {
    return get_selected_source_charge_out_rate({
      active_model,
      selected_labour_source,
      is_all_productive_summary,
      weighted_summary,
      get_source_charge_out_rate,
    });
  }, [
    active_model,
    selected_labour_source,
    is_all_productive_summary,
    weighted_summary,
  ]);

  const active_model_for_calculation = useMemo(() => {
    return build_active_labour_rate_model_for_calculation({
      active_model,
      selected_labour_source,
      selected_source_charge_out_rate,
    });
  }, [active_model, selected_labour_source, selected_source_charge_out_rate]);

  const result = useMemo(() => {
    return calculate_labour_rate_result(active_model_for_calculation || {});
  }, [active_model_for_calculation]);

  const result_metrics = useMemo(() => {
    return build_labour_rate_result_metrics({
      result,
      selected_labour_source,
    });
  }, [result, selected_labour_source]);

  function handle_update_active_model(field_name, value) {
    update_active_labour_rate_model({
      active_model,
      set_labour_rate_models,
      field_name,
      value,
    });
  }

  function handle_update_source_charge_out_rate(value) {
    update_labour_source_charge_out_rate({
      active_model,
      selected_labour_source,
      is_all_productive_summary,
      set_labour_rate_models,
      set_labour_source_rate_save_status,
      value,
    });
  }

  function handle_save_selected_labour_source_charge_out_rate() {
    save_selected_labour_source_charge_out_rate({
      active_model,
      selected_labour_source,
      selected_source_charge_out_rate,
      is_all_productive_summary,
      set_labour_rate_models,
      set_labour_source_rate_save_status,
    });
  }

  function handle_labour_source_change(labour_source_type_id) {
    change_labour_source({
      active_model,
      labour_source_options,
      set_labour_rate_models,
      set_labour_source_rate_save_status,
      labour_source_type_id,
    });
  }

  function handle_new_model() {
    add_new_labour_rate_model({
      labour_source_options,
      set_labour_rate_models,
      set_active_labour_rate_model_id,
    });
  }

  function handle_duplicate_model() {
    duplicate_labour_rate_model({
      active_model,
      set_labour_rate_models,
      set_active_labour_rate_model_id,
    });
  }

  function handle_delete_model() {
    delete_labour_rate_model({
      active_model,
      labour_rate_models,
      set_labour_rate_models,
      set_active_labour_rate_model_id,
    });
  }

  return {
    labour_rate_models,
    active_labour_rate_model_id,
    active_model,
    selected_labour_source,
    labour_source_options,
    weighted_summary,
    result,

    ...result_metrics,

    is_all_productive_summary,
    selected_source_charge_out_rate,
    labour_source_rate_save_status,
    labour_unit_label: LABOUR_UNIT_LABEL,

    actions: {
      set_active_labour_rate_model_id,
      update_active_model: handle_update_active_model,
      update_source_charge_out_rate: handle_update_source_charge_out_rate,
      save_selected_labour_source_charge_out_rate:
        handle_save_selected_labour_source_charge_out_rate,
      handle_labour_source_change,
      handle_new_model,
      handle_duplicate_model,
      handle_delete_model,
    },
  };
}