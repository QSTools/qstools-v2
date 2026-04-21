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
          <h2 className="ui-card-title">Wage and charge-out</h2>
          <p className="ui-help">
            Enter the hourly wage and the current Labour-only charge-out rate
            for this profile.
          </p>
        </div>

        <div className="ui-stack-sm">
          <label className="ui-stack-sm">
            <span className="ui-label">Labour rate</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.labour_rate ?? ""}
              onChange={(event) =>
                update_field?.("labour_rate", event.target.value)
              }
              disabled={disabled}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Charge-out rate</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.charge_out_rate ?? ""}
              onChange={(event) =>
                update_field?.("charge_out_rate", event.target.value)
              }
              disabled={disabled}
            />
          </label>
        </div>

        {!has_profile ? (
          <div className="ui-panel">
            <p className="ui-help">
              Create a Labour profile first to unlock pay inputs.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}