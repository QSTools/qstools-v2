"use client";

import { useState } from "react";

function format_currency(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function EmployeeOverheadLibraryCard({
  library_items = [],
  addLibraryTemplate,
  updateLibraryTemplate,
  deactivateLibraryTemplateById,
}) {
  const [is_open, setIsOpen] = useState(false);
  const [custom_overhead_name, setCustomOverheadName] = useState("");
  const [default_amount_annual, setDefaultAmountAnnual] = useState("");

  function submitNewTemplate() {
    if (!custom_overhead_name.trim()) return;

    addLibraryTemplate({
      custom_overhead_name: custom_overhead_name.trim(),
      default_amount_annual,
    });

    setCustomOverheadName("");
    setDefaultAmountAnnual("");
    setIsOpen(true);
  }

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Company Custom Overhead Library</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Company-level reusable templates only. Templates do not auto-apply
            to staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
        >
          {is_open ? "Collapse" : "Expand"}
        </button>
      </div>

      {is_open && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_140px]">
            <input
              type="text"
              value={custom_overhead_name}
              onChange={(e) => setCustomOverheadName(e.target.value)}
              placeholder="Custom overhead name"
              className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            />

            <input
              type="number"
              step="0.01"
              min="0"
              value={default_amount_annual}
              onChange={(e) => setDefaultAmountAnnual(e.target.value)}
              placeholder="Default annual amount"
              className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={submitNewTemplate}
              className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            >
              Add Template
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {library_items.length === 0 && (
              <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-muted)]">
                No custom templates saved yet.
              </div>
            )}

            {library_items.map((item) => (
              <div
                key={item.custom_overhead_template_id}
                className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_140px]">
                  <input
                    type="text"
                    value={item.custom_overhead_name || ""}
                    onChange={(e) =>
                      updateLibraryTemplate({
                        ...item,
                        custom_overhead_name: e.target.value,
                      })
                    }
                    className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-sm"
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.default_amount_annual ?? ""}
                    onChange={(e) =>
                      updateLibraryTemplate({
                        ...item,
                        default_amount_annual: e.target.value,
                      })
                    }
                    className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      deactivateLibraryTemplateById(
                        item.custom_overhead_template_id
                      )
                    }
                    className="rounded-xl border border-[var(--danger)]/50 bg-[var(--danger-soft)]/30 px-3 py-2 text-sm text-[var(--danger)]"
                  >
                    Deactivate
                  </button>
                </div>

                <div className="mt-2 text-xs text-[var(--text-muted)]">
                  {item.is_active ? "Active" : "Inactive"} • Default{" "}
                  {format_currency(item.default_amount_annual)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}