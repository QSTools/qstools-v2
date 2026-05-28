"use client";

function format_currency(value, decimals = 0) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value || 0));
}

function format_number(value, maximum_fraction_digits = 0) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maximum_fraction_digits,
  }).format(Number(value || 0));
}

function format_percent(value) {
  return `${format_number(value, 1)}%`;
}

function get_status_label(status) {
  switch (status) {
    case "ready":
      return "Ready";
    case "invalid_zero_productive_hours":
      return "Zero productive hours";
    case "review_zero_cost":
      return "Review zero cost";
    case "review_unassigned_staff_type":
      return "Review staff type";
    default:
      return "Review";
  }
}

export default function ProductiveStaffTypeRatesPanel({
  productive_staff_type_rates = [],
  weighted_all_productive_labour_rate = 0,
  productive_staff_type_rate_warnings = [],
}) {
  const has_rates = productive_staff_type_rates.length > 0;

  return (
    <div className="ui-panel ui-stack">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Labour source truth</div>
        <h2 className="ui-card-title-sm">Productive Staff Type Rates</h2>
        <p className="ui-help">
          Weighted rates by productive staff type. These rates use productive
          staff only and are weighted by productive hours.
        </p>
      </div>

      <div className="ui-panel ui-row-between">
        <div>
          <div className="ui-label">All productive labour weighted rate</div>
          <div className="ui-help">Total productive labour cost divided by productive hours.</div>
        </div>
        <strong>{format_currency(weighted_all_productive_labour_rate, 2)}/hr</strong>
      </div>

      {has_rates ? (
        <div className="labour-summary-table">
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Staff type</div>
            <div className="labour-summary-table-value">Rate</div>
          </div>

          {productive_staff_type_rates.map((rate) => (
            <div
              key={`${rate.staff_type_name}-${rate.rate_status}`}
              className="labour-summary-table-row"
            >
              <div className="labour-summary-table-label">
                <div>{rate.staff_type_name || "Unnamed staff type"}</div>
                <div className="ui-help">
                  {format_number(rate.staff_count)} productive staff ·{" "}
                  {format_currency(rate.total_annual_cost)} annual labour cost ·{" "}
                  {format_number(rate.total_productive_hours)} productive hrs ·{" "}
                  {format_percent(rate.productive_share_percent)} share
                </div>
              </div>
              <div className="labour-summary-table-value">
                <div>{format_currency(rate.weighted_productive_hourly_rate, 2)}/hr</div>
                <div className="ui-help">{get_status_label(rate.rate_status)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ui-help">
          No productive staff type rates are available yet.
        </div>
      )}

      {productive_staff_type_rate_warnings.length > 0 ? (
        <div className="ui-panel ui-stack-sm theme-warn-soft">
          <div className="ui-kicker theme-warn">Review</div>
          {productive_staff_type_rate_warnings.map((warning) => (
            <div key={warning.warning_key} className="ui-help">
              {warning.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
