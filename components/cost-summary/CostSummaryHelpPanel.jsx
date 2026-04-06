"use client";

import { useState } from "react";

function HelpRow({ title, body }) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)]/40 p-4">
      <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{body}</p>
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
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Cost Summary Help
              </h2>
              <p className="ui-help">
                What this page shows and how to read it.
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
              <div className="rounded-2xl border border-[var(--info)] bg-[var(--info-soft)]/30 p-4">
                <div className="text-sm font-semibold text-[var(--info)]">
                  What Cost Summary is
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--info)]/90">
                  Cost Summary is the internal cost and recovery view of the business.
                  It combines Labour, Employee Overheads, Assets, and General
                  Overheads into one recovery baseline so you can see what the
                  business must recover to sustain operations.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--warning)] bg-[var(--warning-soft)]/30 p-4">
                <div className="text-sm font-semibold text-[var(--warning)]">
                  What Cost Summary is not
                </div>
                <div className="mt-2 space-y-2 text-sm leading-6 text-[var(--warning)]/90">
                  <p>This is not a P&amp;L.</p>
                  <p>This does not show actual business performance.</p>
                  <p>This shows required recovery, not actual performance.</p>
                </div>
              </div>

              <div className="ui-stack">
                <HelpRow
                  title="People Cost"
                  body="People Cost combines Labour and Employee Overheads. It shows the annual cost burden created by active staff and their linked overhead profiles."
                />

                <HelpRow
                  title="Business Cost"
                  body="Business Cost combines Assets and General Overheads. It represents business-level cost burden that sits outside direct wage cost."
                />

                <HelpRow
                  title="Total Cost Burden"
                  body="Total Cost Burden is the full annual internal cost burden currently being carried by the business from the active upstream modules."
                />

                <HelpRow
                  title="Required Revenue"
                  body="Required Revenue is the minimum annual revenue needed to recover the current internal cost burden at break-even."
                />

                <HelpRow
                  title="Required Recovery Rate"
                  body="Required Recovery Rate converts annual cost burden into a recovery-per-productive-hour view so commercial decisions can be compared against output capacity."
                />

                <HelpRow
                  title="Recovery Model"
                  body="The Recovery Model comes from Cost Allocation. It tells Cost Summary whether the active business structure is labour-only or asset-driven. This page displays that state but does not edit it."
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}