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

export default function BusinessSummaryHelpPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Help</div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Business Summary Help
              </h2>
              <p className="ui-help">
                How this current business mirror combines upstream summaries.
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
                title="Revenue / COGS"
                body="Revenue / COGS shows trading output."
              />
              <HelpRow
                title="Cost Summary"
                body="Cost Summary shows operating cost burden."
              />
              <HelpRow
                title="Business Summary"
                body="Business Summary combines both upstream summaries."
              />
              <HelpRow
                title="Net Position"
                body="Margin Pool minus Operating Costs equals Net Position."
              />
              <HelpRow
                title="Current Margin per Hour"
                body="Current margin per hour compares trading output against operating recovery hours."
              />
              <HelpRow
                title="No Modelling"
                body="This page is not modelling."
              />
              <HelpRow
                title="No Cash Flow"
                body="This page does not include principal or cash flow."
              />
              <HelpRow
                title="No Quote Pricing"
                body="This page does not include quote pricing."
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
