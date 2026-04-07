"use client";

export default function CostSummaryNoticeBanner() {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          {/* Header */}
          <div>
            <p className="ui-kicker">Business Cost Structure</p>

            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              How to read this page
            </h2>
          </div>

          {/* Core definition (NEW — TOP PRIORITY) */}
          <div className="ui-stack">
            <p className="text-sm text-[var(--text-primary)]">
              This page represents the complete cost picture of the business.
            </p>

            <p className="ui-help">
              It shows the total annual cost to operate and the minimum revenue
              required to recover those costs.
            </p>

            <p className="ui-help">
              It does not define how revenue is generated.
            </p>
          </div>

          {/* Supporting explanation (UPDATED) */}
          <div className="ui-stack">
            <p className="text-sm text-[var(--text-secondary)]">
              Recovery may come from labour, asset-based delivery, product sales,
              or material margin depending on your business model.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              This page isolates the cost side of the business so you can clearly
              understand what must be recovered.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}