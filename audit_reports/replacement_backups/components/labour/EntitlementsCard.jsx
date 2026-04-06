"use client";

import { useState } from "react";

export default function EntitlementsCard({
  state,
  outputs,
  has_profile,
  update_field,
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold">Entitlements</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            NZ default leave and entitlement model
          </p>
        </div>

        <span className="text-sm text-[var(--text-muted)]">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Annual Leave Weeks">
            <input
              type="number"
              step="0.01"
              value={state.annual_leave_weeks ?? ""}
              onChange={(e) => update_field("annual_leave_weeks", e.target.value)}
              disabled={!has_profile}
              className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Public Holiday Days">
            <input
              type="number"
              step="0.01"
              value={state.public_holiday_days ?? ""}
              onChange={(e) => update_field("public_holiday_days", e.target.value)}
              disabled={!has_profile}
              className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Sick Days">
            <input
              type="number"
              step="0.01"
              value={state.sick_days ?? ""}
              onChange={(e) => update_field("sick_days", e.target.value)}
              disabled={!has_profile}
              className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Bereavement Days">
            <input
              type="number"
              step="0.01"
              value={state.bereavement_days ?? ""}
              onChange={(e) => update_field("bereavement_days", e.target.value)}
              disabled={!has_profile}
              className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Family Violence Days">
            <input
              type="number"
              step="0.01"
              value={state.family_violence_days ?? ""}
              onChange={(e) => update_field("family_violence_days", e.target.value)}
              disabled={!has_profile}
              className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm"
            />
          </Field>

          <ReadOnlyField
            label="Non-Productive Paid Hours"
            value={format_number(outputs.non_productive_paid_hours)}
          />
        </div>
      ) : null}
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
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)]">
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