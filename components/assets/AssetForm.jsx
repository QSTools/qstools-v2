import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

const setup_fields = [["asset_name", "Asset Name", "text"]];

const finance_fields = [
  ["purchase_price", "Purchase Price", "number"],
  ["interest_rate", "Interest Rate (%)", "number"],
  ["finance_term_years", "Finance Term (Years)", "number"],
];

function render_input({ field_name, label, type = "number", value, on_change }) {
  const display_value =
    type === "number"
      ? format_number_with_commas(value)
      : value ?? "";

  return (
    <label key={field_name} className="ui-stack-sm">
      <span className="ui-label">{label}</span>
      <input
        className="ui-input"
        type="text"
        value={display_value}
        onChange={(event) => {
          const raw = event.target.value;

          if (type === "number") {
            on_change(field_name, parse_number_string(raw));
          } else {
            on_change(field_name, raw);
          }
        }}
      />
    </label>
  );
}

export default function AssetForm({ values, on_change, on_reset }) {
  const asset_type =
    values.asset_type === "support" ? "support" : "productive";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Input</div>
          <div className="ui-card-title-sm">Asset Form</div>
          <div className="ui-help">
            List what you own and what it costs you to own it.
          </div>
        </div>

        <div className="ui-stack-sm">
          <div className="ui-kicker">Asset Setup</div>

          {setup_fields.map(([field_name, label, type]) =>
            render_input({
              field_name,
              label,
              type,
              value: values[field_name],
              on_change,
            })
          )}

          <label className="ui-stack-sm">
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

          <label className="ui-stack-sm">
            <span className="ui-label">Effective From</span>
            <input
              className="ui-input"
              type="date"
              value={values.effective_from || ""}
              onChange={(event) =>
                on_change("effective_from", event.target.value)
              }
            />
          </label>

          <div className="ui-split">
            <label className="ui-stack-sm">
              <span className="ui-label">Active</span>
              <input
                type="checkbox"
                checked={Boolean(values.is_active)}
                onChange={(event) =>
                  on_change("is_active", event.target.checked)
                }
              />
            </label>

            <label className="ui-stack-sm">
              <span className="ui-label">Retired</span>
              <input
                type="checkbox"
                checked={Boolean(values.is_retired)}
                onChange={(event) =>
                  on_change("is_retired", event.target.checked)
                }
              />
            </label>
          </div>
        </div>

        <div className="ui-stack-sm">
          <div className="ui-kicker">Finance</div>

          {finance_fields.map(([field_name, label, type]) =>
            render_input({
              field_name,
              label,
              type,
              value: values[field_name],
              on_change,
            })
          )}
        </div>

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
    </section>
  );
}