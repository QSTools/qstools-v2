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
 * Four figures, grouped in two pairs (current-reality pair first, then
 * predictive pair - confirmed with user):
 *
 * 1. P&L Revenue - what actually happened, per the books (passed in as
 *    pnl_revenue - the same real_total_revenue value BusinessOutcomePerSourceRevenueCard
 *    already uses for its own breakeven-gap text).
 *
 * 2. Breakeven Revenue - the revenue level that exactly covers total
 *    real cost, no more, no less (per_source.reconciliation.total_true_cost).
 *
 * 3. Modelled Revenue - NOT read from the P&L at all. Built entirely
 *    from what you've entered elsewhere in the system - your labour and
 *    asset charge-out rates x their real hours, plus materials at Rate
 *    Builder's own stored markup against real COGS
 *    (per_source.headline_real_capacity.independent_modelled_revenue).
 *    Genuinely independent of P&L Revenue above - confirmed this
 *    session by testing at multiple P&L revenue levels and seeing this
 *    figure hold steady both times. NOTE: this is a DIFFERENT field
 *    from headline_real_capacity.total_modelled_revenue, which is
 *    deliberately still a P&L alias used elsewhere on this page - do
 *    not confuse the two.
 *
 * 4. Projected Net Profit - Modelled Revenue minus Breakeven Revenue.
 *    Placed right next to Modelled Revenue (confirmed with user) since
 *    it's directly derived from it - not a new calculation risk, both
 *    inputs are already independently verified above. Answers "if my
 *    rates, costs and overheads hold exactly as I've entered them, what
 *    would I actually net" - a forward-looking question, distinct from
 *    today's actual net profit (P&L Revenue - Breakeven Revenue, shown
 *    in the headline above this panel).
 *
 * Deliberately does NOT attempt a Real-vs-Assumed-Capacity drill-down
 * here (asset-hours-driven "seat" revenue vs actual labour-hours
 * revenue) - traced this session and found the existing Real Capacity
 * figure already prices asset-hours-driven labour groups at the seat's
 * full running hours (see build_labour_sources' use_seat_hours logic in
 * the hook), so a further "assumed capacity" scale-up would double-count
 * the same scheduling-gap allowance already built into Real. Left as a
 * separately-scoped follow-on.
 *
 * Does not calculate anything itself beyond the one Projected Net Profit
 * subtraction above - all other figures are passed in already calculated
 * upstream (see hooks/useBusinessOutcomePerSourceRevenue.js and
 * BusinessOutcomePerSourceRevenueCard.jsx for exactly where each comes
 * from).
 */
export default function BusinessOutcomeRevenueSnapshotTable({
  pnl_revenue,
  modelled_revenue,
  breakeven_revenue,
}) {
  const has_pnl = Number.isFinite(Number(pnl_revenue));
  const has_modelled = Number.isFinite(Number(modelled_revenue));
  const has_breakeven = Number.isFinite(Number(breakeven_revenue));
  const has_projection = has_modelled && has_breakeven;

  const projected_net_profit = has_projection
    ? Number(modelled_revenue) - Number(breakeven_revenue)
    : null;

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

  let projection_callout = null;
  if (has_projection) {
    if (projected_net_profit > 0) {
      projection_callout = `If your rates and volumes hold as modelled, you'd project a net profit of ${format_currency(projected_net_profit)} a year.`;
    } else if (projected_net_profit < 0) {
      projection_callout = `Even at your modelled rates and volumes, you'd project a net loss of ${format_currency(Math.abs(projected_net_profit))} a year - your rates alone won't fix this without also addressing cost or utilisation.`;
    } else {
      projection_callout = "At your modelled rates and volumes, you'd project landing exactly at breakeven - no margin either way.";
    }
  }

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Revenue Snapshot</div>
      <div className="ui-help">
        Four different answers to &quot;how&apos;s the business doing&quot; - each measuring
        something different, so it&apos;s worth knowing which one you&apos;re looking at.
      </div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">P&amp;L Revenue (actual)</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(pnl_revenue)}</span>
          <span className="business-outcome-ledger-metric-description">
            What actually happened, straight from the books.
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Breakeven Revenue (covers real cost)</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(breakeven_revenue)}</span>
          <span className="business-outcome-ledger-metric-description">
            The exact revenue that covers real cost - no more, no less.
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Modelled Revenue (your rates &amp; volumes)</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(modelled_revenue)}</span>
          <span className="business-outcome-ledger-metric-description">
            Not from the P&amp;L - built from what you&apos;ve entered: your rates, costs, overheads and hours. Sits entirely outside your P&amp;L Revenue.
          </span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Projected Net Profit (at Modelled Revenue)</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(projected_net_profit)}</span>
          <span className="business-outcome-ledger-metric-description">
            Modelled Revenue minus Breakeven Revenue - what you&apos;d net if your entered numbers held exactly.
          </span>
        </div>
      </div>
      {comparison_callout && <div className="ui-help">{comparison_callout}</div>}
      {projection_callout && <div className="ui-help">{projection_callout}</div>}
    </div>
  );
}
