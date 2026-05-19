"use client";

export default function CostAllocationStatusStrip({
  status_label,
  allocation_status,
  allocation_dependency_label,
  active_recovery_model_label,
  structure_valid,
  warnings_count,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Cost allocation</p>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {status_label || allocation_status || "Needs review"}
            </h1>
            <p className="ui-help">
              This page tests whether the selected recovery plan is supported by
              the visible delivery structure.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="ui-readonly">
              <span className="ui-label">Dependency</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {allocation_dependency_label || "Unknown"}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Active recovery model</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {active_recovery_model_label || "Labour-led recovery"}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Structure valid</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {structure_valid ? "Yes" : "No"}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Warnings</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {warnings_count}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
