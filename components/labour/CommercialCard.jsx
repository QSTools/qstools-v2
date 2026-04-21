"use client";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export default function CommercialCard({
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
          <div className="ui-kicker">Commercial</div>
          <h2 className="ui-card-title">Recovery and margin settings</h2>
          <p className="ui-help">
            These settings shape the commercial pressure on the Labour
            profile. Productivity affects how much paid time becomes truly
            recoverable, and margin target affects the minimum charge-out
            required.
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

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Commercial outputs</div>

            <div className="ui-split-2">
              <div>
                <div className="ui-label">Productivity target</div>
                <div>{format_percent(state.productivity_percent)}</div>
              </div>

              <div>
                <div className="ui-label">Margin target</div>
                <div>{format_percent(state.margin_target_percent)}</div>
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
                <div className="ui-label">Actual margin</div>
                <div>{format_percent(outputs.actual_margin_percent)}</div>
              </div>

              <div>
                <div className="ui-label">Margin gap</div>
                <div>{format_currency(outputs.margin_gap)}</div>
              </div>
            </div>

            <div>
              <div className="ui-label">Above recovery</div>
              <div className="ui-card-title-sm">
                {format_currency(outputs.above_recovery)}
              </div>
            </div>
          </div>
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