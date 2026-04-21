"use client";

function format_hours(value) {
  return `${new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} hrs`;
}

export default function WorkingPatternCard({
  state = {},
  outputs = {},
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
              Define how many hours are paid and how much of that time is truly
              productive.
            </p>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <label className="ui-stack-sm">
                <span className="ui-label">Hours per week</span>
                <input
                  className="ui-input"
                  type="number"
                  value={state.hours_per_week ?? ""}
                  onChange={(e) => update_field("hours_per_week", e.target.value)}
                  disabled={disabled}
                />
              </label>

              <label className="ui-stack-sm">
                <span className="ui-label">Days per week</span>
                <input
                  className="ui-input"
                  type="number"
                  value={state.days_per_week ?? ""}
                  onChange={(e) => update_field("days_per_week", e.target.value)}
                  disabled={disabled}
                />
              </label>

              <label className="ui-stack-sm">
                <span className="ui-label">Productivity (%)</span>
                <input
                  className="ui-input"
                  type="number"
                  value={state.productivity_percent ?? ""}
                  onChange={(e) =>
                    update_field("productivity_percent", e.target.value)
                  }
                  disabled={disabled}
                />
              </label>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Derived hours</div>

              <div className="ui-split-2">
                <div>
                  <div className="ui-label">Paid hours per year</div>
                  <div>{format_hours(outputs.paid_hours_per_year)}</div>
                </div>

                <div>
                  <div className="ui-label">Non-productive hours</div>
                  <div>{format_hours(outputs.non_productive_paid_hours)}</div>
                </div>
              </div>

              <div>
                <div className="ui-label">Productive hours</div>
                <div className="ui-card-title-sm">
                  {format_hours(outputs.productive_hours)}
                </div>
              </div>

              <p className="ui-help">
                Productive hours are the real hours available to recover cost
                after leave, downtime, and productivity are applied.
              </p>
            </div>
          </div>

          {!has_profile && (
            <div className="ui-panel">
              <p className="ui-help">
                Create a Labour profile first to unlock working pattern inputs.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}