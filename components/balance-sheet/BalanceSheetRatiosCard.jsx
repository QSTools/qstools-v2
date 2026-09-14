"use client";

function format_currency(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  const sign = Number(value) < 0 ? "-" : "";
  const abs = Math.abs(Number(value));
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

function format_ratio(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return Number(value).toFixed(2);
}

/**
 * BalanceSheetRatiosCard
 *
 * Displays the working capital / liquidity ratios from
 * calculateWorkingCapitalRatios (lib/calculations/balanceSheetCalculations.js).
 * Reuses the business-outcome-ledger-metric classes already established
 * across Business Outcome, rather than inventing new card styling - this
 * is one more internal tool page in the same product, not a new visual
 * identity (per frontend-design skill: consistency is the right choice
 * when a real design system already exists).
 */
export default function BalanceSheetRatiosCard({ ratios }) {
  if (!ratios || !ratios.available) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">Working Capital &amp; Liquidity</div>
        <p className="ui-help">Import a Balance Sheet to see these figures.</p>
      </div>
    );
  }

  const current_ratio_class =
    ratios.current_ratio !== null && ratios.current_ratio < 1
      ? "value-bad"
      : "value-good";
  const working_capital_class =
    ratios.working_capital !== null && ratios.working_capital < 0
      ? "value-bad"
      : "value-good";

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Working Capital &amp; Liquidity</div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Working Capital</span>
          <span className={`business-outcome-ledger-metric-value ${working_capital_class}`}>
            {format_currency(ratios.working_capital)}
          </span>
          <span className="business-outcome-ledger-metric-description">
            Current assets minus current liabilities.
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Current Ratio</span>
          <span className={`business-outcome-ledger-metric-value ${current_ratio_class}`}>
            {format_ratio(ratios.current_ratio)}
          </span>
          <span className="business-outcome-ledger-metric-description">
            Current assets &divide; current liabilities. Below 1.0 means current liabilities exceed current assets.
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Quick Ratio</span>
          <span className="business-outcome-ledger-metric-value">
            {format_ratio(ratios.quick_ratio)}
          </span>
          <span className="business-outcome-ledger-metric-description">
            Like Current Ratio, but excludes prepayments (already spent, can&apos;t cover a liability).
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Debt to Equity</span>
          <span className="business-outcome-ledger-metric-value">
            {format_ratio(ratios.debt_to_equity)}
          </span>
          <span className="business-outcome-ledger-metric-description">
            Total liabilities &divide; total equity. Higher means more of the business is financed by debt.
          </span>
        </div>
      </div>
    </div>
  );
}