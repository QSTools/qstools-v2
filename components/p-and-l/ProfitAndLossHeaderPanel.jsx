"use client";

export default function ProfitAndLossHeaderPanel({
  title = "Profit & Loss",
  subtitle = "Capture your business P&L in familiar section order.",
  editing_label = "",
  save_message = "",
  on_reset,
  on_save_snapshot,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-stack-tight">
            <p className="ui-kicker">Business Cost Setup</p>
            <h2 className="ui-title">{title}</h2>
            <p className="ui-help">{subtitle}</p>

            {editing_label ? (
              <div className="ui-help">
                <strong>Editing:</strong> {editing_label}
              </div>
            ) : null}

            {save_message ? (
              <div className="ui-help">
                <strong>{save_message}</strong>
              </div>
            ) : null}
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_reset}
            >
              Reset
            </button>

            <button
              type="button"
              className="ui-button-primary"
              onClick={on_save_snapshot}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}