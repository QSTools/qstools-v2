"use client";

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

export default function ModuleReconciliationStatusStrip({
  reconciliation_ready = false,
  blocking_count = 0,
  warning_count = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Module Reconciliation</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              P&amp;L vs modules
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Compares what your P&amp;L says against what Labour, Assets,
              and General Overheads independently calculate, and shows where
              and why they differ.
            </p>
          </div>

          <div className="ui-actions">
            <Pill
              text={reconciliation_ready ? "Reconciled" : "Review required"}
              tone={reconciliation_ready ? "good" : "bad"}
            />
            <Pill
              text={`Blocking: ${blocking_count}`}
              tone={blocking_count > 0 ? "bad" : "good"}
            />
            <Pill
              text={`Warnings: ${warning_count}`}
              tone={warning_count > 0 ? "bad" : "good"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}