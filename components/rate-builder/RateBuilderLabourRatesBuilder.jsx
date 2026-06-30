"use client";

import { useEffect, useMemo, useState } from "react";

import useLabour from "@/hooks/useLabour";
import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import RateBuilderPnlLabourBenchmarkCard from "@/components/rate-builder/RateBuilderPnlLabourBenchmarkCard";

import {
  build_labour_source_options,
  extract_labour_output,
  get_selected_labour_source,
} from "@/lib/selectors/rate-builder/rateBuilderLabourSourceSelectors";

import {
  calculate_labour_rate_result,
  format_currency,
  format_percent,
  format_rate,
} from "@/lib/calculations/rateBuilderLabourRateCalculations";

import {
  create_labour_rate_model,
  load_labour_rate_models,
  save_labour_rate_models,
} from "@/lib/storage/rateBuilderLabourRatesStorage";

const LABOUR_UNIT_LABEL = "hr";
const PRODUCTIVE_EFFICIENCY_PERCENT = 100;
const RECOVERY_ALLOWANCE_RATE = 0;

export default function RateBuilderLabourRatesBuilder() {
  const profit_and_loss = useProfitAndLoss();
  const general_overheads = useGeneralOverheads();

  const pnl_output_contract = profit_and_loss?.output_contract ?? {};
  const general_overheads_output_contract =
    general_overheads?.output_contract ?? {};

  const pnl_recovery_inputs = useMemo(() => {
    return {
      revenue:
        pnl_output_contract.total_revenue ??
        pnl_output_contract.total_trading_income ??
        0,

      cog:
        pnl_output_contract.total_cogs ??
        pnl_output_contract.total_direct_costs ??
        pnl_output_contract.total_cost_of_sales ??
        0,

      net_profit: pnl_output_contract.net_profit ?? 0,

      non_labour_overheads:
        general_overheads_output_contract.total_general_overheads ??
        pnl_output_contract.general_overheads_benchmark_total ??
        0,
    };
  }, [
    pnl_output_contract.total_revenue,
    pnl_output_contract.total_trading_income,
    pnl_output_contract.total_cogs,
    pnl_output_contract.total_direct_costs,
    pnl_output_contract.total_cost_of_sales,
    pnl_output_contract.net_profit,
    pnl_output_contract.general_overheads_benchmark_total,
    general_overheads_output_contract.total_general_overheads,
  ]);

  const labour = useLabour({
    pnl_recovery_inputs,
  });

  const [labour_rate_models, set_labour_rate_models] = useState([]);
  const [active_labour_rate_model_id, set_active_labour_rate_model_id] =
    useState(null);

  const labour_output = useMemo(() => {
    return extract_labour_output(labour);
  }, [labour]);

  const labour_source_options = useMemo(() => {
    return build_labour_source_options(labour_output);
  }, [labour_output]);

  useEffect(() => {
    const loaded_models = load_labour_rate_models();
    set_labour_rate_models(loaded_models);
    set_active_labour_rate_model_id(
      loaded_models[0]?.labour_rate_model_id || null
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
    };
  }, [active_model, selected_labour_source]);

  const result = useMemo(() => {
    return calculate_labour_rate_result(active_model_for_calculation || {});
  }, [active_model_for_calculation]);

  const current_charge_out_rate = Number(result.current_charge_out_rate || 0);
  const effective_labour_cost_rate = Number(
    result.effective_labour_cost_rate || result.labour_cost_rate || 0
  );
  const current_rate_gap_to_cost =
    current_charge_out_rate - effective_labour_cost_rate;
  const current_rate_above_cost = current_rate_gap_to_cost >= 0;

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

  function handle_labour_source_change(labour_source_type_id) {
    const selected_source = labour_source_options.find(
      (option) => option.labour_source_type_id === labour_source_type_id
    );

    if (!selected_source || !active_model) {
      return;
    }

    set_labour_rate_models((current_models) =>
      current_models.map((model) => {
        if (model.labour_rate_model_id !== active_model.labour_rate_model_id) {
          return model;
        }

        return {
          ...model,
          labour_source_type_id: selected_source.labour_source_type_id,
          labour_source_type_name: selected_source.labour_source_type_name,
          labour_source_kind: selected_source.labour_source_kind,
          labour_group_name: selected_source.labour_source_type_name,
          labour_cost_rate: selected_source.labour_cost_rate,
          labour_unit_label: LABOUR_UNIT_LABEL,
          pnl_implied_recovered_rate:
            selected_source.pnl_implied_recovered_rate,
          pnl_recovery_gap_to_cost_rate:
            selected_source.pnl_recovery_gap_to_cost_rate,
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
      labour_unit_label: LABOUR_UNIT_LABEL,
      pnl_implied_recovered_rate:
        first_source?.pnl_implied_recovered_rate || 0,
      pnl_recovery_gap_to_cost_rate:
        first_source?.pnl_recovery_gap_to_cost_rate || 0,
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

  if (!active_model) {
    return (
      <section className="ui-section">
        <p className="ui-help">Loading labour rate builder…</p>
      </section>
    );
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Labour Rates Builder</p>
          <h2 className="ui-section-title">
            Build customer-facing labour charge-out rates.
          </h2>
          <p className="ui-help">
            Select the Labour source, enter the current charge-out rate, and
            compare it against true cost and P&amp;L recovery.
          </p>
        </div>

        <div className="rate-builder-labour">
          <div className="rate-builder-labour__left">
            <div className="ui-panel">
              <div className="ui-stack">
                <div>
                  <p className="ui-kicker">Saved rate models</p>
                  <h3 className="ui-section-title">Labour rate setup</h3>
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor="labour_rate_model_select">
                    Saved calculator
                  </label>
                  <select
                    id="labour_rate_model_select"
                    className="ui-select"
                    value={active_model.labour_rate_model_id}
                    onChange={(event) =>
                      set_active_labour_rate_model_id(event.target.value)
                    }
                  >
                    {labour_rate_models.map((model) => (
                      <option
                        key={model.labour_rate_model_id}
                        value={model.labour_rate_model_id}
                      >
                        {model.labour_rate_model_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-primary"
                    onClick={handle_new_model}
                  >
                    New rate
                  </button>

                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={handle_duplicate_model}
                  >
                    Duplicate
                  </button>

                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={handle_delete_model}
                    disabled={labour_rate_models.length <= 1}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div className="ui-panel">
              <div className="ui-stack">
                <div>
                  <p className="ui-kicker">Input</p>
                  <h3 className="ui-section-title">Rate assumptions</h3>
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor="labour_rate_model_name">
                    Calculator name
                  </label>
                  <input
                    id="labour_rate_model_name"
                    className="ui-input"
                    value={active_model.labour_rate_model_name}
                    onChange={(event) =>
                      update_active_model(
                        "labour_rate_model_name",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor="labour_source_type_id">
                    Labour source
                  </label>
                  <select
                    id="labour_source_type_id"
                    className="ui-select"
                    value={
                      selected_labour_source?.labour_source_type_id ||
                      active_model.labour_source_type_id ||
                      "all_productive"
                    }
                    onChange={(event) =>
                      handle_labour_source_change(event.target.value)
                    }
                  >
                    {labour_source_options.map((option) => (
                      <option
                        key={option.labour_source_type_id}
                        value={option.labour_source_type_id}
                      >
                        {option.labour_source_type_name}
                      </option>
                    ))}
                  </select>
                  <p className="ui-help">
                    Pulled from Labour productive staff type rates.
                  </p>
                </div>

                <div className="ui-field">
                  <label
                    className="ui-label"
                    htmlFor="current_charge_out_rate"
                  >
                    Current charge-out rate
                  </label>
                  <input
                    id="current_charge_out_rate"
                    className="ui-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={active_model.current_charge_out_rate}
                    onChange={(event) =>
                      update_active_model(
                        "current_charge_out_rate",
                        event.target.value
                      )
                    }
                  />
                  <p className="ui-help">
                    Enter the hourly labour rate the business currently charges
                    or intends to charge.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rate-builder-labour__right">
            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">Labour source</p>
              <p className="rate-builder-result-value">
                {selected_labour_source?.labour_source_type_name ||
                  active_model.labour_source_type_name ||
                  "Labour source"}
              </p>
              <p className="ui-help">
                Status:{" "}
                {selected_labour_source?.rate_status ||
                  active_model.rate_status ||
                  "ready"}
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Current charge-out rate
              </p>
              <p className="rate-builder-result-value">
                {format_rate(current_charge_out_rate, LABOUR_UNIT_LABEL)}
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                True productive labour cost
              </p>
              <p className="rate-builder-result-value">
                {format_rate(effective_labour_cost_rate, LABOUR_UNIT_LABEL)}
              </p>
              <p className="ui-help">
                Pulled from Labour after wages, employer costs, paid leave, and
                productivity have already been accounted for.
              </p>
            </div>

            <div
              className={
                current_rate_above_cost
                  ? "rate-builder-status-card rate-builder-status-card--good"
                  : "rate-builder-status-card rate-builder-status-card--bad"
              }
            >
              <p className="rate-builder-result-label">
                Current rate vs labour cost
              </p>
              <p className="rate-builder-result-value">
                {current_rate_above_cost
                  ? "Above labour cost"
                  : "Below labour cost"}
              </p>
              <p className="ui-help">
                {current_rate_above_cost
                  ? `Surplus: ${format_currency(
                      current_rate_gap_to_cost
                    )} / ${LABOUR_UNIT_LABEL}`
                  : `Leak: ${format_currency(
                      Math.abs(current_rate_gap_to_cost)
                    )} / ${LABOUR_UNIT_LABEL}`}
              </p>

              <div className="rate-builder-labour-breakdown">
                <div className="rate-builder-labour-breakdown__row">
                  <span>Current margin</span>
                  <strong>{format_percent(result.current_margin_percent)}</strong>
                </div>
              </div>
            </div>

            <RateBuilderPnlLabourBenchmarkCard
              selected_labour_source={selected_labour_source}
              result={result}
              labour_unit_label={LABOUR_UNIT_LABEL}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}