"use client";

function StatusItem({ label, value }) {
  return (
    <div className="ui-panel">
      <p className="ui-label">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export default function RecoverySummaryStatusStrip({
  active_recovery_model_label,
  labour_share_percent,
  asset_share_percent,
  overhead_share_percent,
  recovery_ready,
  warning_count,
  warning_items,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery summary status</p>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Recovery strategy status
            </h1>
            <p className="ui-help">
              This strip shows whether the current recovery setup is balanced and
              ready for downstream use.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <StatusItem
              label="Recovery status"
              value={recovery_ready ? "Ready" : "Needs attention"}
            />

            <StatusItem
              label="Active recovery model"
              value={active_recovery_model_label}
            />

            <StatusItem
              label="Recovery shares"
              value={`Labour ${labour_share_percent}% · Assets ${asset_share_percent}% · Overhead ${overhead_share_percent}%`}
            />

            <StatusItem label="Warnings" value={String(warning_count)} />
          </div>

          {warning_items.length > 0 ? (
            <div className="ui-stack">
              <div>
                <p className="ui-label">Active warnings</p>
              </div>

              {warning_items.map((warning) => (
                <div key={warning.warning_key} className="ui-panel">
                  <p className="text-sm text-[var(--text-primary)]">
                    {warning.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="ui-panel">
              <p className="text-sm text-[var(--text-primary)]">
                No active recovery warnings.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}