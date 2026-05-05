"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

export default function BusinessModellingBaselineCard({
  total_revenue,
  total_direct_costs,
  margin_pool,
  total_cost_burden,
  net_position,
  total_productive_output,
  required_recovery_rate,
  current_margin_per_productive_hour,
  recovery_gap_per_hour,
  model_trust_state,
  onRefreshBaseline,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Baseline snapshot</div>
        <div className="ui-card-title-sm">Current business as-is</div>
        <p className="ui-help">
          The baseline is locked from the current Business Summary and remains read-only.
        </p>

        <div className="ui-stack-sm">
          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
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
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Margin Pool</div>
              <div className="labour-summary-table-value">
                {formatCurrency(margin_pool)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Operating Costs</div>
              <div className="labour-summary-table-value">
                {formatCurrency(total_cost_burden)}
              </div>
            </div>
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Net Position</div>
              <div className="labour-summary-table-value">
                {formatCurrency(net_position)}
              </div>
            </div>
          </div>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Productive Hours</div>
              <div className="labour-summary-table-value">
                {Number(total_productive_output).toLocaleString("en-NZ", {
                  maximumFractionDigits: 0,
                })}{" "}hrs
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Required Recovery Rate</div>
              <div className="labour-summary-table-value">
                {formatCurrency(required_recovery_rate)} / hr
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Current Margin per Hour</div>
              <div className="labour-summary-table-value">
                {formatCurrency(current_margin_per_productive_hour)} / hr
              </div>
            </div>
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Recovery Gap</div>
              <div className="labour-summary-table-value">
                {formatCurrency(recovery_gap_per_hour)} / hr
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Trust State</div>
              <div className="labour-summary-table-value">{model_trust_state}</div>
            </div>
          </div>
        </div>

        <button type="button" className="ui-button" onClick={onRefreshBaseline}>
          Refresh Baseline From Current Business
        </button>
      </div>
    </section>
  );
}
