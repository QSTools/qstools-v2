const number_fields = [
  ["purchase_price", "Purchase Price"],
  ["interest_rate", "Interest Rate (%)"],
  ["finance_term_years", "Finance Term (Years)"],
  ["maintenance_cost_monthly", "Maintenance Cost Monthly"],
  ["fuel_cost_monthly", "Fuel Cost Monthly"],
  ["registration_cost_monthly", "Registration Cost Monthly"],
  ["other_running_cost_monthly", "Other Running Cost Monthly"],
];

const productive_fields = [
  ["available_hours_per_year", "Available Hours per Year"],
  ["utilisation_percent", "Utilisation (%)"],
];

export default function AssetForm({
  values,
  on_change,
  on_reset,
  on_new_asset,
  on_save_asset,
}) {
  const asset_type =
    values.asset_type === "support" ? "support" : "productive";

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <p className="ui-kicker">Input</p>
              <h2 className="text-xl font-semibold">Asset Form</h2>
              <p className="ui-help">
                Set up the asset, its annual cash-cost inputs, and productive capacity.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                className="ui-button-secondary"
                onClick={on_new_asset}
              >
                New Asset
              </button>
              <button
                type="button"
                className="ui-button-primary"
                onClick={on_save_asset}
              >
                Save Asset
              </button>
            </div>
          </div>

          <label className="ui-stack">
            <span className="ui-label">Asset Name</span>
            <input
              className="ui-input"
              type="text"
              value={values.asset_name || ""}
              onChange={(event) => on_change("asset_name", event.target.value)}
            />
          </label>

          <label className="ui-stack">
            <span className="ui-label">Asset Type</span>
            <select
              className="ui-input"
              value={asset_type}
              onChange={(event) => on_change("asset_type", event.target.value)}
            >
              <option value="productive">Productive</option>
              <option value="support">Support</option>
            </select>
          </label>

          {number_fields.map(([field_name, label]) => (
            <label key={field_name} className="ui-stack">
              <span className="ui-label">{label}</span>
              <input
                className="ui-input"
                type="number"
                value={values[field_name] ?? 0}
                onChange={(event) => on_change(field_name, event.target.value)}
              />
            </label>
          ))}

          {productive_fields.map(([field_name, label]) => (
            <label key={field_name} className="ui-stack">
              <span className="ui-label">{label}</span>
              <input
                className="ui-input"
                type="number"
                value={values[field_name] ?? 0}
                onChange={(event) => on_change(field_name, event.target.value)}
              />
            </label>
          ))}

          <p className="ui-help">
            Productive assets generate revenue directly and are used in recovery units.
            Support assets remain part of cost only and are excluded from recovery-unit logic.
          </p>

          <label className="ui-stack">
            <span className="ui-label">Effective From</span>
            <input
              className="ui-input"
              type="date"
              value={values.effective_from || ""}
              onChange={(event) => on_change("effective_from", event.target.value)}
            />
          </label>

          <label className="ui-stack">
            <span className="ui-label">Active</span>
            <input
              type="checkbox"
              checked={Boolean(values.is_active)}
              onChange={(event) => on_change("is_active", event.target.checked)}
            />
          </label>

          <label className="ui-stack">
            <span className="ui-label">Retired</span>
            <input
              type="checkbox"
              checked={Boolean(values.is_retired)}
              onChange={(event) => on_change("is_retired", event.target.checked)}
            />
          </label>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_reset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}