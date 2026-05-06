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
  current_margin_label = "Current margin per hour",
  required_recovery_label = "Required recovery rate",
  recovery_gap_label = "Hourly gap",
  required_recovery_unit_label = "$/hour",
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
              {current_margin_label}
            </div>
            <div className="labour-summary-table-value">
              {formatCurrency(current_margin_per_driver)}{" "}
              {required_recovery_unit_label}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              {required_recovery_label}
            </div>
            <div className="labour-summary-table-value">
              {formatCurrency(required_recovery_per_driver)}{" "}
              {required_recovery_unit_label}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              {recovery_gap_label}
            </div>
            <div className="labour-summary-table-value">
              {formatCurrency(recovery_gap_per_driver)}{" "}
              {required_recovery_unit_label}
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