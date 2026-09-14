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
 * BusinessOutcomeEbitByUnitTable
 *
 * Built 2026-09-12, EXTENDED same day to EBITDA once the Fixed Asset
 * Register import made real per-source depreciation available. Both
 * interest (asset_interest_annual, from /module-reconciliation's S22
 * finance coverage check) and depreciation (estimated_annual_depreciation,
 * from the imported register, Diminishing Value only) are real, joined
 * via the same asset_group_assignments used throughout this page - not
 * invented figures.
 *
 * Depreciation here is ALWAYS the real figure, regardless of any
 * asset's own "Include depreciation in true cost" toggle in the Assets
 * module - that toggle only affects pricing/true_cost elsewhere, not
 * this informational figure (confirmed design decision,
 * FIXED_ASSET_REGISTER_IMPORT_SCOPING_BRIEF_2026-09-12.txt).
 *
 * Tax is deliberately NOT included - standard practice for segment/unit
 * EBITDA generally does not allocate whole-business tax down to
 * individual segments.
 *
 * Reads directly from per_source.real_capacity.group_real_capacity,
 * same pattern as the interest join.
 */
export default function BusinessOutcomeEbitByUnitTable({ real_capacity, materials, unassigned }) {
  const { available, rows, total_net_profit, total_interest, total_depreciation, total_ebit, total_ebitda } =
    calculateEbitByUnit({ real_capacity, materials, unassigned });

  if (!available) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">EBIT &amp; EBITDA by Source</div>
        <p className="ui-help">Not available yet - upstream sources aren&apos;t ready.</p>
      </div>
    );
  }

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">EBIT &amp; EBITDA by Source</div>
      <p className="ui-help" style={{ marginTop: 0 }}>
        Net profit with real asset finance interest and depreciation added back, per source. Depreciation
        only applies to assets linked to your Fixed Asset Register with a Diminishing Value method. Tax
        isn&apos;t allocated per source, matching standard segment-reporting practice.
      </p>
      <p className="ui-help">
        The Total below covers every labour and asset source shown above, plus Materials/COGS. Note: any
        financed asset not currently assigned to an operational group wouldn&apos;t appear here or count
        toward this total - worth checking Cost Allocation if a number here looks lower than expected.
      </p>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header" style={{ gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.9fr 0.9fr" }}>
          <span>Source</span>
          <span>Net Profit</span>
          <span>+ Interest</span>
          <span>= EBIT</span>
          <span>+ Depreciation</span>
          <span>= EBITDA</span>
        </div>
        {rows.map((row) => (
          <div className="business-outcome-ledger-row" key={row.group_name} style={{ gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.9fr 0.9fr" }}>
            <span>{row.group_name}</span>
            <span>{format_currency(row.net_profit)}</span>
            <span>{format_currency(row.interest)}</span>
            <span style={{ fontWeight: 600 }}>{format_currency(row.ebit)}</span>
            <span>{format_currency(row.depreciation)}</span>
            <span style={{ fontWeight: 600 }}>{format_currency(row.ebitda)}</span>
          </div>
        ))}
        <div className="business-outcome-ledger-row business-outcome-ledger-true-total" style={{ gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.9fr 0.9fr" }}>
          <span>Total</span>
          <span>{format_currency(total_net_profit)}</span>
          <span>{format_currency(total_interest)}</span>
          <span>{format_currency(total_ebit)}</span>
          <span>{format_currency(total_depreciation)}</span>
          <span>{format_currency(total_ebitda)}</span>
        </div>
      </div>
    </div>
  );
}