"use client";

function to_number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(to_number(value));
}

function format_number(value) {
  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(to_number(value));
}

function SummaryRow({ label, value, helper = "", is_total = false }) {
  return (
    <div className={`labour-summary-table-row ${is_total ? "total" : ""}`}>
      <div className="labour-summary-table-label">
        <div>{label}</div>
        {helper ? <div className="ui-help">{helper}</div> : null}
      </div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

export default function LabourFlowCard({ outputs = {}, has_profile = false }) {
  if (!has_profile) {
    return (
      <section className="ui-section">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Labour cost</div>
          <h2 className="ui-card-title-sm">Live labour cost position</h2>
          <p className="ui-help">
            Create or load a Labour profile first to see the live labour cost
            build.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Labour cost</div>
          <h2 className="ui-card-title-sm">Live labour cost position</h2>
          <p className="ui-help">
            Labour-only cost build before Rate Builder applies customer
            charge-out and margin logic.
          </p>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Hours</div>

            <div className="labour-summary-table">
              <SummaryRow
                label="Paid hours per year"
                value={`${format_number(outputs.paid_hours_per_year)} hrs`}
                helper="Total paid working hours before entitlements and productivity."
              />

              <SummaryRow
                label="Non-productive paid hours"
                value={`${format_number(outputs.non_productive_paid_hours)} hrs`}
                helper="Leave, public holidays, sick leave and other paid non-productive time."
              />

              <SummaryRow
                label="Productive hours"
                value={`${format_number(outputs.productive_hours)} hrs`}
                helper="Paid hours left after entitlements and productivity."
                is_total={true}
              />
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Cost rates</div>

            <div className="labour-summary-table">
              <SummaryRow
                label="Annual labour cost"
                value={format_currency(outputs.total_labour_cost_annual)}
                helper="Wages plus employer contributions."
              />

              <SummaryRow
                label="Loaded labour cost rate"
                value={`${format_currency(outputs.loaded_labour_cost_rate)}/hr`}
                helper="Annual labour cost spread across paid hours."
              />

              <SummaryRow
                label="Productive labour cost rate"
                value={`${format_currency(outputs.productive_labour_cost_rate)}/hr`}
                helper="Annual labour cost spread across productive hours."
                is_total={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}