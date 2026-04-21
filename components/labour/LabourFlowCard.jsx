"use client";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function SummaryRow({ label, value, is_total = false }) {
  return (
    <div className={`labour-summary-table-row ${is_total ? "total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

export default function LabourFlowCard({
  outputs = {},
  state = {},
  has_profile = false,
}) {
  if (!has_profile) {
    return (
      <section className="ui-section">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Rate Builder</div>
          <h2 className="ui-card-title-sm">Live rate position</h2>
          <p className="ui-help">
            Create or load a Labour profile first to see the live Labour-only
            rate build.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Rate Builder</div>
          <h2 className="ui-card-title-sm">Live rate position</h2>
          <p className="ui-help">
            Labour-only build. Staff overheads and wider business overheads are
            added later.
          </p>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Rates</div>

            <div className="labour-summary-table">
              <SummaryRow
                label="Loaded Cost Rate"
                value={format_currency(outputs.loaded_labour_cost_rate)}
              />

              <SummaryRow
                label="Productive Cost Rate"
                value={format_currency(outputs.productive_labour_cost_rate)}
                is_total={true}
              />

              <SummaryRow
                label="Minimum Charge-Out"
                value={format_currency(outputs.minimum_charge_out_rate)}
                is_total={true}
              />

              <SummaryRow
                label="Current Charge-Out"
                value={format_currency(state.charge_out_rate)}
              />

              <SummaryRow
                label="Profit per Hour"
                value={format_currency(outputs.profit_per_hour)}
              />

              <SummaryRow
                label="Above Recovery"
                value={format_currency(outputs.above_recovery)}
                is_total={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}