"use client";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function format_hours(value) {
  return `${new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} hrs`;
}

export default function PayCard({
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
          <div className="ui-kicker">Pay</div>
          <h2 className="ui-card-title">Hours, wage and charge-out</h2>
          <p className="ui-help">
            Enter the paid weekly hours, hourly wage, and current charge-out
            rate for this Labour profile.
          </p>
        </div>

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

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Live comparison</div>

            <div className="ui-split-2">
              <div>
                <div className="ui-label">Paid hours per year</div>
                <div>{format_hours(outputs.paid_hours_per_year)}</div>
              </div>

              <div>
                <div className="ui-label">Productive hours</div>
                <div>{format_hours(outputs.productive_hours)}</div>
              </div>
            </div>

            <div className="ui-split-2">
              <div>
                <div className="ui-label">Productive labour cost rate</div>
                <div>{format_currency(outputs.productive_labour_cost_rate)}</div>
              </div>

              <div>
                <div className="ui-label">Minimum charge-out rate</div>
                <div>{format_currency(outputs.minimum_charge_out_rate)}</div>
              </div>
            </div>

            <div className="ui-split-2">
              <div>
                <div className="ui-label">Current charge-out rate</div>
                <div>{format_currency(state.charge_out_rate)}</div>
              </div>

              <div>
                <div className="ui-label">Profit per hour</div>
                <div>{format_currency(outputs.profit_per_hour)}</div>
              </div>
            </div>
          </div>
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