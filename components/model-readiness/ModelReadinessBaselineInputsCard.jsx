function to_number(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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

function BaselineRow({ label, value, type = "currency", suffix = "" }) {
  const formatted_value =
    type === "number" ? format_number(value) : format_currency(value);

  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-primary)] py-3 last:border-b-0">
      <span className="ui-label">{label}</span>
      <span className="text-right text-sm font-semibold text-[var(--text-primary)]">
        {formatted_value}
        {suffix}
      </span>
    </div>
  );
}

export default function ModelReadinessBaselineInputsCard({ status = {} }) {
  const total_operating_cost =
    status.module_total_business_costs ??
    status.total_cost_burden ??
    status.total_business_costs ??
    0;

  const operating_recovery_hours =
    status.total_productive_output ??
    status.normalised_reconciliation_inputs?.total_productive_output ??
    0;

  const required_recovery_rate =
    operating_recovery_hours > 0
      ? total_operating_cost / operating_recovery_hours
      : 0;

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Baseline Inputs</div>
          <h2 className="ui-display">What this is based on</h2>
        </div>

        <div className="ui-panel">
          <BaselineRow
            label="Total Operating Cost"
            value={total_operating_cost}
          />

          <BaselineRow
            label="Operating Recovery Hours"
            value={operating_recovery_hours}
            type="number"
            suffix=" hr"
          />

          <BaselineRow
            label="Required Recovery Rate"
            value={required_recovery_rate}
          />
        </div>

        <p className="ui-help">
          The selected period changes the display scale only. The baseline is
          still built from total operating cost and operating recovery hours.
          This is your break-even cost baseline. Materials and profit sit on top.
        </p>
      </div>
    </section>
  );
}