"use client";

function format_currency(value) {
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

function format_hours(value) {
  const n = Number(value) || 0;
  return Math.round(n).toLocaleString();
}

const GAP_TYPE_LABEL = {
  revenue_at_risk: "Revenue not earned",
  wasted_cost: "Overstaffed",
  opportunity: "Opportunity",
  data_check: "Worth checking",
  none: "No gap",
};

const GAP_TYPE_CLASS = {
  revenue_at_risk: "value-bad",
  wasted_cost: "value-bad",
  opportunity: "value-neutral",
  data_check: "value-neutral",
  none: "value-neutral",
};

/**
 * BusinessOutcomeCapacityCoverageGapTable
 *
 * Per-group breakdown of the capacity coverage gap (2026-09-11):
 * asset hours vs labour's own raw hours (never the seat-adjusted
 * figure, to avoid double-counting the allowance already built into
 * Real Capacity - see hooks/useBusinessOutcomePerSourceRevenue.js,
 * calculate_capacity_coverage_gap). Bidirectional and works for every
 * group, not just asset-driven ones. Prerequisite for this being
 * trustworthy: asset hours now correctly account for scheduled
 * downtime (2026-09-11, commit 6c8995f).
 *
 * Replaces the old, one-directional, hours-only "scheduling gap"
 * message that used to appear in the blurb - this is a genuine
 * superset (also catches overstaffing, includes a dollar value).
 */
export default function BusinessOutcomeCapacityCoverageGapTable({ capacity_coverage_gap }) {
  if (!Array.isArray(capacity_coverage_gap) || capacity_coverage_gap.length === 0) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">Capacity Coverage Gap</div>
        <p>Not available yet - upstream sources aren&apos;t ready.</p>
      </div>
    );
  }

  const rows = [...capacity_coverage_gap].sort(
    (a, b) => Math.abs(b.gap_dollar_value ?? 0) - Math.abs(a.gap_dollar_value ?? 0)
  );

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Capacity Coverage Gap</div>
      <div className="ui-help">
        Compares each group&apos;s asset hours against labour&apos;s own real assigned hours (not the
        asset-adjusted figure used elsewhere, so this never double-counts). Works both directions:
        labour short of asset hours means the asset can only earn for the hours labour covers - the
        uncovered hours are left out of revenue everywhere on this page, and the value shown is the
        revenue not earned (asset plus labour rate). Labour exceeding asset hours flags overstaffing -
        real cost the revenue doesn&apos;t account for. Only asset-driven groups are shown - a pure
        labour group has no asset hours to compare against. The fix is to assign more labour in Cost
        Allocation, or to test the change in Business Modelling.
      </div>

      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Source</span>
          <span>Asset hours</span>
          <span>Labour hours</span>
          <span>Gap</span>
        </div>

        {rows.map((row) => {
          const label = GAP_TYPE_LABEL[row.gap_type] ?? row.gap_type;
          const value_class = GAP_TYPE_CLASS[row.gap_type] ?? "value-neutral";
          return (
            <div className="business-outcome-ledger-row" key={row.group_id}>
              <span>{row.group_name}</span>
              <span>{format_hours(row.asset_hours)}</span>
              <span>{format_hours(row.labour_hours)}</span>
              <span className={value_class}>
                {row.gap_type === "none" ? (
                  "-"
                ) : (
                  <>
                    {label}
                    {row.gap_dollar_value !== null ? ` (${format_currency(row.gap_dollar_value)}/yr)` : ""}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}