"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

export default function BusinessModellingDeltaCard({ delta }) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Scenario delta</div>
        <div className="ui-card-title-sm">Live comparison versus baseline</div>
        <p className="ui-help">
          Shows how the active scenario differs from the locked baseline.
        </p>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Annual change</div>
            <div className="labour-summary-table-value">
              {formatCurrency(delta.scenario_delta_annual)} / year
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Per-hour change</div>
            <div className="labour-summary-table-value">
              {formatCurrency(delta.scenario_delta_per_hour)} / hr
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Net position change</div>
            <div className="labour-summary-table-value">
              {formatCurrency(delta.net_position_change)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Margin pool change</div>
            <div className="labour-summary-table-value">
              {formatCurrency(delta.margin_pool_change)}
            </div>
          </div>
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">Recovery gap change</div>
            <div className="labour-summary-table-value">
              {formatCurrency(delta.recovery_gap_change)} / hr
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
