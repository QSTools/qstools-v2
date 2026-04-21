"use client";

function format_hours(value) {
  return `${new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} hrs`;
}

export default function EntitlementsCard({
  state = {},
  outputs = {},
  has_profile = false,
  update_field,
}) {
  const disabled = !has_profile;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Entitlements</div>
          <h2 className="ui-card-title">Paid non-productive time</h2>
          <p className="ui-help">
            These settings define paid time that reduces recoverable hours.
            Labour uses them to convert paid hours into real productive hours.
          </p>
        </div>

        <div className="ui-stack-sm">
          <label className="ui-stack-sm">
            <span className="ui-label">Annual leave (weeks)</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.annual_leave_weeks ?? ""}
              onChange={(event) =>
                update_field?.("annual_leave_weeks", event.target.value)
              }
              disabled={disabled}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Public holidays (days)</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.public_holiday_days ?? ""}
              onChange={(event) =>
                update_field?.("public_holiday_days", event.target.value)
              }
              disabled={disabled}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Sick days</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.sick_days ?? ""}
              onChange={(event) =>
                update_field?.("sick_days", event.target.value)
              }
              disabled={disabled}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Bereavement days</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.bereavement_days ?? ""}
              onChange={(event) =>
                update_field?.("bereavement_days", event.target.value)
              }
              disabled={disabled}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Family violence days</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              value={state.family_violence_days ?? ""}
              onChange={(event) =>
                update_field?.("family_violence_days", event.target.value)
              }
              disabled={disabled}
            />
          </label>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Derived impact</div>

            <div className="ui-split-2">
              <div>
                <div className="ui-label">Paid hours per year</div>
                <div>{format_hours(outputs.paid_hours_per_year)}</div>
              </div>

              <div>
                <div className="ui-label">Non-productive paid hours</div>
                <div>{format_hours(outputs.non_productive_paid_hours)}</div>
              </div>
            </div>

            <div>
              <div className="ui-label">Productive hours remaining</div>
              <div className="ui-card-title-sm">
                {format_hours(outputs.productive_hours)}
              </div>
            </div>

            <p className="ui-help">
              These settings affect Labour only. Employee overheads, assets, and
              wider business overhead are handled elsewhere in the system.
            </p>
          </div>
        </div>

        {!has_profile ? (
          <div className="ui-panel">
            <p className="ui-help">
              Create a Labour profile first to unlock entitlement inputs.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}