"use client";

export default function ProfitAndLossHeaderPanel({
  editing_label = "",
  on_reset,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-stack-sm">
            <p className="ui-kicker">Profit &amp; Loss Setup</p>

            <h1 className="ui-card-title">Enter your business P&amp;L</h1>

            <p className="ui-help">
              Start here by entering your real P&amp;L so QS Tools can reflect
              your business back to you.
            </p>

            <div className="ui-help">
              <div>• Capture your actual business performance</div>
              <div>• Classify costs into Labour, Assets, and Overheads</div>
              <div>• Build the foundation for accurate cost recovery</div>
            </div>

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