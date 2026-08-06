"use client";

function format_currency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString()}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

function ComparisonRow({ check }) {
  const has_amounts =
    check.source_amount !== undefined && check.module_amount !== undefined;

  return (
    <div className="ui-readonly">
      <div className="ui-actions">
        <span className="ui-label">{check.label}</span>
        <Pill
          text={check.status === "pass" ? "Reconciled" : "Variance"}
          tone={check.status === "pass" ? "good" : "bad"}
        />
      </div>

      {has_amounts ? (
        <div className="text-sm text-[var(--text-primary)]">
          P&amp;L: {format_currency(check.source_amount)} &middot; Module:{" "}
          {format_currency(check.module_amount)} &middot; Gap:{" "}
          {format_currency(check.variance_amount)}
          {check.source_amount > 0
            ? ` (${format_percent(check.variance_percent)})`
            : ""}
        </div>
      ) : null}

      <p className="text-sm text-[var(--text-secondary)]">{check.detail}</p>

      {Array.isArray(check.possible_reasons) &&
      check.possible_reasons.length > 0 ? (
        <div className="ui-stack">
          <p className="ui-kicker">Possible reasons</p>
          <ul className="text-sm text-[var(--text-secondary)]">
            {check.possible_reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function ModuleReconciliationComparisonCard({ checks = [] }) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Comparison</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              P&amp;L benchmark vs module totals
            </h2>
          </div>

          <div className="ui-stack">
            {checks.map((check) => (
              <ComparisonRow key={check.id} check={check} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}