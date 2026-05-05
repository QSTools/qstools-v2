"use client";

function formatNumber(value, decimals = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "";
  }

  return number.toFixed(decimals);
}

function DriverInput({
  label,
  helper,
  value,
  disabled,
  suffix,
  step = "1",
  decimals = 0,
  onChange,
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={formatNumber(value, decimals)}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      {suffix ? <span className="ui-help">{suffix}</span> : null}
      {helper ? <p className="ui-help">{helper}</p> : null}
    </label>
  );
}

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
        <div>
          <div className="ui-kicker">Business drivers</div>
          <div className="ui-card-title-sm">Model business levers</div>
          <p className="ui-help">
            Revenue is calculated from the business drivers. Do not type in a
            made-up revenue target. Adjust the levers below to test how the
            model changes.
          </p>
        </div>

        {isBaseline ? (
          <div className="ui-panel ui-help">
            Select Upside or Downside to edit business driver assumptions.
          </div>
        ) : null}

        <div className="ui-stack-sm">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Primary internal levers</div>

            <DriverInput
              label="Productive labour output %"
              helper="100% equals your current productive labour baseline. Increase this to test whether more productive output improves recovery without changing your charge-out rate."
              value={scenario_controls.scenario_productivity_percent}
              disabled={isBaseline}
              suffix="% of current productive labour baseline"
              step="1"
              decimals={0}
              onChange={(value) =>
                updateScenarioField("scenario_productivity_percent", value)
              }
            />

            <DriverInput
              label="Charge-out rate"
              helper="Pricing lever. Use this to test whether changing your rate improves or weakens the model."
              value={scenario_controls.scenario_charge_out_rate}
              disabled={isBaseline}
              suffix="$ per productive hour / contribution hour"
              step="1"
              decimals={0}
              onChange={(value) =>
                updateScenarioField("scenario_charge_out_rate", value)
              }
            />

            <DriverInput
              label="Margin target %"
              helper="Commercial target. This changes the required benchmark, not revenue by itself."
              value={scenario_controls.scenario_margin_target_percent}
              disabled={isBaseline}
              suffix="% target margin"
              step="1"
              decimals={0}
              onChange={(value) =>
                updateScenarioField("scenario_margin_target_percent", value)
              }
            />
          </div>

          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Growth lever</div>

            <DriverInput
              label="Billable volume change %"
              helper="Optional. Use this after testing productive labour output, rate, and margin. It models more or less billable work being sold or completed."
              value={
                scenario_controls.scenario_billable_volume_change_percent
              }
              disabled={isBaseline}
              suffix="% change from baseline volume"
              step="1"
              decimals={0}
              onChange={(value) =>
                updateScenarioField(
                  "scenario_billable_volume_change_percent",
                  value
                )
              }
            />
          </div>
        </div>

        <div className="ui-actions">
          <button
            type="button"
            className="ui-button ui-button-secondary"
            onClick={resetScenarioToBaseline}
            disabled={isBaseline}
          >
            Reset Scenario To Baseline
          </button>
        </div>

        <p className="ui-help">
          You can combine levers. For example, test whether higher productive
          labour output allows you to lower charge-out rates while still
          maintaining recovery.
        </p>
      </div>
    </section>
  );
}