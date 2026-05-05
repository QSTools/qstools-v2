"use client";

export default function BusinessModellingScenarioControls({
  scenario_controls,
  selected_model_type,
  updateScenarioField,
  resetScenarioToBaseline,
}) {
  const isBaseline = selected_model_type === "baseline";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Scenario controls</div>
        <div className="ui-card-title-sm">
          Edit the active scenario assumptions
        </div>
        <p className="ui-help">
          Change the scenario without altering Business Summary or the locked baseline.
        </p>

        {isBaseline ? (
          <div className="ui-panel ui-help">
            Select Upside or Downside to edit scenario assumptions.
          </div>
        ) : null}

        <div className="ui-stack-sm">
          <label className="form-field">
            <span>Scenario Revenue</span>
            <input
              type="number"
              value={scenario_controls.scenario_total_revenue}
              disabled={isBaseline}
              onChange={(event) =>
                updateScenarioField(
                  "scenario_total_revenue",
                  event.target.value
                )
              }
            />
          </label>

          <label className="form-field">
            <span>Scenario Direct Costs</span>
            <input
              type="number"
              value={scenario_controls.scenario_total_direct_costs}
              disabled={isBaseline}
              onChange={(event) =>
                updateScenarioField(
                  "scenario_total_direct_costs",
                  event.target.value
                )
              }
            />
          </label>

          <label className="form-field">
            <span>Scenario Productive Output</span>
            <input
              type="number"
              value={scenario_controls.scenario_total_productive_output}
              disabled={isBaseline}
              onChange={(event) =>
                updateScenarioField(
                  "scenario_total_productive_output",
                  event.target.value
                )
              }
            />
          </label>

          <label className="form-field">
            <span>Scenario Operating Cost Burden</span>
            <input
              type="number"
              value={scenario_controls.scenario_total_cost_burden}
              disabled={isBaseline}
              onChange={(event) =>
                updateScenarioField(
                  "scenario_total_cost_burden",
                  event.target.value
                )
              }
            />
          </label>

          <label className="form-field">
            <span>Scenario Required Recovery Rate</span>
            <input
              type="number"
              value={scenario_controls.scenario_required_recovery_rate}
              disabled={isBaseline}
              onChange={(event) =>
                updateScenarioField(
                  "scenario_required_recovery_rate",
                  event.target.value
                )
              }
            />
          </label>
        </div>

        <button
          type="button"
          className="ui-button ui-button-secondary"
          onClick={resetScenarioToBaseline}
        >
          Reset Scenario To Baseline
        </button>
      </div>
    </section>
  );
}
