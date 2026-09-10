import { useEffect } from "react";
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
  default_annual_weeks = 48,
}) {
  const asset_type = values.asset_type === "support" ? "support" : "productive";
  const asset_status = values.is_retired ? "retired" : "active";

  const finance_status = values.finance_paid_off
    ? "paid_off"
    : values.finance_term_extended
      ? "term_extended"
      : "finance_active";

  const has_scheduled_hours =
    values.scheduled_hours_per_week !== undefined &&
    values.scheduled_hours_per_week !== null &&
    values.scheduled_hours_per_week !== "";

  // Downtime model: guide the user toward the calculated approach by
  // pre-filling scheduled_hours_per_week from whatever this asset is
  // already recording, the first time this asset is loaded with no
  // scheduled hours set. This is a guide only, not a silent bulk
  // migration - nothing is written to storage until the user saves,
  // and it never overwrites a value the user has already entered.
  useEffect(() => {
    if (asset_type !== "productive") {
      return;
    }

    if (has_scheduled_hours) {
      return;
    }

    if (typeof on_change !== "function") {
      return;
    }

    const guide_value = Number(values.utilisation_hours_per_week || 40);
    on_change("scheduled_hours_per_week", guide_value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.asset_id, asset_type, has_scheduled_hours]);

  const scheduled_hours_per_week = Number(values.scheduled_hours_per_week || 0);
  const downtime_hours_per_week = Number(values.downtime_hours_per_week || 0);
  const calculated_hours_used_per_week = Math.max(
    scheduled_hours_per_week - downtime_hours_per_week,
    0
  );
  const downtime_exceeds_scheduled =
    has_scheduled_hours && downtime_hours_per_week > scheduled_hours_per_week;

  function handle_asset_status_change(next_status) {
    const is_retired = next_status === "retired";
    on_change("is_active", !is_retired);
    on_change("is_retired", is_retired);
  }

  function handle_asset_type_change(next_asset_type) {
    if (typeof on_bulk_change === "function") {
      const effective_annual_weeks =
        Number(values.asset_annual_weeks_override) > 0
          ? Number(values.asset_annual_weeks_override)
          : Number(default_annual_weeks) || 48;

      const next_scheduled_hours_per_week =
        next_asset_type === "productive"
          ? Number(values.scheduled_hours_per_week || 40)
          : null;
      const next_downtime_hours_per_week =
        next_asset_type === "productive"
          ? Number(values.downtime_hours_per_week || 0)
          : 0;
      const next_utilisation_hours_per_week =
        next_asset_type === "productive"
          ? Math.max(
              next_scheduled_hours_per_week - next_downtime_hours_per_week,
              0
            )
          : 0;

      on_bulk_change({
        asset_type: next_asset_type,
        scheduled_hours_per_week: next_scheduled_hours_per_week,
        downtime_hours_per_week: next_downtime_hours_per_week,
        utilisation_hours_per_week: next_utilisation_hours_per_week,
        utilisation_hours_annual:
          next_asset_type === "productive"
            ? next_utilisation_hours_per_week * effective_annual_weeks
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
            <>
              <label className="ui-stack-sm">
                <span className="ui-label">Scheduled hours per week</span>
                <input
                  className="ui-input"
                  type="text"
                  placeholder={`Business opening hours: ${format_number_with_commas(
                    default_annual_weeks > 0 ? default_annual_weeks : 48
                  )} weeks/year is used for annual conversion - enter this asset's own weekly schedule`}
                  value={
                    has_scheduled_hours
                      ? format_number_with_commas(values.scheduled_hours_per_week)
                      : ""
                  }
                  onChange={(event) =>
                    on_change(
                      "scheduled_hours_per_week",
                      parse_number_string(event.target.value)
                    )
                  }
                />
                <span className="ui-help">
                  The theoretical hours this asset is scheduled to run in a
                  normal week, before accounting for downtime.
                </span>
              </label>

              <label className="ui-stack-sm">
                <span className="ui-label">Downtime hours per week</span>
                <input
                  className="ui-input"
                  type="text"
                  value={format_number_with_commas(
                    values.downtime_hours_per_week ?? 0
                  )}
                  onChange={(event) =>
                    on_change(
                      "downtime_hours_per_week",
                      parse_number_string(event.target.value)
                    )
                  }
                />
                <span className="ui-help">
                  Scheduled maintenance, servicing, or expected breakdown
                  time. Hours the asset is unavailable even though it is
                  scheduled to run.
                </span>
              </label>

              <div className="ui-readonly">
                <span className="ui-label">
                  Hours used per week (calculated)
                </span>
                <div className="ui-help">
                  {format_number_with_commas(calculated_hours_used_per_week)}
                </div>
                {downtime_exceeds_scheduled ? (
                  <div className="ui-help" style={{ color: "var(--danger)" }}>
                    Downtime exceeds scheduled hours - hours used per week is
                    floored at zero. Check these two figures.
                  </div>
                ) : null}
              </div>

              <label className="ui-stack-sm">
                <span className="ui-label">
                  Annual weeks operated (optional override)
                </span>
                <input
                  className="ui-input"
                  type="text"
                  placeholder={`Default: ${format_number_with_commas(
                    default_annual_weeks
                  )} weeks (from Opening Hours)`}
                  value={
                    values.asset_annual_weeks_override
                      ? format_number_with_commas(
                          values.asset_annual_weeks_override
                        )
                      : ""
                  }
                  onChange={(event) =>
                    on_change(
                      "asset_annual_weeks_override",
                      parse_number_string(event.target.value)
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.target.blur();
                    }
                  }}
                />
                <span className="ui-help">
                  Leave blank to use the business calendar from Opening
                  Hours ({format_number_with_commas(default_annual_weeks)}{" "}
                  weeks/year). Set a different number if this asset runs on
                  its own calendar - e.g. a 24/7 asset that doesn&apos;t take
                  shutdown weeks.
                </span>
              </label>
            </>
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