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

          {/* Core definition */}
          <div className="ui-stack">
            <p className="text-sm text-[var(--text-primary)]">
              This page shows what your business costs per productive labour hour.
            </p>

            <p className="ui-help">
              It combines all annual business costs and spreads them across your
              available productive labour hours.
            </p>
          </div>

          {/* Clarification */}
          <div className="ui-stack">
            <p className="text-sm text-[var(--text-secondary)]">
              It does not define how revenue is generated, how costs are recovered,
              or what you should charge.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              It simply establishes the cost baseline of the business per productive hour.
            </p>

            <p className="ui-help">
              Not included here: COGS / Direct Costs, revenue, target profit, or
              quote margin. Those belong to future Revenue / Margin Pool,
              Recovery, and Quote Benchmark layers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
