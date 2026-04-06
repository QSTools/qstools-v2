"use client";

export default function WorkingPatternCard({
  state,
  outputs,
  has_profile,
  update_field,
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <h2 className="text-lg font-semibold">Working Pattern</h2>
      <p className="mt-1 mb-5 text-sm text-[var(--text-muted)]">
        Weekly hours structure
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Hours per Week">
          <input
            type="number"
            step="0.01"
            value={state.hours_per_week ?? ""}
            onChange={(e) => update_field("hours_per_week", e.target.value)}
            disabled={!has_profile}
            className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px]"
          />
        </Field>

        <ReadOnlyField
          label="Paid Hours per Year"
          value={format_number(outputs.paid_hours_per_year)}
        />
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-[var(--text-secondary)]">{label}</div>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <div className="mb-2 text-sm text-[var(--text-secondary)]">{label}</div>
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}

function format_number(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}