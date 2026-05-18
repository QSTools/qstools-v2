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
              defines how that cost is intended to be recovered across the
              selected recovery strategy.
            </p>

            <p className="text-sm text-[var(--text-primary)]">
              Selected recovery hours come from the Cost Summary recovery-hour
              baseline. Asset-driven or hybrid businesses may distribute
              recovery across labour, assets, and absorbed overhead.
            </p>

            <p className="text-sm text-[var(--text-primary)]">
              This page is not pricing. It does not set sell rates, packages, or
              quoting logic.
            </p>

            <p className="text-sm text-[var(--text-primary)]">
              This module consumes Business Summary recovery outputs and must
              not rebuild upstream labour, asset, overhead, Cost Summary, or
              Business Summary calculations.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
