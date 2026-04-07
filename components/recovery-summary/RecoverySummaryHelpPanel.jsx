"use client";

export default function RecoverySummaryHelpPanel() {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <details>
          <summary className="cursor-pointer text-lg font-semibold text-[var(--text-primary)]">
            Recovery Summary help
          </summary>

          <div className="ui-stack mt-4">
            <p className="text-sm text-[var(--text-primary)]">
              Cost Summary defines what the business costs. Recovery Summary
              defines how that cost is intended to be recovered.
            </p>

            <p className="text-sm text-[var(--text-primary)]">
              Labour-only businesses may recover most or all cost through labour.
              Asset-driven or hybrid businesses may distribute recovery across
              labour, assets, and absorbed overhead.
            </p>

            <p className="text-sm text-[var(--text-primary)]">
              This page is not pricing. It does not set sell rates, packages, or
              quoting logic.
            </p>

            <p className="text-sm text-[var(--text-primary)]">
              This module consumes Cost Summary outputs only and must not rebuild
              upstream labour, asset, or overhead calculations.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}