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

function AmountStack({ source_amount, module_amount, variance_amount, variance_percent }) {
  const show_percent = source_amount > 0;

  return (
    <div className="module-reconciliation-amount-stack">
      <div className="module-reconciliation-amount-row">
        <span className="module-reconciliation-amount-label">P&amp;L</span>
        <span className="module-reconciliation-amount-value">
          {format_currency(source_amount)}
        </span>
      </div>

      <div className="module-reconciliation-amount-row">
        <span className="module-reconciliation-amount-label">Module</span>
        <span className="module-reconciliation-amount-value">
          {format_currency(module_amount)}
        </span>
      </div>

      <div className="module-reconciliation-amount-row is-gap">
        <span className="module-reconciliation-amount-label">Gap</span>
        <span className="module-reconciliation-amount-value">
          {format_currency(variance_amount)}
          {show_percent ? ` (${format_percent(variance_percent)})` : ""}
        </span>
      </div>
    </div>
  );
}

// Real named-item breakdown (per-asset finance, or per-staff
// owner/director cost). Also quantifies how much of the total gap
// this breakdown accounts for, and what remains unexplained - a
// factual statement about the numbers we have, not a guess about
// the remaining cause.
function NamedAmountBreakdown({ title, rows = [], note, gap_amount }) {
  if (rows.length === 0) return null;

  const breakdown_total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const remaining = gap_amount - breakdown_total;
  // Treat anything under $50 as fully explained (rounding noise).
  const is_fully_explained = Math.abs(remaining) < 50;

  return (
    <div className="ui-stack">
      <p className="ui-kicker">{title}</p>
      <div className="module-reconciliation-amount-stack">
        {rows.map((row) => (
          <div key={row.id} className="module-reconciliation-amount-row">
            <span className="module-reconciliation-amount-label">
              {row.name}
            </span>
            <span className="module-reconciliation-amount-value">
              {format_currency(row.amount)}
            </span>
          </div>
        ))}
      </div>
      {note ? (
        <p className="text-sm text-[var(--text-secondary)]">{note}</p>
      ) : null}
      {typeof gap_amount === "number" ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {is_fully_explained
            ? `This accounts for the full ${format_currency(gap_amount)} gap.`
            : `This accounts for ${format_currency(breakdown_total)} of the ${format_currency(gap_amount)} gap. ${format_currency(remaining)} remains unexplained by this factor alone.`}
        </p>
      ) : null}
    </div>
  );
}

function ComparisonRow({
  check,
  asset_finance_breakdown = [],
  owner_director_breakdown = [],
}) {
  const has_amounts =
    check.source_amount !== undefined && check.module_amount !== undefined;

  const is_asset_finance_check = check.id === "asset_finance_variance";
  const is_labour_check = check.id === "labour_variance";

  const has_asset_breakdown =
    is_asset_finance_check && asset_finance_breakdown.length > 0;
  const has_owner_breakdown =
    is_labour_check && owner_director_breakdown.length > 0;

  // Drop generic reasons that real data now confirms or contradicts.
  let possible_reasons = check.possible_reasons;

  if (has_asset_breakdown) {
    possible_reasons = (possible_reasons || []).filter(
      (reason) => !reason.startsWith("Asset not yet entered"),
    );
  }

  if (has_owner_breakdown) {
    possible_reasons = (possible_reasons || []).filter(
      (reason) => !reason.startsWith("Owner/director pay treatment"),
    );
  }

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
        <AmountStack
          source_amount={check.source_amount}
          module_amount={check.module_amount}
          variance_amount={check.variance_amount}
          variance_percent={check.variance_percent}
        />
      ) : null}

      <p className="text-sm text-[var(--text-secondary)]">{check.detail}</p>

      {has_asset_breakdown ? (
        <NamedAmountBreakdown
          title="Assets with active finance"
          rows={asset_finance_breakdown.map((asset) => ({
            id: asset.asset_id,
            name: asset.asset_name,
            amount: asset.asset_interest_annual,
          }))}
          note="These assets show real finance interest in the Assets module. If the P&L benchmark above is $0, the most likely explanation is a classification or timing difference on the P&L side rather than a missing asset record."
          gap_amount={check.variance_amount}
        />
      ) : null}

      {has_owner_breakdown ? (
        <NamedAmountBreakdown
          title="Staff classified as Owner / Director"
          rows={owner_director_breakdown.map((staff) => ({
            id: staff.staff_id,
            name: staff.staff_name,
            amount: staff.annual_labour_cost,
          }))}
          note="This cost is real and classified as Owner/Director in the Labour module. If your P&L does not show a matching PAYE wages amount, this is a likely explanation for the gap - for example if this pay is treated as drawings rather than payroll."
          gap_amount={check.variance_amount}
        />
      ) : null}

      {Array.isArray(possible_reasons) && possible_reasons.length > 0 ? (
        <div className="ui-stack">
          <p className="ui-kicker">
            {has_asset_breakdown || has_owner_breakdown
              ? "Other possible reasons"
              : "Possible reasons"}
          </p>
          <ul className="text-sm text-[var(--text-secondary)]">
            {possible_reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function ModuleReconciliationComparisonCard({
  checks = [],
  asset_finance_breakdown = [],
  owner_director_breakdown = [],
}) {
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
              <ComparisonRow
                key={check.id}
                check={check}
                asset_finance_breakdown={asset_finance_breakdown}
                owner_director_breakdown={owner_director_breakdown}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}