"use client";

export default function EmployeeOverheadStatusStrip({
  active_staff_available = 0,
  selected_staff_found = false,
  has_linked_overhead_profile = false,
  warnings = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">

          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Employee Overheads Status
            </h2>
            <p className="ui-help">
              Current linkage between labour staff and overhead profiles.
            </p>
          </div>

          <StatusItem
            label="Active Labour Staff"
            value={active_staff_available}
          />

          <StatusItem
            label="Selected Staff"
            value={selected_staff_found ? "Selected" : "Not Selected"}
            tone={selected_staff_found ? "ok" : "warn"}
          />

          <StatusItem
            label="Overhead Profile"
            value={has_linked_overhead_profile ? "Saved" : "Not Saved"}
            tone={has_linked_overhead_profile ? "ok" : "warn"}
          />

          {warnings.length > 0 ? (
            <div className="rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)]/30 p-3">
              <div className="text-sm font-medium text-[var(--warning)]">
                Warnings
              </div>

              <div className="mt-2 space-y-1 text-sm text-[var(--warning)]">
                {warnings.map((warning) => (
                  <div key={warning}>• {warning}</div>
                ))}
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </section>
  );
}

function StatusItem({ label, value, tone = "default" }) {
  const toneClass =
    tone === "ok"
      ? "text-[var(--success)]"
      : tone === "warn"
      ? "text-[var(--warning)]"
      : "text-[var(--text-primary)]";

  return (
    <div className="ui-panel">
      <div className="ui-kicker">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}