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

export default function CostSummaryHelpPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Help</div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Cost Summary Help
              </h2>
              <p className="ui-help">
                What this page includes and how to read it.
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
              <div className="ui-panel ui-stack-sm">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  What Cost Summary is
                </div>
                <p className="ui-help">
                  Cost Summary is the internal business cost baseline. It
                  aggregates Labour, Assets, and General Overheads into one
                  annual cost burden so you can see what the
                  business must recover. 
                </p>
              </div>

              <div className="ui-panel ui-stack-sm">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  What Cost Summary is not
                </div>
                <div className="ui-stack-sm">
                  <p className="ui-help">This is not a P&amp;L.</p>
                  <p className="ui-help">This does not show actual business performance.</p>
                  <p className="ui-help">
                    This page defines what the business costs, not how it is recovered.
                  </p>
                  <p className="ui-help">
                    It does not include COGS / Direct Costs, revenue, target
                    profit, or quote margin. Those belong to future Revenue /
                    Margin Pool, Recovery, and Quote Benchmark layers.
                  </p>
                </div>
              </div>

              <HelpRow
                title="People Cost"
                body="People Cost shows the annual Labour burden from active saved Labour profiles."
              />

              <HelpRow
                title="Business Cost"
                body="Business Cost shows the annual non-people burden from Assets and General Overheads."
              />

              <HelpRow
                title="Total Cost Burden"
                body="Total Cost Burden is the full annual internal cost burden currently being carried by the business."
              />

              <HelpRow
                title="Required Revenue"
                body="Required Revenue is the minimum annual revenue needed to recover the current internal cost burden at break-even."
              />

              <HelpRow
                title="Required Recovery Rate"
                body="Required Recovery Rate converts annual cost burden into a per-productive-hour baseline."
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
