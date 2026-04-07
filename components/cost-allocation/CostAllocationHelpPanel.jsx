"use client";

import { useState } from "react";

export default function CostAllocationHelpPanel() {
  const [is_open, set_is_open] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-actions">
            <div>
              <p className="ui-kicker">Help</p>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                What this page does
              </h2>
            </div>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => set_is_open((current) => !current)}
            >
              {is_open ? "Hide" : "Show"}
            </button>
          </div>

          {is_open ? (
            <div className="ui-stack">
              <p className="text-sm text-[var(--text-secondary)]">
                Links show what resources can work together.
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Operational groups show what resources must work together to form a
                minimum viable delivery unit.
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                This page does not calculate cost, recovery, pricing, or packages.
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Recovery Summary defines the strategy. Cost Allocation validates
                whether the current structure can support it.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}