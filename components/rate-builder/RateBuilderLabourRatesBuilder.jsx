"use client";

import { useEffect, useMemo, useState } from "react";

import useLabour from "@/hooks/useLabour";
import useCostAllocation from "@/hooks/useCostAllocation";

import RateBuilderMinimumRecoveryCard from "@/components/rate-builder/RateBuilderMinimumRecoveryCard";

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

import {
  readRateBuilderLabourSourceRates,
  saveRateBuilderLabourSourceRate,
} from "@/lib/storage/rateBuilderLabourSourceRatesStorage";

const LABOUR_UNIT_LABEL = "hr";
const PRODUCTIVE_EFFICIENCY_PERCENT = 100;
const RECOVERY_ALLOWANCE_RATE = 0;

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_rate_map(model = {}) {
  return model?.charge_out_rates_by_labour_source &&
    typeof model.charge_out_rates_by_labour_source === "object"
    ? model.charge_out_rates_by_labour_source
    : {};
}

function get_source_charge_out_rate(model = {}, source = {}) {
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

function get_staff_type_sources(labour_source_options = []) {
  return labour_source_options.filter(
    (source) => source.labour_source_kind === "staff_type"
  );
}

function calculate_weighted_summary_charge_out_rate({
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

export default function RateBuilderLabourRatesBuilder() {
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
            Enter customer-facing rates by productive staff type. The all
            productive rate is a read-only weighted summary.
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
                    Productive staff type rates are editable. The all productive
                    option is a read-only weighted summary.
                  </p>
                </div>

                <div className="ui-field">
                  <label
                    className="ui-label"
                    htmlFor="current_charge_out_rate"
                  >
                    {is_all_productive_summary
                      ? "Weighted current charge-out rate"
                      : "Current charge-out rate"}
                  </label>
                  <input
                    id="current_charge_out_rate"
                    className="ui-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      is_all_productive_summary
                        ? Number(current_charge_out_rate.toFixed(2))
                        : selected_source_charge_out_rate
                    }
                    disabled={is_all_productive_summary}
                    onChange={(event) =>
                      update_source_charge_out_rate(event.target.value)
                    }
                  />
                  <p className="ui-help">
                    {is_all_productive_summary
                      ? "This is derived from the individual staff-type charge-out rates weighted by productive hours."
                      : "Enter the hourly labour rate the business currently charges or intends to charge for this staff type."}
                  </p>
                </div>

                {!is_all_productive_summary ? (
                  <div className="ui-actions">
                    <button
                      type="button"
                      className="ui-button-primary"
                      onClick={save_selected_labour_source_charge_out_rate}
                    >
                      Save rate
                    </button>

                    {labour_source_rate_save_status ? (
                      <span className="ui-help">
                        {labour_source_rate_save_status}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="rate-builder-labour__right">
            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                {is_all_productive_summary
                  ? "Overall productive labour summary"
                  : "Labour source"}
              </p>
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
                {is_all_productive_summary
                  ? "Weighted current charge-out rate"
                  : "Current charge-out rate"}
              </p>
              <p className="rate-builder-result-value">
                {format_rate(current_charge_out_rate, LABOUR_UNIT_LABEL)}
              </p>
              {is_all_productive_summary ? (
                <p className="ui-help">
                  Derived from saved staff-type charge-out rates.{" "}
                  {weighted_summary.missing_rate_count > 0
                    ? `${weighted_summary.missing_rate_count} staff type rate(s) are missing.`
                    : "All productive staff-type rates are included."}
                </p>
              ) : null}
            </div>

            <RateBuilderMinimumRecoveryCard
              selected_labour_source={selected_labour_source}
              labour_unit_label={LABOUR_UNIT_LABEL}
            />

            <div
              className={
                current_rate_above_minimum
                  ? "rate-builder-status-card rate-builder-status-card--good"
                  : "rate-builder-status-card rate-builder-status-card--bad"
              }
            >
              <p className="rate-builder-result-label">
                {is_all_productive_summary
                  ? "Weighted rate vs minimum recoverable rate"
                  : "Current rate vs minimum recoverable rate"}
              </p>

              <p className="rate-builder-result-value">
                {current_rate_above_minimum ? "Above minimum" : "Below minimum"}
              </p>

              <p className="ui-help">
                {current_rate_above_minimum
                  ? `Surplus: ${format_currency(
                      current_rate_gap_to_minimum
                    )} / ${LABOUR_UNIT_LABEL}`
                  : `Leak: ${format_currency(
                      Math.abs(current_rate_gap_to_minimum)
                    )} / ${LABOUR_UNIT_LABEL}`}
              </p>

              <div className="rate-builder-labour-breakdown">
                <div className="rate-builder-labour-breakdown__row">
                  <span>Labour-only cost</span>
                  <strong>
                    {format_rate(
                      effective_labour_cost_rate,
                      LABOUR_UNIT_LABEL
                    )}
                  </strong>
                </div>

                <div className="rate-builder-labour-breakdown__row">
                  <span>Margin after full recovery</span>
                  <strong>
                    {format_percent(current_margin_after_recovery_percent)}
                  </strong>
                </div>
              </div>
            </div>

            {is_all_productive_summary ? (
              <div className="rate-builder-result-card">
                <p className="rate-builder-result-label">
                  Staff-type rate build-up
                </p>

                <div className="rate-builder-labour-breakdown">
                  {weighted_summary.weighted_summary_rows.map((row) => (
                    <div
                      className="rate-builder-labour-breakdown__row"
                      key={row.labour_source_type_id}
                    >
                      <span>
                        {row.labour_source_type_name}
                        <br />
                        <small>
                          {row.productive_hours.toFixed(2)} hrs ×{" "}
                          {format_rate(
                            row.current_charge_out_rate,
                            LABOUR_UNIT_LABEL
                          )}
                        </small>
                      </span>
                      <strong>
                        {format_currency(row.modelled_labour_revenue)}
                      </strong>
                    </div>
                  ))}

                  <div className="rate-builder-labour-breakdown__row">
                    <span>Total modelled productive labour revenue</span>
                    <strong>
                      {format_currency(
                        weighted_summary.weighted_modelled_labour_revenue
                      )}
                    </strong>
                  </div>

                  <div className="rate-builder-labour-breakdown__row">
                    <span>Total productive labour hours</span>
                    <strong>
                      {weighted_summary.weighted_productive_hours.toFixed(2)} hrs
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}