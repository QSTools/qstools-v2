"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

export default function RevenueCogsStatusStrip({
  revenue_cogs_ready = false,
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  warning_count = 0,
  revenue_cogs_warnings = [],
}) {
  const status_title = revenue_cogs_ready
    ? "Revenue / COGS Ready"
    : "Revenue / COGS Has Warnings";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Trading Summary</div>
        <div className="ui-card-title-sm">{status_title}</div>
        <p className="ui-help">
          Read-only view of classified P&amp;L Revenue and COGS outputs.
        </p>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Revenue</div>
            <div className="labour-summary-table-value">
              {formatCurrency(total_revenue)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Direct Costs</div>
            <div className="labour-summary-table-value">
              {formatCurrency(total_direct_costs)}
            </div>
          </div>
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Margin Pool</div>
            <div className="labour-summary-table-value">
              {formatCurrency(margin_pool)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Warnings</div>
            <div className="labour-summary-table-value">{warning_count}</div>
          </div>
        </div>

        {revenue_cogs_warnings.length > 0 ? (
          <div className="ui-stack-sm">
            {revenue_cogs_warnings.map((warning) => (
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
