"use client";

export default function ProfitAndLossHeaderPanel({
  title = "Profit & Loss",
  subtitle = "Capture your business P&L in familiar section order.",
  editing_label = "",
  on_reset,
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
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_reset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}