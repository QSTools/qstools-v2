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
  units_sold_annual = 0,
  business_type = "labour_based",
  activity_driver_type = "hours",
  activity_driver_display_label = "Productive hours",
  activity_driver_value = 0,
  activity_driver_suffix = "hrs",
  required_recovery_per_driver = 0,
  required_recovery_label = "Required recovery per hour",
  required_recovery_unit_label = "$/hour",
  current_margin_per_driver = 0,
  current_margin_label = "Current margin per hour",
  recovery_gap_per_driver = 0,
  recovery_gap_label = "Hourly gap",
  net_position = 0,
}) {
  const business_type_label =
    business_type === "product_based"
      ? "Product / Unit-based business"
      : "Service / Labour-based business";

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
          <div className="ui-kicker">Business mode</div>
          <div className="ui-card-title-sm">{business_type_label}</div>
          <p className="ui-help">
            {activity_driver_type === "units"
              ? "Business Summary is calculating recovery through units sold."
              : "Business Summary is calculating recovery through productive hours."}
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
          <div className="ui-kicker">
            {activity_driver_type === "units"
              ? "Per-Unit Reality"
              : "Per-Hour Reality"}
          </div>

          <div className="labour-summary-table">
            <TableRow
              label={required_recovery_label}
              value={`${formatCurrency(
                required_recovery_per_driver
              )} ${required_recovery_unit_label}`}
            />
            <TableRow
              label={current_margin_label}
              value={`${formatCurrency(
                current_margin_per_driver
              )} ${required_recovery_unit_label}`}
            />
            <TableRow
              label={recovery_gap_label}
              value={`${formatCurrency(
                recovery_gap_per_driver
              )} ${required_recovery_unit_label}`}
              total
            />
            <TableRow
              label={activity_driver_display_label}
              value={`${formatNumber(activity_driver_value)} ${activity_driver_suffix}`}
            />
          </div>
        </div>

        {activity_driver_type === "units" ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Product driver source</div>
            <div className="labour-summary-table">
              <TableRow
                label="Units sold per year"
                value={`${formatNumber(units_sold_annual)} units`}
              />
              <TableRow
                label="Productive hours still available"
                value={`${formatNumber(total_productive_output)} hrs`}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}