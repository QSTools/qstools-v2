"use client";

function format_currency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function EmployeeOverheadCustomList({
  library_items = [],
  custom_assignment_rows = [],
  addCustomAssignmentFromTemplate,
  updateCustomAssignmentRow,
  deactivateCustomAssignmentRow,
  disabled = false,
}) {
  const active_library_items = library_items.filter((item) => item.is_active);

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <h2 className="text-lg font-semibold">Staff Custom Overheads</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Assign company library items to the selected staff member and override
        annual values if needed.
      </p>

      <div className="mt-4">
        <div className="mb-2 text-sm text-[var(--text-secondary)]">Add From Library</div>
        <div className="flex flex-wrap gap-2">
          {active_library_items.length === 0 && (
            <div className="text-sm text-[var(--text-muted)]">
              No active library items available.
            </div>
          )}

          {active_library_items.map((item) => (
            <button
              key={item.custom_overhead_template_id}
              type="button"
              onClick={() =>
                addCustomAssignmentFromTemplate(item.custom_overhead_template_id)
              }
              disabled={disabled}
              className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            >
              Add {item.custom_overhead_name} ({format_currency(item.default_amount_annual)})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {custom_assignment_rows.length === 0 && (
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-muted)]">
            No custom overheads assigned yet.
          </div>
        )}

        {custom_assignment_rows.map((row) => (
          <div
            key={row.staff_overhead_item_id}
            className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_120px]">
              <input
                type="text"
                value={row.overhead_name || ""}
                onChange={(e) =>
                  updateCustomAssignmentRow(row.staff_overhead_item_id, {
                    overhead_name: e.target.value,
                  })
                }
                disabled={disabled}
                className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-sm"
              />

              <input
                type="number"
                step="0.01"
                min="0"
                value={row.amount_annual ?? ""}
                onChange={(e) =>
                  updateCustomAssignmentRow(row.staff_overhead_item_id, {
                    amount_annual: e.target.value,
                  })
                }
                disabled={disabled}
                className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={() =>
                  deactivateCustomAssignmentRow(row.staff_overhead_item_id)
                }
                disabled={disabled}
                className="rounded-xl border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200"
              >
                Remove
              </button>
            </div>

            <div className="mt-2 text-xs text-[var(--text-muted)]">
              {row.is_active ? "Active" : "Inactive"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}