"use client";

import { useState } from "react";

function HelpRow({ title, body }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </div>
      <p className="ui-help">{body}</p>
    </div>
  );
}

export default function RevenueCogsHelpPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Help</div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Revenue / COGS Help
              </h2>
              <p className="ui-help">
                What this page includes and what it deliberately excludes.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="ui-button-secondary"
              >
                {isOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {isOpen ? (
            <div className="ui-stack">
              <HelpRow
                title="Revenue"
                body="Revenue comes from P&L lines classified as revenue."
              />
              <HelpRow
                title="Direct Costs"
                body="Direct Costs come from P&L lines classified as cogs."
              />
              <HelpRow
                title="Margin Pool"
                body="Margin Pool equals Revenue minus Direct Costs."
              />
              <HelpRow
                title="Operating Costs"
                body="This page does not include operating costs."
              />
              <HelpRow
                title="Cost Summary"
                body="This page does not use Cost Summary outputs."
              />
              <HelpRow
                title="Activity Classification"
                body="This page does not use activity or micro classification yet."
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
