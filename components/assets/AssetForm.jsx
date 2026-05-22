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
    type === "number" ? format_number_with_commas(value) : value ?? "";

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

export default function AssetForm({
  values,
  on_change,
  on_bulk_change,
  on_reset,
}) {
  const asset_type = values.asset_type === "support" ? "support" : "productive";
  const asset_status = values.is_retired ? "retired" : "active";

  const finance_status = values.finance_paid_off
    ? "paid_off"
    : values.finance_term_extended
      ? "term_extended"
      : "finance_active";

  function handle_asset_status_change(next_status) {
    const is_retired = next_status === "retired";
    on_change("is_active", !is_retired);
    on_change("is_retired", is_retired);
  }

  function handle_asset_type_change(next_asset_type) {
    if (typeof on_bulk_change === "function") {
      on_bulk_change({
        asset_type: next_asset_type,
        utilisation_hours_per_week:
          next_asset_type === "productive"
            ? Number(values.utilisation_hours_per_week || 40)
            : 0,
        utilisation_hours_annual:
          next_asset_type === "productive"
            ? Number(values.utilisation_hours_per_week || 40) * 48
            : 0,
      });
      return;
    }

    on_change("asset_type", next_asset_type);
  }

  function handle_finance_status_change(next_status) {
    if (next_status === "paid_off") {
      on_change("finance_paid_off", true);
      on_change("finance_term_extended", false);
      on_change("finance_paid_off_date", "");
      on_change("revised_finance_end_date", "");
      on_change("revised_term_months", 0);
      return;
    }

    if (next_status === "term_extended") {
      on_change("finance_paid_off", false);
      on_change("finance_term_extended", true);
      on_change("finance_paid_off_date", "");
      on_change("revised_finance_end_date", "");
      return;
    }

    on_change("finance_paid_off", false);
    on_change("finance_term_extended", false);
    on_change("finance_paid_off_date", "");
    on_change("revised_finance_end_date", "");
    on_change("revised_term_months", 0);
  }

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
              onChange={(event) => handle_asset_type_change(event.target.value)}
            >
              <option value="productive">Productive</option>
              <option value="support">Support</option>
            </select>
          </label>

          {asset_type === "productive" ? (
            <label className="ui-stack-sm">
              <span className="ui-label">Hours used per week</span>
              <input
                className="ui-input"
                type="text"
                value={format_number_with_commas(
                  values.utilisation_hours_per_week ?? 40
                )}
                onChange={(event) =>
                  on_change(
                    "utilisation_hours_per_week",
                    parse_number_string(event.target.value)
                  )
                }
              />
              <span className="ui-help">
                How many hours per week is this asset actually used?
              </span>
            </label>
          ) : null}

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
        </div>

        <div className="ui-stack-sm">
          <div className="ui-kicker">Status</div>

          <label className="ui-stack-sm">
            <span className="ui-label">Asset Status</span>
            <select
              className="ui-input"
              value={asset_status}
              onChange={(event) =>
                handle_asset_status_change(event.target.value)
              }
            >
              <option value="active">Active</option>
              <option value="retired">Retired</option>
            </select>
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Finance Status</span>
            <select
              className="ui-input"
              value={finance_status}
              onChange={(event) =>
                handle_finance_status_change(event.target.value)
              }
            >
              <option value="finance_active">Finance active</option>
              <option value="paid_off">Paid off early</option>
              <option value="term_extended">Term extended</option>
            </select>
          </label>

          <label className="ui-stack-sm">
            <input
              type="checkbox"
              checked={values.no_active_assets_confirmed === true}
              onChange={(event) =>
                on_change("no_active_assets_confirmed", event.target.checked)
              }
            />
            <span>No active assets to include</span>
          </label>
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

          <label className="ui-stack-sm">
            <span className="ui-label">Finance Start Date</span>
            <input
              className="ui-input"
              type="date"
              value={values.finance_start_date || ""}
              onChange={(event) =>
                on_change("finance_start_date", event.target.value)
              }
            />
          </label>
        </div>

        {values.finance_paid_off === true ? (
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Early Payoff</div>
              <p className="ui-help">
                Use this when the asset remains active but the finance has been
                paid off early. Future interest, principal and finance payments
                will be treated as zero.
              </p>

              <label className="ui-stack-sm">
                <span className="ui-label">Paid Off Date</span>
                <input
                  className="ui-input"
                  type="date"
                  value={values.finance_paid_off_date || ""}
                  onChange={(event) =>
                    on_change("finance_paid_off_date", event.target.value)
                  }
                />
              </label>
            </div>
          </div>
        ) : null}

        {values.finance_term_extended === true ? (
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Term Extension</div>
              <p className="ui-help">
                Use this when the finance agreement has been extended. The
                current finance outputs will use the original term plus the
                extension months.
              </p>

              {render_input({
                field_name: "revised_term_months",
                label: "Extension Months",
                type: "number",
                value: values.revised_term_months,
                on_change,
              })}
            </div>
          </div>
        ) : null}

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
