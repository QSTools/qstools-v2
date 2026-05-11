"use client";

export default function ProfitAndLossHeaderPanel({
  editing_label = "",
  on_reset,
}) {
  return (
    <section className="ui-hero">
      <div className="ui-hero-inner">
        <div className="ui-kicker">Profit &amp; Loss setup</div>

        <h1 className="ui-hero-title">Enter your business P&amp;L</h1>

        <p className="ui-hero-copy">
          Your P&amp;L is the starting evidence for the whole model. Enter and
          classify it as accurately as you can, because these numbers flow into
          Revenue / COGS, Cost Summary, Business Summary, Recovery Summary, Cost
          Allocation, and Business Outcome.
        </p>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-label">Accuracy matters:</div>

          <div className="ui-help">
            <div>• Use real P&amp;L figures, not estimates where possible.</div>
            <div>• Classify each line once only.</div>
            <div>
              • Put materials and direct delivery costs into Materials / Cost of
              Goods Sold.
            </div>
            <div>
              • Put operating and business support costs into Operating
              Expenses.
            </div>
            <div>
              • If a line is mixed or unclear, choose the best-fit category and
              review it later.
            </div>
          </div>

          <p className="ui-help">
            The goal is a clean, honest business baseline that Mirra can trust.
          </p>
        </div>

        <div className="ui-actions">
          {editing_label ? (
            <div className="ui-help">
              <strong>Editing:</strong> {editing_label}
            </div>
          ) : null}

          <button
            type="button"
            className="ui-button-secondary"
            onClick={on_reset}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}