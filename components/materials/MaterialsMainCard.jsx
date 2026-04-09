"use client";

import { useState } from "react";

function format_currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Field({ label, value, onChange }) {
  return (
    <label className="ui-stack">
      <span className="ui-label">{label}</span>
      <input
        className="ui-input"
        type="number"
        value={value ?? 0}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function MaterialsMainCard({
  annual_material_cost = 0,
  annual_material_revenue = 0,
  supplied_material_cost = 0,
  supplied_material_revenue = 0,
  resale_material_cost = 0,
  resale_material_revenue = 0,
  subcontract_pass_through_cost = 0,
  subcontract_pass_through_revenue = 0,
  material_margin_annual = 0,
  material_margin_percent = 0,
  warnings = [],
  on_annual_material_cost_change = () => {},
  on_annual_material_revenue_change = () => {},
  on_supplied_material_cost_change = () => {},
  on_supplied_material_revenue_change = () => {},
  on_resale_material_cost_change = () => {},
  on_resale_material_revenue_change = () => {},
  on_subcontract_pass_through_cost_change = () => {},
  on_subcontract_pass_through_revenue_change = () => {},
  on_reset = () => {},
}) {
  const [show_optional, set_show_optional] = useState(false);

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Core annual inputs</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Material cost and revenue
            </h2>
          </div>

          <div className="ui-stack">
            <Field
              label="Annual Material Cost"
              value={annual_material_cost}
              onChange={on_annual_material_cost_change}
            />

            <Field
              label="Annual Material Revenue"
              value={annual_material_revenue}
              onChange={on_annual_material_revenue_change}
            />
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => set_show_optional((current) => !current)}
            >
              {show_optional
                ? "Hide structured inputs"
                : "Show structured inputs"}
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_reset}
            >
              Reset
            </button>
          </div>

          {show_optional ? (
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Optional structured inputs</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  These are optional in v1.0 and do not replace the simple annual totals.
                </p>
              </div>

              <Field
                label="Supplied Material Cost"
                value={supplied_material_cost}
                onChange={on_supplied_material_cost_change}
              />

              <Field
                label="Supplied Material Revenue"
                value={supplied_material_revenue}
                onChange={on_supplied_material_revenue_change}
              />

              <Field
                label="Resale Material Cost"
                value={resale_material_cost}
                onChange={on_resale_material_cost_change}
              />

              <Field
                label="Resale Material Revenue"
                value={resale_material_revenue}
                onChange={on_resale_material_revenue_change}
              />

              <Field
                label="Subcontract Pass-through Cost"
                value={subcontract_pass_through_cost}
                onChange={on_subcontract_pass_through_cost_change}
              />

              <Field
                label="Subcontract Pass-through Revenue"
                value={subcontract_pass_through_revenue}
                onChange={on_subcontract_pass_through_revenue_change}
              />
            </div>
          ) : null}

          <div>
            <p className="ui-kicker">Live margin preview</p>
            <div className="ui-stack">
              <div className="ui-readonly">
                <span className="ui-label">Material Margin Annual</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {format_currency(material_margin_annual)}
                </div>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Material Margin %</span>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {Number(material_margin_percent || 0).toFixed(1)}%
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