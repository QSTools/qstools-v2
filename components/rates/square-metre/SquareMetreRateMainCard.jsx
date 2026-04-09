"use client";

import { useState } from "react";

function format_currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Field({ label, value, onChange, type = "number" }) {
  return (
    <label className="ui-stack">
      <span className="ui-label">{label}</span>
      <input
        className="ui-input"
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function SquareMetreRateMainCard({
  base_square_metre_rate = 0,
  minimum_charge = 0,
  expected_annual_square_metres = 0,
  small_job_threshold_m2 = 0,
  average_job_size_m2 = 0,
  small_job_uplift_percent = 0,
  large_job_discount_percent = 0,
  included_labour_basis_label = "",
  included_material_basis_label = "",

  rate_model_type = "square_metre",
  unit_label = "m2",
  expected_annual_volume = 0,
  expected_revenue_annual = 0,
  expected_recovery_contribution = 0,
  warnings = [],

  on_base_square_metre_rate_change = () => {},
  on_minimum_charge_change = () => {},
  on_expected_annual_square_metres_change = () => {},
  on_small_job_threshold_m2_change = () => {},
  on_average_job_size_m2_change = () => {},
  on_small_job_uplift_percent_change = () => {},
  on_large_job_discount_percent_change = () => {},
  on_included_labour_basis_label_change = () => {},
  on_included_material_basis_label_change = () => {},
  on_reset = () => {},
}) {
  const [show_behaviour, set_show_behaviour] = useState(false);
  const [show_basis_labels, set_show_basis_labels] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Core rate inputs</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Base rate, minimum charge, and annual volume
            </h2>
          </div>

          <div className="ui-stack">
            <Field
              label="Base Square Metre Rate"
              value={base_square_metre_rate}
              onChange={on_base_square_metre_rate_change}
            />

            <Field
              label="Minimum Charge"
              value={minimum_charge}
              onChange={on_minimum_charge_change}
            />

            <Field
              label="Expected Annual Square Metres"
              value={expected_annual_square_metres}
              onChange={on_expected_annual_square_metres_change}
            />
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => set_show_behaviour((current) => !current)}
            >
              {show_behaviour
                ? "Hide pricing behaviour"
                : "Show pricing behaviour"}
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => set_show_basis_labels((current) => !current)}
            >
              {show_basis_labels ? "Hide basis labels" : "Show basis labels"}
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_reset}
            >
              Reset
            </button>
          </div>

          {show_behaviour ? (
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Small-job / large-job behaviour</p>
              </div>

              <Field
                label="Small Job Threshold (m²)"
                value={small_job_threshold_m2}
                onChange={on_small_job_threshold_m2_change}
              />

              <Field
                label="Small Job Uplift %"
                value={small_job_uplift_percent}
                onChange={on_small_job_uplift_percent_change}
              />

              <Field
                label="Large Job Discount %"
                value={large_job_discount_percent}
                onChange={on_large_job_discount_percent_change}
              />

              <Field
                label="Average Job Size (m²)"
                value={average_job_size_m2}
                onChange={on_average_job_size_m2_change}
              />
            </div>
          ) : null}

          {show_basis_labels ? (
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Optional basis labels</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  These are for clarity only. They do not own upstream cost logic.
                </p>
              </div>

              <Field
                label="Included Labour Basis Label"
                value={included_labour_basis_label}
                onChange={on_included_labour_basis_label_change}
                type="text"
              />

              <Field
                label="Included Material Basis Label"
                value={included_material_basis_label}
                onChange={on_included_material_basis_label_change}
                type="text"
              />
            </div>
          ) : null}

          <div>
            <p className="ui-kicker">Revenue preview</p>
            <div className="ui-stack">
              <div className="ui-readonly">
                <span className="ui-label">Rate Model Type</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {rate_model_type}
                </div>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Unit Label</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {unit_label}
                </div>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Expected Annual Volume</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {Number(expected_annual_volume || 0).toLocaleString()}
                </div>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Expected Annual Revenue</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(expected_revenue_annual)}
                </div>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Expected Recovery Contribution</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(expected_recovery_contribution)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="ui-kicker">Warnings</p>
            <div className="ui-stack">
              {warnings.length === 0 ? (
                <div className="ui-readonly">
                  <div className="text-sm text-[var(--text-secondary)]">
                    No warnings at the moment.
                  </div>
                </div>
              ) : (
                warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`} className="ui-readonly">
                    <div className="text-sm text-[var(--text-primary)]">
                      {warning}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}