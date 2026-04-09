"use client";

import { useState } from "react";

export default function SquareMetreRateHelpPanel() {
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
                  This page models revenue generated from m²-based pricing
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                Use this page when the business sells work primarily by square
                metres, such as concrete placing, slab work, surface prep, or
                similar labour-led production.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Minimum charge matters because small jobs usually need a higher
                effective rate than large jobs.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                This page is annual production and revenue modelling only. It is
                not a detailed quote builder.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}