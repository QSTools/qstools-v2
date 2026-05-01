"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

export default function BusinessSummaryStatusStrip({
  net_position = 0,
  current_margin_per_hour = 0,
  required_recovery_rate = 0,
  hourly_gap = 0,
  warning_count = 0,
  business_summary_warnings = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business Summary</div>
        <div className="ui-card-title-sm">Current business mirror</div>
        <p className="ui-help">
          Read-only comparison of trading output and operating cost burden.
        </p>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Net Position</div>
            <div className="labour-summary-table-value">
              {formatCurrency(net_position)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Current Margin per Hour
            </div>
            <div className="labour-summary-table-value">
              {formatCurrency(current_margin_per_hour)} / hr
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Required Recovery Rate
            </div>
            <div className="labour-summary-table-value">
              {formatCurrency(required_recovery_rate)} / hr
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Hourly Gap</div>
            <div className="labour-summary-table-value">
              {formatCurrency(hourly_gap)} / hr
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Warnings</div>
            <div className="labour-summary-table-value">{warning_count}</div>
          </div>
        </div>

        {business_summary_warnings.length > 0 ? (
          <div className="ui-stack-sm">
            {business_summary_warnings.map((warning) => (
              <p className="ui-help" key={warning.warning_id}>
                {warning.message}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
