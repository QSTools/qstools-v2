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

function DiagnosticRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-primary)] py-3 last:border-b-0">
      <span className="ui-label">{label}</span>
      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-[var(--text-primary)]">
        {format_currency(value)}
      </span>
    </div>
  );
}

function VarianceBlock({ label, pnl, module_total, variance, note, force_review = false }) {
  const is_clear = Math.abs(to_number(variance)) < 1 && !force_review;

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="ui-kicker">{label}</div>
          <h3 className="ui-card-title-sm">
            {is_clear ? "Reconciled" : "Variance detected"}
          </h3>
        </div>

        <span className="ui-pill">{is_clear ? "PASS" : "REVIEW"}</span>
      </div>

      <div className="ui-panel">
        <DiagnosticRow label="P&L benchmark" value={pnl} />
        <DiagnosticRow label="Module total" value={module_total} />
        <DiagnosticRow label="Variance" value={variance} />
      </div>

      <p className="ui-help">{note}</p>
    </div>
  );
}

export default function ModelReadinessVarianceBreakdown({ status = {} }) {
  const pnl_labour = to_number(status.labour_benchmark_total);
  const module_labour = to_number(status.total_labour_cost_annual);

  const pnl_assets = to_number(status.assets_benchmark_total);
  const module_assets = to_number(status.total_asset_cost_annual);

  const pnl_overheads = to_number(status.general_overheads_benchmark_total);
  const module_overheads = to_number(status.total_general_overheads);

  const pnl_total =
    to_number(status.setup_module_benchmark_total) ||
    pnl_labour + pnl_assets + pnl_overheads ||
    to_number(status.total_business_costs);

  const module_total =
    to_number(status.module_total_business_costs) ||
    module_labour + module_assets + module_overheads;

  const total_variance = module_total - pnl_total;

  const rows = [
    {
      label: "Total Business Cost",
      pnl: pnl_total,
      module_total,
      variance: total_variance,
      force_review: Math.abs(total_variance) >= 1,
      note:
        "This is the total reconciliation check. Model Readiness is blocked when the total QS Tools module cost does not reconcile to the P&L benchmark or the variance has not been explained.",
    },
    {
      label: "Labour",
      pnl: pnl_labour,
      module_total: module_labour,
      variance: module_labour - pnl_labour,
      note:
        "Labour may differ where the live Labour module reflects current staffing, current pay rates, or future operating assumptions rather than the historical P&L period.",
    },
    {
      label: "Assets",
      pnl: pnl_assets,
      module_total: module_assets,
      variance: module_assets - pnl_assets,
      note:
        "Asset variance may be expected where QS Tools includes asset ownership cost but the P&L only shows interest, or where year-end finance/depreciation journals are not yet posted.",
    },
    {
      label: "General Overheads",
      pnl: pnl_overheads,
      module_total: module_overheads,
      variance: module_overheads - pnl_overheads,
      note:
        "General Overheads should normally reconcile to zero variance. If this is out, review P&L classification or the General Overheads module mapping.",
    },
  ];

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Variance Breakdown</div>
          <h2 className="ui-display">What needs attention</h2>
          <p className="ui-help">
            This compares the P&amp;L benchmark against the live QS Tools module
            totals. Model Readiness is blocked when material variance is not
            explained.
          </p>
        </div>

        <div className="ui-stack-sm">
          {rows.map((row) => (
            <VarianceBlock
              key={row.label}
              label={row.label}
              pnl={row.pnl}
              module_total={row.module_total}
              variance={row.variance}
              note={row.note}
              force_review={row.force_review}
            />
          ))}
        </div>
      </div>
    </section>
  );
}