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

/**
 * BusinessOutcomeEbitByUnitTable
 *
 * Built 2026-09-12 - per-source EBIT (Earnings Before Interest and Tax).
 * DELIBERATELY EBIT, not EBITDA - the Assets module has no depreciation
 * tracking at all (confirmed during this session's Balance Sheet Fixed
 * Assets reconciliation work), so a true EBITDA-by-unit figure cannot be
 * honestly built yet. See FIXED_ASSET_REGISTER_IMPORT_SCOPING_BRIEF_2026-09-12.txt
 * for the deferred work that would eventually unlock real per-source
 * depreciation and complete this into true EBITDA.
 *
 * Interest is real, live data: asset_interest_annual, already computed
 * and displayed on /module-reconciliation's own asset finance coverage
 * check (S22), joined here to each Business Outcome group via the same
 * asset_group_assignments used throughout this page - not a new
 * calculation, a real join of two already-correct, already-verified
 * numbers.
 *
 * Tax is deliberately NOT included - standard practice for segment/unit
 * EBITDA generally does not allocate whole-business tax down to
 * individual segments, since tax is computed on aggregate taxable
 * income, not meaningfully splittable per source.
 *
 * Reads directly from per_source.real_capacity.group_real_capacity
 * (confirmed end-to-end 2026-09-12: hook's group_rows_by_group_id sums
 * asset_interest_annual per group -> apply_real_capacity's own
 * group_real_capacity output carries it -> selector passes real_capacity
 * through wholesale, no field-dropping) - deliberately NOT the
 * buildNetProfitBuildUpRows selector, to avoid re-tracing a second,
 * more complex selector chain for a purely additive display feature.
 */
export default function BusinessOutcomeEbitByUnitTable({ real_capacity }) {
  const groups = real_capacity?.group_real_capacity;

  if (!Array.isArray(groups) || groups.length === 0) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">EBIT by Source</div>
        <p className="ui-help">Not available yet - upstream sources aren&apos;t ready.</p>
      </div>
    );
  }

  const rows = groups.map((g) => ({
    group_name: g.group_name,
    net_profit: Number(g.final_net_profit) || 0,
    interest: Number(g.asset_interest_annual) || 0,
    ebit: (Number(g.final_net_profit) || 0) + (Number(g.asset_interest_annual) || 0),
  }));

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">EBIT by Source</div>
      <p className="ui-help" style={{ marginTop: 0 }}>
        Earnings Before Interest and Tax, per source - net profit with real asset finance interest added
        back. Deliberately EBIT, not EBITDA: depreciation isn&apos;t tracked per source yet, so a full
        EBITDA figure would be invented, not real. Tax isn&apos;t allocated per source either, matching
        standard segment-reporting practice.
      </p>
      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Net Profit</span>
          <span>+ Interest</span>
          <span>= EBIT</span>
        </div>
        {rows.map((row) => (
          <div className="business-outcome-ledger-row" key={row.group_name} style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr" }}>
            <span>{row.group_name}</span>
            <span>{format_currency(row.net_profit)}</span>
            <span>{format_currency(row.interest)}</span>
            <span style={{ fontWeight: 600 }}>{format_currency(row.ebit)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}