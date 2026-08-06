"use client";

import { useState } from "react";

export default function ModuleReconciliationHelpPanel() {
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
                  P&amp;L vs modules, and why they might differ
                </h2>
              </div>

              <p className="text-sm text-[var(--text-secondary)]">
                This page compares your actual P&amp;L figures against what
                the Labour, Assets, and General Overheads modules
                independently calculate. It is read-only. Nothing here can be
                edited, and no source module value is ever changed by this
                page.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                A gap between the two is not automatically an error. Common
                causes include timing differences, owner or director pay
                treatment, a year-end journal your accountant has not posted
                yet, or a cost classified differently on the P&amp;L than in
                the module. Each variance lists the most likely reasons.
              </p>

              <p className="text-sm text-[var(--text-secondary)]">
                Use this page to decide whether a gap needs correcting in
                your P&amp;L classification, your module setup, or is simply
                a known and accepted difference.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}