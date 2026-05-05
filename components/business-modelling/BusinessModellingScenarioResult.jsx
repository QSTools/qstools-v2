"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

export default function BusinessModellingScenarioResult({ scenario_result }) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Scenario result</div>
        <div className="ui-card-title-sm">Projected benchmark outcome</div>
        <p className="ui-help">
          The scenario result shows business performance if the active assumptions hold.
        </p>

        <div className="ui-stack-sm">
          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Revenue</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_total_revenue)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Direct Costs</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_total_direct_costs)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Margin Pool</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_margin_pool)}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Operating Costs</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_total_cost_burden)}
              </div>
            </div>
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Net Position</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_net_position)}
              </div>
            </div>
          </div>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Productive Output</div>
              <div className="labour-summary-table-value">
                {Number(scenario_result.scenario_total_productive_output).toLocaleString("en-NZ", {
                  maximumFractionDigits: 0,
                })}{" "}hrs
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Required Recovery Rate</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_required_recovery_rate)} / hr
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Margin per Productive Hour</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_margin_per_productive_hour)} / hr
              </div>
            </div>
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Recovery Gap</div>
              <div className="labour-summary-table-value">
                {formatCurrency(scenario_result.scenario_recovery_gap_per_hour)} / hr
              </div>
            </div>
          </div>
        </div>

        {scenario_result.scenario_warnings?.length > 0 ? (
          <div className="ui-stack-sm">
            {scenario_result.scenario_warnings.map((warning) => (
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
