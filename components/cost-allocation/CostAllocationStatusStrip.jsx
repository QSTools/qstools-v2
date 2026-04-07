"use client";

export default function CostAllocationStatusStrip({
  active_recovery_model,
  structure_valid,
  linked_staff_count,
  linked_asset_count,
  total_operational_groups,
  warnings_count,
}) {
  const status_label = structure_valid ? "Structure ready" : "Structure incomplete";

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Cost allocation</p>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Structural readiness
            </h1>
            <p className="ui-help">
              Recovery strategy is read-only here. This page validates whether the
              current structure can support delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="ui-readonly">
              <span className="ui-label">Active recovery model</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {active_recovery_model}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Structure status</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {status_label}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Linked staff</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {linked_staff_count}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Linked assets</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {linked_asset_count}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Operational groups</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {total_operational_groups}
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