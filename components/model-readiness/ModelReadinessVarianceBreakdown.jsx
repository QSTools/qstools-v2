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

function format_percent(value) {
  return `${to_number(value).toFixed(1)}%`;
}

function get_variance_percent(variance, benchmark) {
  const base = Math.abs(to_number(benchmark));

  if (base <= 0) {
    return Math.abs(to_number(variance)) > 0 ? 100 : 0;
  }

  return (Math.abs(to_number(variance)) / base) * 100;
}

function get_variance_level(variance, benchmark, override_title = "") {
  const variance_amount = Math.abs(to_number(variance));
  const variance_percent = get_variance_percent(variance, benchmark);

  if (override_title) {
    return {
      title: override_title,
      pill: variance_amount < 1 || variance_percent < 1 ? "PASS" : "REVIEW",
      severity: variance_amount < 1 || variance_percent < 1 ? "clear" : "minor",
    };
  }

  if (variance_amount < 1 || variance_percent < 1) {
    return {
      title: "Reconciled",
      pill: "PASS",
      severity: "clear",
    };
  }

  if (variance_percent <= 5) {
    return {
      title: "Minor variance detected",
      pill: "REVIEW",
      severity: "minor",
    };
  }

  return {
    title: "Material variance detected",
    pill: "REVIEW",
    severity: "material",
  };
}

function get_direction_text(variance) {
  const amount = to_number(variance);

  if (amount > 0) {
    return "The module total is higher than the P&L benchmark.";
  }

  if (amount < 0) {
    return "The module total is lower than the P&L benchmark.";
  }

  return "The module total reconciles to the P&L benchmark.";
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

function VariancePercentRow({ value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-primary)] py-3 last:border-b-0">
      <span className="ui-label">Variance %</span>
      <span className="max-w-[60%] break-words text-right text-sm font-semibold text-[var(--text-primary)]">
        {format_percent(value)}
      </span>
    </div>
  );
}

function VarianceBlock({
  label,
  pnl,
  module_total,
  variance,
  note,
  show_percent = true,
  benchmark_label = "P&L benchmark",
  module_label = "Module total",
  override_title = "",
  extra_rows = [],
  direction_override = "",
}) {
  const variance_percent = get_variance_percent(variance, pnl);
  const variance_level = get_variance_level(variance, pnl, override_title);
  const direction_text = direction_override || get_direction_text(variance);

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="ui-kicker">{label}</div>
          <h3 className="ui-card-title-sm">{variance_level.title}</h3>
        </div>

        <span className="ui-pill">{variance_level.pill}</span>
      </div>

      <div className="ui-panel">
        <DiagnosticRow label={benchmark_label} value={pnl} />

        {extra_rows.map((row) => (
          <DiagnosticRow
            key={row.label}
            label={row.label}
            value={row.value}
          />
        ))}

        <DiagnosticRow label={module_label} value={module_total} />
        <DiagnosticRow label="Variance" value={variance} />

        {show_percent ? <VariancePercentRow value={variance_percent} /> : null}
      </div>

      <div className="ui-stack-sm">
        <p className="ui-help">{direction_text}</p>
        <p className="ui-help">{note}</p>
      </div>
    </div>
  );
}

export default function ModelReadinessVarianceBreakdown({ status = {} }) {
  const normalised = status.normalised_reconciliation_inputs ?? {};

  const pnl_labour = to_number(
    status.labour_benchmark_total ?? normalised.labour_benchmark_total,
  );
  const module_labour = to_number(
    status.total_labour_cost_annual ?? normalised.total_labour_cost_annual,
  );

  const pnl_asset_finance = to_number(
    status.asset_finance_benchmark_total ??
      normalised.asset_finance_benchmark_total,
  );
  const module_asset_finance = to_number(
    status.total_asset_interest_annual ??
      normalised.total_asset_interest_annual,
  );

  const pnl_asset_operating = to_number(
    status.assets_benchmark_total ?? normalised.assets_benchmark_total,
  );

  const pnl_overheads_gross = to_number(
    status.general_overheads_benchmark_total ??
      normalised.general_overheads_benchmark_total,
  );

  const asset_finance_exclusion = pnl_asset_finance;

  const pnl_overheads_adjusted =
    pnl_overheads_gross - asset_finance_exclusion;

  const module_overheads = to_number(
    status.total_general_overheads ?? normalised.total_general_overheads,
  );

  const overhead_variance = module_overheads - pnl_overheads_adjusted;

  const overhead_is_reconciled_after_exclusion =
    Math.abs(overhead_variance) < 1;

  const pnl_total =
    to_number(status.setup_module_benchmark_total) ||
    to_number(normalised.setup_module_benchmark_total) ||
    pnl_labour + pnl_asset_operating + pnl_overheads_gross ||
    to_number(status.total_business_costs);

  const module_total =
    to_number(status.module_total_business_costs) ||
    module_labour +
      to_number(
        status.total_asset_cost_annual ?? normalised.total_asset_cost_annual,
      ) +
      module_overheads;

  const total_variance = module_total - pnl_total;

  const rows = [
    {
      label: "Total Business Cost",
      pnl: pnl_total,
      module_total,
      variance: total_variance,
      benchmark_label: "P&L benchmark",
      module_label: "Module total",
      note:
        "This is the overall trust check. Model Readiness is blocked when the total QS Tools module cost does not reconcile to the P&L benchmark and the variance has not been explained.",
    },
    {
      label: "Labour",
      pnl: pnl_labour,
      module_total: module_labour,
      variance: module_labour - pnl_labour,
      benchmark_label: "P&L labour benchmark",
      module_label: "Labour module total",
      note:
        "Labour variance is a review signal, not a conclusion. A small variance may reflect timing, current pay assumptions, staff mix, rounding, or P&L classification differences. A larger variance may point to current staffing changes, under-classified labour costs, additional labour burden, or period mismatch. It should not be treated as overtime unless actual paid hours and standard hours confirm it.",
    },
    {
      label: "Asset Finance",
      pnl: pnl_asset_finance,
      module_total: module_asset_finance,
      variance: module_asset_finance - pnl_asset_finance,
      benchmark_label: "P&L interest marked as asset finance",
      module_label: "Assets finance / interest cost",
      note:
        "This compares P&L interest marked as asset finance against the Assets module finance / interest cost. Broader P&L asset/equipment lines such as repairs, registrations, licences, and vehicle expenses are classification review items, not the direct finance benchmark.",
    },
    {
      label: "General Overheads",
      pnl: pnl_overheads_adjusted,
      module_total: module_overheads,
      variance: overhead_variance,
      benchmark_label: "Adjusted P&L overhead benchmark",
      module_label: "General Overheads module total",
      override_title: overhead_is_reconciled_after_exclusion
        ? "Reconciled after asset finance exclusion"
        : "",
      direction_override: overhead_is_reconciled_after_exclusion
        ? "General Overheads reconciles once asset finance interest is removed from the P&L overhead benchmark."
        : "",
      extra_rows: [
        {
          label: "Gross P&L overhead benchmark",
          value: pnl_overheads_gross,
        },
        {
          label: "Less asset finance interest",
          value: -asset_finance_exclusion,
        },
      ],
      note:
        "General Overheads should reconcile to the adjusted P&L overhead benchmark after asset finance interest has been removed. Asset finance is reviewed separately against the Assets module finance / interest cost.",
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
            explained. Variance is a diagnostic signal, not an automatic
            conclusion.
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
              benchmark_label={row.benchmark_label}
              module_label={row.module_label}
              note={row.note}
              override_title={row.override_title}
              extra_rows={row.extra_rows}
              direction_override={row.direction_override}
            />
          ))}
        </div>

        {pnl_asset_operating > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Asset operating classification signal</div>
            <p className="ui-help">
              P&amp;L asset/equipment operating benchmark:{" "}
              <strong>{format_currency(pnl_asset_operating)}</strong>
            </p>
            <p className="ui-help">
              This is retained as diagnostic evidence only. It should not be
              compared directly against asset finance interest. Review these
              lines separately for repairs, registrations, licences, vehicle
              expenses, consumables, or other operating classifications.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}