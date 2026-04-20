"use client";

import { useState } from "react";

export default function ProfitAndLossHelpPanel() {
  const [is_open, set_is_open] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div className="ui-actions">
          <div className="ui-stack-sm">
            <span className="ui-kicker">Help</span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              How to use this page
            </h2>
          </div>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => set_is_open((prev) => !prev)}
          >
            {is_open ? "Hide Help" : "Show Help"}
          </button>
        </div>

        {is_open ? (
          <div className="ui-stack">
            <div className="ui-panel ui-stack-sm">
              <span className="ui-label">What this page does</span>
              <p className="ui-help">
                This page captures the real P&amp;L structure of the business
                and separates revenue, COGS, and business costs.
              </p>
              <p className="ui-help">
                It also assigns business costs to the correct QS Tools module
                categories so downstream reconciliation can happen properly.
              </p>
            </div>

            <div className="ui-panel ui-stack-sm">
              <span className="ui-label">How to enter lines</span>
              <p className="ui-help">
                Enter each P&amp;L line once only.
              </p>
              <p className="ui-help">
                Give the line a clear name, enter the amount, then assign it to
                the correct category.
              </p>
              <p className="ui-help">
                Do not split one line across multiple categories on this page.
              </p>
            </div>

            <div className="ui-panel ui-stack-sm">
              <span className="ui-label">Category meaning</span>
              <p className="ui-help">
                Revenue is what the business earns.
              </p>
              <p className="ui-help">
                COGS is direct delivery cost such as materials, subcontract, and
                hired equipment.
              </p>
              <p className="ui-help">
                Business costs are the costs that must be recovered through the
                business model and are assigned to Labour, Employee Overheads,
                Assets, or General Overheads.
              </p>
            </div>

            <div className="ui-panel ui-stack-sm">
              <span className="ui-label">What flows downstream</span>
              <p className="ui-help">
                Only the business cost benchmark totals flow downstream for
                module reconciliation and later cost aggregation.
              </p>
              <p className="ui-help">
                Revenue, COGS, and Gross Profit stay on this page as benchmark
                and classification outputs only.
              </p>
            </div>

            <div className="ui-panel ui-stack-sm">
              <span className="ui-label">Readiness rule</span>
              <p className="ui-help">
                The page is only ready when unassigned balance is zero.
              </p>
              <p className="ui-help">
                If any business cost remains unassigned, downstream pages should
                not be trusted yet.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}