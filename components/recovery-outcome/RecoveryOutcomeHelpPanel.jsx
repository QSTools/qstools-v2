"use client";

import { useState } from "react";

export default function RecoveryOutcomeHelpPanel() {
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
                <p className="ui-kicker">How to read this page</p>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Business Outcome is the recovery-chain verdict
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                This page combines the recovery strategy from Recovery Summary
                with the delivery structure and dependency result from Cost
                Allocation.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                It does not calculate costs, choose strategy, build structure,
                price quotes, or run scenarios. It only turns upstream evidence
                into a clear verdict.
              </p>

              <div className="ui-stack">
                <div className="ui-readonly">
                  <span className="ui-label">Business Summary</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Defines the current business reality.
                  </div>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Recovery Summary</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Defines the selected recovery plan and visible consequence.
                  </div>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Cost Allocation</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Tests whether the selected recovery plan is internally
                    supported, externally dependent, strained, or unsupported.
                  </div>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Business Outcome</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Gives the verdict: viable, viable with dependency, at risk,
                    or not viable.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}