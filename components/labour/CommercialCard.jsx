"use client";

export default function CommercialCard({
  state = {},
  has_profile = false,
  update_field,
}) {
  const disabled = !has_profile;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Commercial</div>
          <h2 className="ui-card-title">Recovery assumptions</h2>
          <p className="ui-help">
            Set the productivity and target margin assumptions used to convert
            Labour cost into the live rate position shown elsewhere on the page.
          </p>
        </div>

        <div className="ui-stack-sm">
          <label className="ui-stack-sm">
            <span className="ui-label">Productivity (%)</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.productivity_percent ?? ""}
              onChange={(event) =>
                update_field?.("productivity_percent", event.target.value)
              }
              disabled={disabled}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Margin target (%)</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.margin_target_percent ?? ""}
              onChange={(event) =>
                update_field?.("margin_target_percent", event.target.value)
              }
              disabled={disabled}
            />
          </label>
        </div>

        {!has_profile ? (
          <div className="ui-panel">
            <p className="ui-help">
              Create a Labour profile first to unlock commercial inputs.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}