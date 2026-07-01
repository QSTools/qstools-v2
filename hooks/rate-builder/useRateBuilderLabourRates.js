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

import { calculate_labour_rate_result } from "@/lib/calculations/rateBuilderLabourRateCalculations";

import {
  create_labour_rate_model,
  load_labour_rate_models,
  save_labour_rate_models,
} from "@/lib/storage/rateBuilderLabourRatesStorage";

import {
  readRateBuilderLabourSourceRates,
  saveRateBuilderLabourSourceRate,
} from "@/lib/storage/rateBuilderLabourSourceRatesStorage";

export const LABOUR_UNIT_LABEL = "hr";
const PRODUCTIVE_EFFICIENCY_PERCENT = 100;
const RECOVERY_ALLOWANCE_RATE = 0;

export function useRateBuilderLabourRates() {
  const labour = useLabour();
  const cost_allocation = useCostAllocation();

  const cost_allocation_output_contract = {
    ...(cost_allocation?.output_contract ?? {}),
    recovery_plan: cost_allocation?.card?.recovery_plan ?? {},
    card: cost_allocation?.card ?? {},
  };

  const [labour_rate_models, set_labour_rate_models] = useState([]);
  const [active_labour_rate_model_id, set_active_labour_rate_model_id] =
    useState(null);
  const [labour_source_rate_save_status, set_labour_source_rate_save_status] =
    useState("");

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

    const normalised_models = loaded_models.map((model) => ({
      ...model,
      charge_out_rates_by_labour_source: {
        ...get_rate_map(model),
        ...saved_labour_source_rates,
      },
    }));

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
    return (
      labour_rate_models.find(
        (model) =>
          model.labour_rate_model_id === active_labour_rate_model_id
      ) || labour_rate_models[0]
    );
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
    if (is_all_productive_summary) {
      return weighted_summary.weighted_current_charge_out_rate;
    }

    return get_source_charge_out_rate(active_model, selected_labour_source);
  }, [
    active_model,
    selected_labour_source,
    is_all_productive_summary,
    weighted_summary.weighted_current_charge_out_rate,
  ]);

  const active_model_for_calculation = useMemo(() => {
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
      fully_loaded_labour_rate:
        selected_labour_source.fully_loaded_labour_rate,
    };
  }, [active_model, selected_labour_source, selected_source_charge_out_rate]);

  const result = useMemo(() => {
    return calculate_labour_rate_result(active_model_for_calculation || {});
  }, [active_model_for_calculation]);

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

  function update_active_model(field_name, value) {
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

  function update_source_charge_out_rate(value) {
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

  function save_selected_labour_source_charge_out_rate() {
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

  function handle_labour_source_change(labour_source_type_id) {
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

  function handle_new_model() {
    const first_source = labour_source_options[0];

    const new_model = create_labour_rate_model({
      labour_rate_model_name: "New Labour Rate",
      labour_source_type_id:
        first_source?.labour_source_type_id || "all_productive",
      labour_source_type_name:
        first_source?.labour_source_type_name ||
        "All productive labour weighted rate",
      labour_source_kind:
        first_source?.labour_source_kind || "all_productive",
      labour_group_name:
        first_source?.labour_source_type_name ||
        "All productive labour weighted rate",
      labour_cost_rate: first_source?.labour_cost_rate || 45,
      current_charge_out_rate: 0,
      charge_out_rates_by_labour_source: readRateBuilderLabourSourceRates(),
      labour_unit_label: LABOUR_UNIT_LABEL,

      pnl_implied_recovered_rate:
        first_source?.pnl_implied_recovered_rate || 0,
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
    });

    set_labour_rate_models((current_models) => [
      ...current_models,
      new_model,
    ]);

    set_active_labour_rate_model_id(new_model.labour_rate_model_id);
  }

  function handle_duplicate_model() {
    if (!active_model) {
      return;
    }

    const duplicated_model = create_labour_rate_model({
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
    });

    set_labour_rate_models((current_models) => [
      ...current_models,
      duplicated_model,
    ]);

    set_active_labour_rate_model_id(duplicated_model.labour_rate_model_id);
  }

  function handle_delete_model() {
    if (!active_model || labour_rate_models.length <= 1) {
      return;
    }

    const remaining_models = labour_rate_models.filter(
      (model) =>
        model.labour_rate_model_id !== active_model.labour_rate_model_id
    );

    set_labour_rate_models(remaining_models);
    set_active_labour_rate_model_id(
      remaining_models[0]?.labour_rate_model_id || null
    );
  }

  return {
    labour_rate_models,
    active_labour_rate_model_id,
    active_model,
    selected_labour_source,
    labour_source_options,
    weighted_summary,
    result,

    current_charge_out_rate,
    effective_labour_cost_rate,
    minimum_recoverable_charge_out_rate,
    current_rate_gap_to_minimum,
    current_rate_above_minimum,
    current_margin_after_recovery_percent,
    is_all_productive_summary,
    selected_source_charge_out_rate,
    labour_source_rate_save_status,
    labour_unit_label: LABOUR_UNIT_LABEL,

    actions: {
      set_active_labour_rate_model_id,
      update_active_model,
      update_source_charge_out_rate,
      save_selected_labour_source_charge_out_rate,
      handle_labour_source_change,
      handle_new_model,
      handle_duplicate_model,
      handle_delete_model,
    },
  };
}