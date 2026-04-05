"use client";

export default function EmployeeOverheadStatusStrip({
  active_staff_available = 0,
  selected_staff_found = false,
  has_linked_overhead_profile = false,
  warnings = [],
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">
            Active Labour Staff
          </div>
          <div className="text-xl font-semibold">{active_staff_available}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">
            Selected Staff
          </div>
          <div className="text-xl font-semibold">
            {selected_staff_found ? "Selected" : "Not Selected"}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">
            Overhead Profile
          </div>
          <div className="text-xl font-semibold">
            {has_linked_overhead_profile ? "Saved" : "Not Saved"}
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-700/40 bg-amber-950/30 p-3">
          <div className="text-sm font-medium text-amber-300">Warnings</div>
          <ul className="mt-2 space-y-1 text-sm text-amber-100">
            {warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}