"use client";

export default function RevenueSummaryNoticeBanner() {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Important — Start here</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Build your business baseline from your P&amp;L
            </h2>
          </div>

          <div className="ui-stack">
            <p className="text-sm text-[var(--text-primary)]">
              Use your <strong>accrual-based financial year P&amp;L</strong> for
              this page.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              Cash reports will distort results because revenue and costs will
              not align to the same period.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              Your P&amp;L may not match these exact categories. That is normal.
              Use your best judgement to group your numbers into the simple
              buckets below.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              This page does not rebuild your full accounts. It captures only
              the critical high-level numbers needed to establish the baseline
              for pricing later.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}