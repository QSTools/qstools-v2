"use client";

function CurrencyField({ label, value, onChange, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-[var(--text-secondary)]">{label}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px]"
      />
    </label>
  );
}

export default function EmployeeOverheadForm({
  draft,
  updateDraftField,
  disabled = false,
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <h2 className="text-lg font-semibold">Generic Annual Overheads</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Annual staff-linked non-wage costs only.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CurrencyField
          label="Training Cost Annual"
          value={draft?.training_cost_annual}
          onChange={(value) => updateDraftField("training_cost_annual", value)}
          disabled={disabled}
        />

        <CurrencyField
          label="PPE Cost Annual"
          value={draft?.ppe_cost_annual}
          onChange={(value) => updateDraftField("ppe_cost_annual", value)}
          disabled={disabled}
        />

        <CurrencyField
          label="Staff Transport Allowance Annual"
          value={draft?.staff_transport_allowance_annual}
          onChange={(value) =>
            updateDraftField("staff_transport_allowance_annual", value)
          }
          disabled={disabled}
        />

        <CurrencyField
          label="Phone Allowance Annual"
          value={draft?.phone_allowance_annual}
          onChange={(value) =>
            updateDraftField("phone_allowance_annual", value)
          }
          disabled={disabled}
        />
      </div>

      <div className="mt-4 rounded-xl border border-[var(--info)]/40 bg-[var(--info-soft)]/20 p-3 text-sm text-[var(--info)]">
        Staff Transport Allowance includes personal vehicle support such as car
        allowance, mileage reimbursement, or fuel support for non-business-owned
        vehicles. Business-owned vehicles belong in Assets.
      </div>
    </section>
  );
}