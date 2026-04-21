"use client";

import { useMemo, useState } from "react";
import runLabourCalculations from "@/lib/calculations/labourScenarioCalculations";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function build_display_rows(result) {
  const live_outputs = result?.live_outputs ?? {};
  const scenario_outputs = result?.scenario_outputs ?? {};
  const deltas = result?.driver_analysis?.deltas ?? {};

  return [
    {
      key: "productive_labour_cost_rate",
      label: "Productive Labour Cost Rate",
      live_value: format_currency(live_outputs.productive_labour_cost_rate),
      scenario_value: format_currency(
        scenario_outputs.productive_labour_cost_rate
      ),
      delta_value: format_currency(
        deltas.productive_labour_cost_rate?.delta ?? 0
      ),
    },
    {
      key: "minimum_charge_out_rate",
      label: "Minimum Charge-Out Rate",
      live_value: format_currency(live_outputs.minimum_charge_out_rate),
      scenario_value: format_currency(
        scenario_outputs.minimum_charge_out_rate
      ),
      delta_value: format_currency(
        deltas.minimum_charge_out_rate?.delta ?? 0
      ),
    },
    {
      key: "profit_per_hour",
      label: "Profit per Hour",
      live_value: format_currency(live_outputs.profit_per_hour),
      scenario_value: format_currency(scenario_outputs.profit_per_hour),
      delta_value: format_currency(deltas.profit_per_hour?.delta ?? 0),
    },
    {
      key: "above_recovery",
      label: "Above Recovery",
      live_value: format_currency(live_outputs.above_recovery),
      scenario_value: format_currency(scenario_outputs.above_recovery),
      delta_value: format_currency(deltas.above_recovery?.delta ?? 0),
    },
  ];
}

export default function ScenarioModelCard({
  labourState = {},
  has_profile = false,
}) {
  const [overrides, setOverrides] = useState({
    labour_rate: "",
    charge_out_rate: "",
    productivity_percent: "",
    margin_target_percent: "",
  });

  const scenario_result = useMemo(() => {
    return runLabourCalculations(labourState, overrides);
  }, [labourState, overrides]);

  const rows = useMemo(() => {
    return build_display_rows(scenario_result);
  }, [scenario_result]);

  const biggest_driver = scenario_result?.biggest_driver;
  const explanation = scenario_result?.explanation ?? {};

  function update_override(field, value) {
    setOverrides((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function reset_overrides() {
    setOverrides({
      labour_rate: "",
      charge_out_rate: "",
      productivity_percent: "",
      margin_target_percent: "",
    });
  }

  if (!has_profile) {
    return (
      <section className="ui-section">
        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Scenario modeller</div>
            <h2 className="ui-card-title">What-if testing</h2>
            <p className="ui-help">
              Create or load a Labour profile first. Scenario testing compares
              temporary changes against your live Labour position.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Scenario modeller</div>
            <h2 className="ui-card-title">Test Labour changes safely</h2>
            <p className="ui-help">
              This is a temporary Labour-only testing layer. It does not save
              scenarios and it does not change live Labour data.
            </p>
          </div>

          <div className="ui-split-2">
            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Override inputs</div>

                <label className="ui-stack-sm">
                  <span className="ui-label">Labour rate</span>
                  <input
                    className="ui-input"
                    type="number"
                    inputMode="decimal"
                    value={overrides.labour_rate}
                    onChange={(event) =>
                      update_override("labour_rate", event.target.value)
                    }
                    placeholder={String(labourState.labour_rate ?? 0)}
                  />
                </label>

                <label className="ui-stack-sm">
                  <span className="ui-label">Charge-out rate</span>
                  <input
                    className="ui-input"
                    type="number"
                    inputMode="decimal"
                    value={overrides.charge_out_rate}
                    onChange={(event) =>
                      update_override("charge_out_rate", event.target.value)
                    }
                    placeholder={String(labourState.charge_out_rate ?? 0)}
                  />
                </label>

                <label className="ui-stack-sm">
                  <span className="ui-label">Productivity %</span>
                  <input
                    className="ui-input"
                    type="number"
                    inputMode="decimal"
                    value={overrides.productivity_percent}
                    onChange={(event) =>
                      update_override("productivity_percent", event.target.value)
                    }
                    placeholder={String(labourState.productivity_percent ?? 0)}
                  />
                </label>

                <label className="ui-stack-sm">
                  <span className="ui-label">Margin target %</span>
                  <input
                    className="ui-input"
                    type="number"
                    inputMode="decimal"
                    value={overrides.margin_target_percent}
                    onChange={(event) =>
                      update_override(
                        "margin_target_percent",
                        event.target.value
                      )
                    }
                    placeholder={String(labourState.margin_target_percent ?? 0)}
                  />
                </label>

                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={reset_overrides}
                  >
                    Reset scenario
                  </button>
                </div>
              </div>
            </div>

            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Primary driver</div>

                <div>
                  <div className="ui-label">Driver</div>
                  <div>{biggest_driver?.label || "No meaningful change"}</div>
                </div>

                <div>
                  <div className="ui-label">Delta</div>
                  <div>
                    {biggest_driver
                      ? format_currency(biggest_driver.delta)
                      : format_currency(0)}
                  </div>
                </div>

                <div>
                  <div className="ui-label">Explanation</div>
                  <div>{explanation.title || "No meaningful change"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Scenario comparison</div>

              <div className="ui-stack-sm">
                {rows.map((row) => (
                  <div key={row.key} className="ui-panel">
                    <div className="ui-stack-sm">
                      <div className="ui-label">{row.label}</div>

                      <div className="ui-split-2">
                        <div>
                          <div className="ui-help">Live</div>
                          <div>{row.live_value}</div>
                        </div>

                        <div>
                          <div className="ui-help">Scenario</div>
                          <div>{row.scenario_value}</div>
                        </div>
                      </div>

                      <div>
                        <div className="ui-help">Delta</div>
                        <div>{row.delta_value}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Commercial meaning</div>
              <p>{explanation.body || "No scenario explanation available."}</p>

              {explanation.insight ? (
                <p className="ui-help">{explanation.insight}</p>
              ) : null}
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Rules</div>
              <div className="ui-stack-sm">
                <div>• Scenario is temporary only</div>
                <div>• Live Labour state is unchanged</div>
                <div>• Cost Summary must not consume scenario outputs</div>
                <div>• This is not a full business simulation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}