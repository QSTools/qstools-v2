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
        className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Entitlements
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            NZ default leave and entitlement model
          </p>
        </div>

        <span className="text-sm text-[var(--text-muted)]">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Annual Leave Weeks">
              <input
                type="number"
                step="0.01"
                value={state.annual_leave_weeks ?? ""}
                onChange={(e) => update_field("annual_leave_weeks", e.target.value)}
                disabled={!has_profile}
                className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>

            <Field label="Public Holiday Days">
              <input
                type="number"
                step="0.01"
                value={state.public_holiday_days ?? ""}
                onChange={(e) => update_field("public_holiday_days", e.target.value)}
                disabled={!has_profile}
                className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>

            <Field label="Sick Days">
              <input
                type="number"
                step="0.01"
                value={state.sick_days ?? ""}
                onChange={(e) => update_field("sick_days", e.target.value)}
                disabled={!has_profile}
                className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>

            <Field label="Bereavement Days">
              <input
                type="number"
                step="0.01"
                value={state.bereavement_days ?? ""}
                onChange={(e) => update_field("bereavement_days", e.target.value)}
                disabled={!has_profile}
                className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>

            <Field label="Family Violence Days">
              <input
                type="number"
                step="0.01"
                value={state.family_violence_days ?? ""}
                onChange={(e) => update_field("family_violence_days", e.target.value)}
                disabled={!has_profile}
                className="number-input w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
            <div className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
              Non-Productive Paid Hours
            </div>
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]">
              {formatNumber(outputs.non_productive_paid_hours)}
            </div>
          </div>
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}