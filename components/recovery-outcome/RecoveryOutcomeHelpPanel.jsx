"use client";

import { useState } from "react";

export default function RecoveryOutcomeHelpPanel() {
  const [is_open, setIsOpen] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <p className="ui-kicker">Help</p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                How to read Recovery Outcome
              </h2>
            </div>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => setIsOpen((value) => !value)}
            >
              {is_open ? "Hide" : "Show"}
            </button>
          </div>

          {is_open ? (
            <div className="ui-stack">
              <p className="text-sm text-[var(--text-primary)]">
                Recovery Outcome combines recovery strategy and structural
                readiness into a business decision.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                This page does not calculate costs, recovery shares, or pricing.
                Those responsibilities stay in the upstream modules.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Use this page to see whether the current model is viable, what
                the main constraint is, and what should change next.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}