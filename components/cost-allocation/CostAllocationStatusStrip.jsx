"use client";

export default function CostAllocationStatusStrip({
  status_label,
  allocation_status,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div>
            <p className="ui-kicker">Cost allocation</p>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {status_label || allocation_status || "Needs review"}
            </h1>
            <p className="ui-help">
              This page checks whether your delivery structure is complete
              enough to support the selected recovery plan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}