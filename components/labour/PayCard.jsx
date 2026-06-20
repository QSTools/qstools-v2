"use client";

export default function PayCard({
  state = {},
  has_profile = false,
  update_field,
}) {
  const disabled = !has_profile;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Pay</div>
          <h2 className="ui-card-title">Hours and wage cost</h2>
          <p className="ui-help">
            Enter the weekly hours and hourly wage cost for this Labour profile.
            Customer charge-out rates now belong in Rate Builder.
          </p>
        </div>

        <div className="ui-grid-2">
          <label className="ui-stack-sm">
            <span className="ui-label">Hrs per week</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              min="0"
              value={state.hours_per_week ?? ""}
              onChange={(event) =>
                update_field?.("hours_per_week", event.target.value)
              }
              disabled={disabled}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Labour rate</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              min="0"
              value={state.labour_rate ?? ""}
              onChange={(event) =>
                update_field?.("labour_rate", event.target.value)
              }
              disabled={disabled}
            />
          </label>
        </div>

        {!has_profile ? (
          <div className="ui-panel">
            <p className="ui-help">
              Create a Labour profile first to unlock hours and pay inputs.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}