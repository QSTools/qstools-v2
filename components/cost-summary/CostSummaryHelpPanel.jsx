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
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost Summary Help
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            What this page shows and how to read it.
          </p>
        </div>

        <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-card-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          {isOpen ? "Hide" : "Show"}
        </div>
      </button>

      {isOpen ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-sky-900 bg-sky-950/30 p-4">
            <div className="text-sm font-semibold text-sky-300">
              What Cost Summary is
            </div>
            <p className="mt-2 text-sm leading-6 text-sky-100/90">
              Cost Summary is the internal cost and recovery view of the business.
              It combines Labour, Employee Overheads, Assets, and General
              Overheads into one recovery baseline so you can see what the
              business must recover to sustain operations.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-900 bg-amber-950/30 p-4">
            <div className="text-sm font-semibold text-amber-300">
              What Cost Summary is not
            </div>
            <div className="mt-2 space-y-2 text-sm leading-6 text-amber-100/90">
              <p>This is not a P&amp;L.</p>
              <p>This does not show actual business performance.</p>
              <p>This shows required recovery, not actual performance.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
    </section>
  );
}