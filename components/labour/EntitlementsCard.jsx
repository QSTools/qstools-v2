"use client";

export default function EntitlementsCard({
  state = {},
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
            Labour uses them downstream to convert paid hours into real
            productive hours.
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