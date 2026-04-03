"use client";

import { useState } from "react";

export default function EmployerContributionsCard({
  state,
  outputs,
  has_profile,
  update_field,
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <h2 className="text-lg font-semibold">Employer Contributions</h2>
          <p className="mt-1 text-sm text-neutral-400">
            NZ KiwiSaver and ESCT are calculated automatically from annual gross wages
          </p>
        </div>

        <span className="text-sm text-neutral-400">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>

      {isOpen ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Employee KiwiSaver Enabled">
              <select
                value={state.employee_kiwisaver_enabled ? "true" : "false"}
                onChange={(e) =>
                  update_field("employee_kiwisaver_enabled", e.target.value === "true")
                }
                disabled={!has_profile}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>

            <ReadOnlyField
              label="Employer KiwiSaver Rate"
              value={format_percent(outputs.employer_kiwisaver_rate)}
            />

            <ReadOnlyField
              label="ESCT Rate"
              value={format_percent(outputs.esct_rate)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <ReadOnlyField
              label="Annual Gross Wages"
              value={format_currency(outputs.annual_gross_wages)}
            />

            <ReadOnlyField
              label="Employer KiwiSaver Gross"
              value={format_currency(outputs.employer_kiwisaver_gross)}
            />

            <ReadOnlyField
              label="ESCT Amount"
              value={format_currency(outputs.esct_amount)}
            />

            <ReadOnlyField
              label="Total Employer Contribution Cost"
              value={format_currency(outputs.total_employer_contribution_cost)}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-neutral-300">{label}</div>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <div className="mb-2 text-sm text-neutral-300">{label}</div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200">
        {value}
      </div>
    </div>
  );
}

function format_currency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function format_percent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}