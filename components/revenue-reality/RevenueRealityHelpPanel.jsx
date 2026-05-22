"use client";

import { useState } from "react";

function HelpSection({ title, children }) {
  return (
    <div className="ui-help-section">
      <h3 className="ui-help-section-title">{title}</h3>
      <div className="ui-help-section-body">{children}</div>
    </div>
  );
}

export default function RevenueRealityHelpPanel() {
  const [is_open, set_is_open] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Revenue Reality help
              </h2>
              <p className="ui-help">
                This page tests what P&amp;L GP / Material Margin leaves behind
                after real labour cost is paid.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                className="ui-button-secondary"
                onClick={() => set_is_open((previous) => !previous)}
              >
                {is_open ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {is_open ? (
            <div className="ui-stack">
              <HelpSection title="What this page does">
                <p>
                  Revenue Reality compares Revenue, COGS / Direct Costs, and
                  P&amp;L GP / Material Margin with the annual labour cost from
                  the cost baseline.
                </p>
              </HelpSection>

              <HelpSection title="What P&L GP means">
                <p>
                  P&amp;L GP is Revenue less COGS / Direct Costs. It is the
                  accounting margin before labour, assets, overheads, and
                  profit are tested.
                </p>
              </HelpSection>

              <HelpSection title="Why labour is subtracted">
                <p>
                  Labour must be paid before the business can claim that margin
                  is available for assets, overheads, or profit. This page uses
                  total real labour cost, not a charge-out rate or target rate.
                </p>
              </HelpSection>

              <HelpSection title="What this is not">
                <p>
                  Stress-tested Margin after Labour is not accounting GP. It is
                  a diagnostic result that shows the margin left after labour is
                  enforced.
                </p>
              </HelpSection>

              <HelpSection title="Negative results">
                <p>
                  A negative stress-tested result means labour cost exceeds
                  P&amp;L GP. The business is short before assets and overheads
                  are paid.
                </p>
              </HelpSection>

              <HelpSection title="Cross-subsidy">
                <p>
                  If labour consumes most or all of P&amp;L GP, material margin
                  may be hiding labour under-recovery in an hours-based
                  business. In a product/unit-based business, it shows how much
                  product margin remains to carry the whole business.
                </p>
              </HelpSection>

              <HelpSection title="What happens next">
                <p>
                  Recovery Summary tests the recovery model. Business Outcome
                  will later show what must change to make the baseline viable.
                </p>
              </HelpSection>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
