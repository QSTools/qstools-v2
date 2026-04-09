"use client";

import { useState } from "react";

export default function MaterialsHelpPanel() {
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
                  Materials is an annual margin layer
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                This page measures annual material cost, annual material revenue,
                and the margin contribution created by that spread.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                It is not inventory, not purchasing workflow, and not quote pricing.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Downstream, Recovery Outcome uses this module as one real recovery
                stream alongside labour, assets, and production-based rate models.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}