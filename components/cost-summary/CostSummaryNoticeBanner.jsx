"use client";

export default function CostSummaryNoticeBanner() {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Boundary</p>

            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              What Cost Summary does not decide
            </h2>
          </div>

          <div className="ui-stack">
            <p className="text-sm text-[var(--text-primary)]">
              Cost Summary is the operating cost baseline only.
            </p>

            <p className="ui-help">
              It does not decide pricing, margin, cash flow, or quote strategy.
              It shows what the business costs to operate before downstream
              commercial layers use that baseline.
            </p>
          </div>

          <div className="ui-stack">
            <p className="text-sm text-[var(--text-secondary)]">
              Not included here: COGS / Direct Costs, revenue, target profit, or
              quote margin.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              Next after a trusted Cost Summary: Revenue / COGS, then Business
              Summary, then Business Modelling.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
