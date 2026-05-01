"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatNumber(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 0,
  }).format(number);
}

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

export default function BusinessSummaryCard({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  total_cost_burden = 0,
  total_productive_output = 0,
  required_recovery_rate = 0,
  net_position = 0,
  current_margin_per_hour = 0,
  hourly_gap = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Business Snapshot</div>
          <div className="ui-card-title">Current position</div>
          <p className="ui-help">
            Factual summary of trading output compared with operating costs.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Macro Position</div>
          <div className="labour-summary-table">
            <TableRow label="Revenue" value={formatCurrency(total_revenue)} />
            <TableRow
              label="Direct Costs"
              value={formatCurrency(total_direct_costs)}
            />
            <TableRow
              label="Margin Pool"
              value={formatCurrency(margin_pool)}
            />
            <TableRow
              label="Gross Margin %"
              value={formatPercent(gross_margin_percent)}
            />
            <TableRow
              label="Operating Costs"
              value={formatCurrency(total_cost_burden)}
            />
            <TableRow
              label="Net Position"
              value={formatCurrency(net_position)}
              total
            />
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Per-Hour Reality</div>
          <div className="labour-summary-table">
            <TableRow
              label="Required to run business"
              value={`${formatCurrency(required_recovery_rate)} / hr`}
            />
            <TableRow
              label="Current margin per hour"
              value={`${formatCurrency(current_margin_per_hour)} / hr`}
            />
            <TableRow
              label="Hourly gap"
              value={`${formatCurrency(hourly_gap)} / hr`}
              total
            />
            <TableRow
              label="Productive Hours"
              value={`${formatNumber(total_productive_output)} hrs`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
