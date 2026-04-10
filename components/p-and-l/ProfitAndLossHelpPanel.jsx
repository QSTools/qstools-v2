"use client";

import { useState } from "react";

export default function ProfitAndLossHelpPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Hide Help" : "Show Help"}
        </button>

        {open ? (
          <div className="ui-stack-sm">
            <p className="ui-help">
              This page follows a true Profit &amp; Loss structure using annual values.
            </p>
            <p className="ui-help">
              It shows what actually happened in the business over the last financial year.
            </p>
            <p className="ui-help">
              It is the starting point of QS Tools and does not replace deeper modelling pages.
            </p>
            <p className="ui-help">
              This page is not a quote builder and does not calculate charge-out rates.
            </p>
            <p className="ui-help">
              Custom line items are available so you can capture business-specific items without
              breaking the accounting structure.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}