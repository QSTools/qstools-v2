"use client";

export default function EmployeeOverheadStatusStrip({
  active_staff_available = 0,
  selected_staff_found = false,
  has_linked_overhead_profile = false,
  warnings = [],
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Active Labour Staff
          </div>
          <div className="text-xl font-semibold">{active_staff_available}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Selected Staff
          </div>
          <div className="text-xl font-semibold">
            {selected_staff_found ? "Selected" : "Not Selected"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Overhead Profile
          </div>
          <div className="text-xl font-semibold">
            {has_linked_overhead_profile ? "Saved" : "Not Saved"}
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)]/30 p-3">
          <div className="text-sm font-medium text-[var(--warning)]">Warnings</div>
          <ul className="mt-2 space-y-1 text-sm text-[var(--warning)]">
            {warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}