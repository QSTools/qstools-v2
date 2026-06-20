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
          <div className="ui-kicker">Productivity</div>
          <h2 className="ui-card-title">Productive capacity assumptions</h2>
          <p className="ui-help">
            Set the productivity assumption used to convert paid time into true
            productive labour cost. Margin and charge-out testing now belongs in
            Rate Builder.
          </p>
        </div>

        <div className="ui-stack-sm">
          <label className="ui-stack-sm">
            <span className="ui-label">Productivity (%)</span>
            <input
              className="ui-input"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              value={state.productivity_percent ?? ""}
              onChange={(event) =>
                update_field?.("productivity_percent", event.target.value)
              }
              disabled={disabled}
            />
          </label>
        </div>

        {!has_profile ? (
          <div className="ui-panel">
            <p className="ui-help">
              Create a Labour profile first to unlock productivity inputs.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}