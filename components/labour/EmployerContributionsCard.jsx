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
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Employer Contributions
              </h2>
              <p className="ui-help">
                NZ KiwiSaver and ESCT are calculated automatically from annual gross
                wages
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="ui-button-secondary"
              >
                {isOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {isOpen ? (
            <div className="ui-stack">
              <Field label="Employee KiwiSaver Enabled">
                <select
                  value={state.employee_kiwisaver_enabled ? "true" : "false"}
                  onChange={(e) =>
                    update_field(
                      "employee_kiwisaver_enabled",
                      e.target.value === "true"
                    )
                  }
                  disabled={!has_profile}
                  className="ui-input"
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
          ) : null}
        </div>
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

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <div className="ui-label">{label}</div>
      <div className="ui-readonly">{value}</div>
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