"use client";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export default function RevenueRealityStatusStrip({
  status_title = "Revenue Reality Has Warnings",
  total_revenue = 0,
  total_direct_costs = 0,
  material_margin = 0,
  total_labour_cost_annual = 0,
  stress_tested_margin_after_labour = 0,
  warning_count = 0,
  revenue_reality_warnings = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Revenue Reality</div>
        <div className="ui-card-title-sm">{status_title}</div>
        <p className="ui-help">
          Read-only diagnostic view of P&amp;L GP / Material Margin after real
          labour cost is enforced.
        </p>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Revenue</div>
            <div className="labour-summary-table-value">
              {format_currency(total_revenue)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              COGS / Direct Costs
            </div>
            <div className="labour-summary-table-value">
              {format_currency(total_direct_costs)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              P&amp;L GP / Material Margin
            </div>
            <div className="labour-summary-table-value">
              {format_currency(material_margin)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Labour Cost</div>
            <div className="labour-summary-table-value">
              {format_currency(total_labour_cost_annual)}
            </div>
          </div>
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              Stress-tested Margin after Labour
            </div>
            <div className="labour-summary-table-value">
              {format_currency(stress_tested_margin_after_labour)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Warnings</div>
            <div className="labour-summary-table-value">{warning_count}</div>
          </div>
        </div>

        {revenue_reality_warnings.length > 0 ? (
          <div className="ui-stack-sm">
            {revenue_reality_warnings.map((warning) => (
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
