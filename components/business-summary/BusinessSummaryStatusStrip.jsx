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
  current_margin_per_driver = 0,
  required_recovery_per_driver = 0,
  recovery_gap_per_driver = 0,
  required_labour_burden_rate = 0,
  macro_required_operating_hour_rate = 0,
  net_annual_business_open_hours = 0,
  total_productive_output = 0,
  current_margin_label = "Current margin per hour",
  required_recovery_label = "Required recovery rate",
  recovery_gap_label = "Hourly gap",
  required_recovery_unit_label = "$/hour",
  warning_count = 0,
  business_summary_warnings = [],
}) {
  const macro_val = formatCurrency(macro_required_operating_hour_rate);
  const macro_hours = Number(net_annual_business_open_hours || 0).toFixed(1);

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business Summary</div>
        <div className="ui-card-title-sm">Current business mirror</div>
        <p className="ui-help">Read-only comparison of trading output and operating cost burden.</p>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Net Position</div>
            <div className="labour-summary-table-value">{formatCurrency(net_position)}</div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Required operating cost per open hour</div>
            <div className="labour-summary-table-value">{macro_val} $/open hr</div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Based on</div>
            <div className="labour-summary-table-value">{macro_hours} net annual business open hours</div>
          </div>

          <div style={{ height: 8 }} />

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Warnings</div>
            <div className="labour-summary-table-value">{warning_count}</div>
          </div>
        </div>

        {business_summary_warnings.length > 0 ? (
          <div className="ui-stack-sm">
            {business_summary_warnings.map((warning) => (
              <p className="ui-help" key={warning.warning_id}>{warning.message}</p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}