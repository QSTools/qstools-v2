"use client";

function format_currency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "N/A";
  const sign = n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  })}`;
}

/**
 * BusinessOutcomeRevenueSnapshotTable
 *
 * Three revenue figures, side by side, each answering a different
 * question:
 *
 * - P&L Revenue: what actually happened, per the books (passed in as
 *   pnl_revenue - the same real_total_revenue value BusinessOutcomePerSourceRevenueCard
 *   already uses for its own breakeven-gap text).
 *
 * - Modelled Revenue: what your rates and volumes predict on their own -
 *   built bottom-up from each labour/asset source's own charge-out rate
 *   x its own real hours, plus materials' own markup-based revenue
 *   (per_source.total_modelled_revenue). Genuinely independent of the
 *   P&L figure - no part of that calculation reads total_revenue_reference
 *   or scales against it (confirmed by tracing hooks/useBusinessOutcomePerSourceRevenue.js
 *   this session).
 *
 * - Breakeven Revenue: the revenue level that exactly covers total real
 *   cost, no more, no less (per_source.reconciliation.total_true_cost).
 *
 * Comparing P&L against Modelled answers "are we trading above or below
 * what our own rates/volumes say we should be" - a different question
 * than P&L vs Breakeven (which the headline above this panel already
 * answers).
 *
 * Deliberately does NOT attempt a Real-vs-Assumed-Capacity drill-down
 * here (asset-hours-driven "seat" revenue vs actual labour-hours
 * revenue) - traced this session and found the existing Real Capacity
 * figure already prices asset-hours-driven labour groups at the seat's
 * full running hours (see build_labour_sources' use_seat_hours logic in
 * the hook), so a further "assumed capacity" scale-up would double-count
 * the same scheduling-gap allowance already built into Real. Left as a
 * separately-scoped follow-on, not attempted here to avoid a second
 * subtle double-count bug on top of the one already found and fixed this
 * session for Materials.
 *
 * Does not calculate anything itself - all three figures are passed in
 * already calculated upstream (see hooks/useBusinessOutcomePerSourceRevenue.js
 * and BusinessOutcomePerSourceRevenueCard.jsx for exactly where each comes
 * from).
 */
export default function BusinessOutcomeRevenueSnapshotTable({
  pnl_revenue,
  modelled_revenue,
  breakeven_revenue,
}) {
  const has_pnl = Number.isFinite(Number(pnl_revenue));
  const has_modelled = Number.isFinite(Number(modelled_revenue));

  let comparison_callout = null;
  if (has_pnl && has_modelled && Number(modelled_revenue) !== 0) {
    const diff = Number(pnl_revenue) - Number(modelled_revenue);
    const diff_pct = (diff / Number(modelled_revenue)) * 100;
    if (Math.abs(diff_pct) < 1) {
      comparison_callout =
        "You're trading almost exactly in line with what your rates and volumes independently predict.";
    } else if (diff > 0) {
      comparison_callout = `You're trading ${format_currency(diff)} above what your rates and volumes independently predict (${diff_pct.toFixed(0)}% higher) - potentially some room to move on pricing if the market softens.`;
    } else {
      comparison_callout = `You're trading ${format_currency(Math.abs(diff))} below what your rates and volumes independently predict (${Math.abs(diff_pct).toFixed(0)}% lower) - worth understanding why before assuming your rates are the problem.`;
    }
  }

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Revenue Snapshot</div>
      <div className="ui-help">
        Three different answers to &quot;what&apos;s our revenue&quot; - each measuring
        something different, so it&apos;s worth knowing which one you&apos;re looking at.
      </div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">P&amp;L Revenue (actual)</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(pnl_revenue)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Modelled Revenue (your rates &amp; volumes)</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(modelled_revenue)}</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Breakeven Revenue (covers real cost)</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(breakeven_revenue)}</span>
        </div>
      </div>
      {comparison_callout && <div className="ui-help">{comparison_callout}</div>}
    </div>
  );
}