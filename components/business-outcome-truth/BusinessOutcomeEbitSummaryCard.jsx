"use client";

import { calculateEbitByUnit } from "@/lib/calculations/businessOutcomeEbitCalculations";

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

/**
 * BusinessOutcomeEbitSummaryCard
 *
 * Built 2026-09-12 - a prominent, whole-business EBIT figure, matching
 * the visibility given to the Health Gauge and Balance Sheet ratios
 * (user feedback: EBIT deserved the same prominence, not just a
 * collapsed table under "How the Numbers Are Calculated"). Uses the
 * same calculateEbitByUnit() as the full per-source breakdown - one
 * calculation, not two that could drift apart.
 */
export default function BusinessOutcomeEbitSummaryCard({ real_capacity, materials, unassigned }) {
  const { available, total_net_profit, total_interest, total_ebit } = calculateEbitByUnit({
    real_capacity,
    materials,
    unassigned,
  });

  if (!available) {
    return null;
  }

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">EBIT (Earnings Before Interest and Tax)</div>
      <div className="business-outcome-ledger-metrics">
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">Net Profit</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(total_net_profit)}</span>
          <span className="business-outcome-ledger-metric-description">The real total, matching the headline above.</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">+ Interest</span>
          <span className="business-outcome-ledger-metric-value">{format_currency(total_interest)}</span>
          <span className="business-outcome-ledger-metric-description">Real asset finance interest, added back.</span>
        </div>
        <div className="business-outcome-ledger-metric">
          <span className="business-outcome-ledger-metric-label">= EBIT</span>
          <span className="business-outcome-ledger-metric-value" style={{ fontWeight: 700 }}>{format_currency(total_ebit)}</span>
          <span className="business-outcome-ledger-metric-description">
            Not EBITDA - depreciation isn&apos;t tracked per source yet. See EBIT by Source below for the full breakdown.
          </span>
        </div>
      </div>
    </div>
  );
}