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
    <section className="ui-section">
      <div className="ui-panel">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex min-h-[44px] w-full flex-col gap-3 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Entitlements
            </h2>
            <p className="ui-help">NZ default leave and entitlement model</p>
          </div>

          <span className="ui-pill">{isOpen ? "Hide" : "Show"}</span>
        </button>

        {isOpen ? (
          <div className="mt-5 ui-stack">
            <Field label="Annual Leave Weeks">
              <input
                type="number"
                step="0.01"
                value={state.annual_leave_weeks ?? ""}
                onChange={(e) => update_field("annual_leave_weeks", e.target.value)}
                disabled={!has_profile}
                className="ui-input number-input"
              />
            </Field>

            <Field label="Public Holiday Days">
              <input
                type="number"
                step="0.01"
                value={state.public_holiday_days ?? ""}
                onChange={(e) => update_field("public_holiday_days", e.target.value)}
                disabled={!has_profile}
                className="ui-input number-input"
              />
            </Field>

            <Field label="Sick Days">
              <input
                type="number"
                step="0.01"
                value={state.sick_days ?? ""}
                onChange={(e) => update_field("sick_days", e.target.value)}
                disabled={!has_profile}
                className="ui-input number-input"
              />
            </Field>

            <Field label="Bereavement Days">
              <input
                type="number"
                step="0.01"
                value={state.bereavement_days ?? ""}
                onChange={(e) => update_field("bereavement_days", e.target.value)}
                disabled={!has_profile}
                className="ui-input number-input"
              />
            </Field>

            <Field label="Family Violence Days">
              <input
                type="number"
                step="0.01"
                value={state.family_violence_days ?? ""}
                onChange={(e) => update_field("family_violence_days", e.target.value)}
                disabled={!has_profile}
                className="ui-input number-input"
              />
            </Field>

            <div className="ui-panel">
              <div className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                Non-Productive Paid Hours
              </div>
              <div className="ui-readonly">
                {formatNumber(outputs.non_productive_paid_hours)}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="ui-label">{label}</div>
      {children}
    </label>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}