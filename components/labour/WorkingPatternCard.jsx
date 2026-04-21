"use client";

export default function WorkingPatternCard({
  state = {},
  has_profile = false,
  update_field,
}) {
  const disabled = !has_profile;

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Working pattern</div>
            <h2 className="ui-card-title">Hours and productivity</h2>
            <p className="ui-help">
              Define how many hours are paid each week, how many days they are
              spread across, and the productivity level applied to those hours.
            </p>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <label className="ui-stack-sm">
                <span className="ui-label">Hours per week</span>
                <input
                  className="ui-input"
                  type="number"
                  inputMode="decimal"
                  value={state.hours_per_week ?? ""}
                  onChange={(event) =>
                    update_field?.("hours_per_week", event.target.value)
                  }
                  disabled={disabled}
                />
              </label>

              <label className="ui-stack-sm">
                <span className="ui-label">Days per week</span>
                <input
                  className="ui-input"
                  type="number"
                  inputMode="decimal"
                  value={state.days_per_week ?? ""}
                  onChange={(event) =>
                    update_field?.("days_per_week", event.target.value)
                  }
                  disabled={disabled}
                />
              </label>

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
            </div>
          </div>

          {!has_profile ? (
            <div className="ui-panel">
              <p className="ui-help">
                Create a Labour profile first to unlock working pattern inputs.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}