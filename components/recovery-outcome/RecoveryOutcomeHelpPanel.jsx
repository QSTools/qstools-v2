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
                  Recovery Outcome is the macro business verdict
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                This page combines cost baseline, recovery strategy, revenue
                streams, and structural readiness to show whether the overall
                business model works.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                It is not the place to author rates, set up structure, or rebuild
                cost logic. Go back upstream to change assumptions.
              </p>

              <div className="ui-stack">
                <div className="ui-readonly">
                  <span className="ui-label">Cost Summary</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Defines what the business costs.
                  </div>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Recovery Summary</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Defines how cost is intended to be recovered.
                  </div>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Materials + Rate Models</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Define material margin and production-based recovery streams.
                  </div>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Cost Allocation</span>
                  <div className="text-sm text-[var(--text-primary)]">
                    Confirms whether the operating structure can actually deliver the model.
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