"use client";

import { useEffect, useMemo, useState } from "react";

import useLabour from "@/hooks/useLabour";
import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import RateBuilderPnlLabourBenchmarkCard from "@/components/rate-builder/RateBuilderPnlLabourBenchmarkCard";

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

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_nested_value(source, paths) {
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

function extract_labour_output(labour) {
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

function build_labour_source_options(labour_output) {
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
  const total_productive_labour_hours = to_number(
    labour_output?.total_productive_labour_hours
  );

  const labour_status =
    labour_output?.labour_status ||
    labour_output?.labour_model_trust_state ||
    "ready";

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
      total_productive_labour_cost,
      total_productive_labour_hours,
      rate_status: labour_status,
      source: "labour",
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
      total_productive_labour_cost,
      total_productive_labour_hours,
      staff_count: rate.staff_count,
      total_annual_cost: rate.total_annual_cost,
      total_productive_hours: rate.total_productive_hours,
      productive_share_percent: rate.productive_share_percent,
      rate_status: rate.rate_status,
      source: rate.source || "labour",
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
      total_productive_labour_cost: 0,
      total_productive_labour_hours: 0,
      rate_status: "preview_only",
      source: "rate_builder",
    });
  }

  return options;
}

function get_selected_labour_source(labour_source_options, active_model) {
  const selected_source = labour_source_options.find(
    (option) =>
      option.labour_source_type_id === active_model?.labour_source_type_id
  );

  return selected_source || labour_source_options[0] || null;
}

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
      return active_model;
    }

    return {
      ...active_model,
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
          pnl_implied_recovered_rate:
            selected_source.pnl_implied_recovered_rate,
          pnl_recovery_gap_to_cost_rate:
            selected_source.pnl_recovery_gap_to_cost_rate,
          productive_efficiency_percent: 100,
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
      pnl_implied_recovered_rate:
        first_source?.pnl_implied_recovered_rate || 0,
      pnl_recovery_gap_to_cost_rate:
        first_source?.pnl_recovery_gap_to_cost_rate || 0,
      productive_efficiency_percent: 100,
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
            Use Labour source rates as the starting point, then test the
            customer charge-out rate, target margin, and rate gap.
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
                  <label className="ui-label" htmlFor="labour_source_rate">
                    Source labour rate
                  </label>
                  <input
                    id="labour_source_rate"
                    className="ui-readonly"
                    value={format_rate(
                      result.labour_cost_rate,
                      active_model.labour_unit_label
                    )}
                    readOnly
                  />
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor="labour_unit_label">
                    Charge unit
                  </label>
                  <input
                    id="labour_unit_label"
                    className="ui-input"
                    value={active_model.labour_unit_label}
                    onChange={(event) =>
                      update_active_model(
                        "labour_unit_label",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="ui-field">
                  <label
                    className="ui-label"
                    htmlFor="productive_efficiency_percent"
                  >
                    Productive efficiency %
                  </label>
                  <input
                    id="productive_efficiency_percent"
                    className="ui-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={active_model.productive_efficiency_percent}
                    onChange={(event) =>
                      update_active_model(
                        "productive_efficiency_percent",
                        event.target.value
                      )
                    }
                  />
                  <p className="ui-help">
                    Keep this at 100% when using Labour’s weighted productive
                    staff type rate.
                  </p>
                </div>

                <div className="ui-field">
                  <label
                    className="ui-label"
                    htmlFor="recovery_allowance_rate"
                  >
                    Recovery allowance per unit
                  </label>
                  <input
                    id="recovery_allowance_rate"
                    className="ui-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={active_model.recovery_allowance_rate}
                    onChange={(event) =>
                      update_active_model(
                        "recovery_allowance_rate",
                        event.target.value
                      )
                    }
                  />
                  <p className="ui-help">
                    Optional top-up for overhead, admin, plant support, or other
                    recovery pressure.
                  </p>
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor="target_margin_percent">
                    Target margin %
                  </label>
                  <input
                    id="target_margin_percent"
                    className="ui-input"
                    type="number"
                    min="0"
                    max="99"
                    step="0.01"
                    value={active_model.target_margin_percent}
                    onChange={(event) =>
                      update_active_model(
                        "target_margin_percent",
                        event.target.value
                      )
                    }
                  />
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
                </div>
              </div>
            </div>
          </div>

          <aside className="rate-builder-labour__right">
            <div className="rate-builder-effective-card">
              <p className="rate-builder-effective-label">
                Suggested charge-out rate
              </p>
              <p className="rate-builder-effective-value">
                {format_rate(
                  result.suggested_charge_out_rate,
                  active_model.labour_unit_label
                )}
              </p>
              <p className="ui-help">
                Based on Labour source rate, recovery allowance, and target
                margin.
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Current charge-out rate
              </p>
              <p className="rate-builder-result-value">
                {format_rate(
                  result.current_charge_out_rate,
                  active_model.labour_unit_label
                )}
              </p>
            </div>

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

            <RateBuilderPnlLabourBenchmarkCard
              selected_labour_source={selected_labour_source}
              result={result}
              labour_unit_label={active_model.labour_unit_label}
            />

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Effective labour cost
              </p>
              <p className="rate-builder-result-value">
                {format_rate(
                  result.effective_labour_cost_rate,
                  active_model.labour_unit_label
                )}
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Cost after recovery allowance
              </p>
              <p className="rate-builder-result-value">
                {format_rate(
                  result.cost_with_recovery,
                  active_model.labour_unit_label
                )}
              </p>
            </div>

            <div
              className={
                result.above_target
                  ? "rate-builder-status-card rate-builder-status-card--good"
                  : "rate-builder-status-card rate-builder-status-card--bad"
              }
            >
              <p className="rate-builder-result-label">Rate position</p>
              <p className="rate-builder-result-value">
                {result.above_target ? "Above target" : "Below target"}
              </p>
              <p className="ui-help">
                Gap: {format_currency(result.rate_gap)} /{" "}
                {active_model.labour_unit_label}
              </p>
            </div>

            <div className="rate-builder-labour-breakdown">
              <div className="rate-builder-labour-breakdown__row">
                <span>Target margin</span>
                <strong>{format_percent(result.target_margin_percent)}</strong>
              </div>

              <div className="rate-builder-labour-breakdown__row">
                <span>Current margin</span>
                <strong>{format_percent(result.current_margin_percent)}</strong>
              </div>

              <div className="rate-builder-labour-breakdown__row">
                <span>Profit per unit</span>
                <strong>
                  {format_rate(
                    result.profit_per_hour,
                    active_model.labour_unit_label
                  )}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}