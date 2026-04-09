"use client";

import { useState } from "react";

export default function RevenueSummaryHelpPanel() {
  const [is_open, set_is_open] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => set_is_open((current) => !current)}
          >
            {is_open ? "Hide help" : "Show help"}
          </button>

          {is_open ? (
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">How to use this page</p>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Keep it simple and high level
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                This page is not trying to rebuild your full P&amp;L. It only
                captures the critical numbers needed to understand the business
                baseline before building rates.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Your P&amp;L may not have these exact names. That is normal. Use
                your best judgement to group your numbers into sales, delivery
                cost, material cost, and operating expenses.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Later pricing pages will use this baseline to calculate what
                your rates need to be.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}