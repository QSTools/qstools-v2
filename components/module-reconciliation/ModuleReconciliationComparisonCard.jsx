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

// Real per-asset breakdown for the Asset Finance variance row. Sourced
// directly from Assets module data (finance_active assets), not a guess.
function AssetFinanceBreakdown({ assets = [] }) {
  if (assets.length === 0) return null;

  return (
    <div className="ui-stack">
      <p className="ui-kicker">Assets with active finance</p>
      <div className="module-reconciliation-amount-stack">
        {assets.map((asset) => (
          <div key={asset.asset_id} className="module-reconciliation-amount-row">
            <span className="module-reconciliation-amount-label">
              {asset.asset_name}
            </span>
            <span className="module-reconciliation-amount-value">
              {format_currency(asset.asset_interest_annual)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        These assets show real finance interest in the Assets module. If the
        P&amp;L benchmark above is $0, the most likely explanation is a
        classification or timing difference on the P&amp;L side rather than
        a missing asset record.
      </p>
    </div>
  );
}

function ComparisonRow({ check, asset_finance_breakdown = [] }) {
  const has_amounts =
    check.source_amount !== undefined && check.module_amount !== undefined;

  const is_asset_finance_check = check.id === "asset_finance_variance";
  const has_real_breakdown =
    is_asset_finance_check && asset_finance_breakdown.length > 0;

  // If we have real per-asset data confirming the assets ARE entered,
  // drop the generic "asset not yet entered" possibility - it's
  // contradicted by the data we're showing right above it.
  const possible_reasons = has_real_breakdown
    ? (check.possible_reasons || []).filter(
        (reason) => !reason.startsWith("Asset not yet entered"),
      )
    : check.possible_reasons;

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

      {has_real_breakdown ? (
        <AssetFinanceBreakdown assets={asset_finance_breakdown} />
      ) : null}

      {Array.isArray(possible_reasons) && possible_reasons.length > 0 ? (
        <div className="ui-stack">
          <p className="ui-kicker">
            {has_real_breakdown ? "Other possible reasons" : "Possible reasons"}
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
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}