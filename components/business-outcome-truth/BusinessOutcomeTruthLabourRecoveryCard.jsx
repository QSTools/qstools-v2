"use client";

function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(abs)}`;
}

const STATUS_TAG_CLASS = {
  recovering: "business-outcome-ledger-status-tag good",
  shortfall: "business-outcome-ledger-status-tag bad",
  not_ready: "business-outcome-ledger-status-tag neutral",
};

const STATUS_LABELS = {
  recovering: "Recovering",
  shortfall: "Shortfall",
  not_ready: "No rate saved",
};

// BUILD-UP VIEW (this session, per user request): shows Labour cost +
// Overhead = True cost side by side, rather than a single opaque true
// cost figure, so the effect of allocated overhead on margin is
// directly visible - no toggle needed, everything's on one row.
function LabourRecoveryRow({ row }) {
  const tag_class = STATUS_TAG_CLASS[row.recovery_status] || "business-outcome-ledger-status-tag neutral";
  const status_label = STATUS_LABELS[row.recovery_status] || "Unknown";
  const not_ready = row.recovery_status === "not_ready";

  return (
    <div className="business-outcome-labour-recovery-row">
      <span>
        {row.labour_source_type_name || row.labour_source_type_id}
        <span className={tag_class}>{status_label}</span>
      </span>
      <span>{formatCurrency(row.labour_cost_per_hour)}/hr</span>
      <span>{formatCurrency(row.overhead_per_hour)}/hr</span>
      <span>{formatCurrency(row.true_cost_per_hour)}/hr</span>
      <span>{not_ready ? "N/A" : `${formatCurrency(row.charge_out_rate)}/hr`}</span>
      <span className={not_ready ? "" : row.rate_gap >= 0 ? "value-good" : "value-bad"}>
        {not_ready ? "N/A" : `${row.rate_gap >= 0 ? "+" : ""}${formatCurrency(row.rate_gap)}/hr`}
      </span>
    </div>
  );
}

export default function BusinessOutcomeTruthLabourRecoveryCard({ labour_recovery }) {
  const {
    labour_recovery_rows = [],
    shortfall_row_count = 0,
    not_ready_row_count = 0,
    weighted_summary,
    data_status,
  } = labour_recovery || {};

  if (data_status !== "ready") {
    return (
      <div className="ui-help">
        No labour recovery data available yet. Assign labour to an operating group in Cost
        Allocation to populate this.
      </div>
    );
  }

  const headline =
    shortfall_row_count > 0
      ? `${shortfall_row_count} labour source${shortfall_row_count === 1 ? "" : "s"} under-recovering`
      : not_ready_row_count > 0
      ? `${labour_recovery_rows.length - not_ready_row_count} of ${labour_recovery_rows.length} confirmed recovering, ${not_ready_row_count} with no saved rate`
      : "All labour sources recovering";

  const headline_class =
    shortfall_row_count > 0 ? "value-bad" : not_ready_row_count > 0 ? "" : "value-good";

  // Overall markup sentence (this session, per user request) - states
  // the weighted charged rate vs true cost and the resulting markup %
  // explicitly, rather than leaving the reader to work it out from the
  // two $/hr figures in the weighted average row below.
  const markup_sentence =
    weighted_summary && weighted_summary.hours_covered_by_saved_rate > 0
      ? `${formatCurrency(weighted_summary.weighted_charge_out_rate)}/hr charged vs ${formatCurrency(weighted_summary.weighted_true_cost_per_hour)}/hr true cost - a ${formatCurrency(weighted_summary.weighted_profit_per_hour)}/hr margin (${weighted_summary.weighted_markup_percent}% markup), covering ${weighted_summary.rate_coverage_percent}% of hours.`
      : null;

  return (
    <div className="business-outcome-ledger">
      <div className={`ui-help ${headline_class}`} style={{ fontWeight: 700, fontSize: "1rem" }}>
        {headline}
      </div>
      <div className="ui-help">
        Labour cost and allocated overhead (both from Cost Allocation) built up to a true cost
        per hour, compared against the saved charge-out rate (from Rate Builder).
      </div>
      {markup_sentence && <div className="ui-help">{markup_sentence}</div>}

      <div className="business-outcome-ledger-table">
        <div className="business-outcome-labour-recovery-row business-outcome-ledger-header">
          <span>Labour source</span>
          <span>Labour cost</span>
          <span>Overhead</span>
          <span>True cost</span>
          <span>Charged rate</span>
          <span>Profit / hr</span>
        </div>
        {labour_recovery_rows.map((row) => (
          <LabourRecoveryRow key={row.labour_source_type_id} row={row} />
        ))}
        {weighted_summary && (
          <div className="business-outcome-labour-recovery-row business-outcome-ledger-total">
            <span>Weighted average</span>
            <span>{formatCurrency(weighted_summary.weighted_labour_cost_per_hour)}/hr</span>
            <span>{formatCurrency(weighted_summary.weighted_overhead_per_hour)}/hr</span>
            <span>{formatCurrency(weighted_summary.weighted_true_cost_per_hour)}/hr</span>
            <span>
              {weighted_summary.hours_covered_by_saved_rate > 0
                ? `${formatCurrency(weighted_summary.weighted_charge_out_rate)}/hr`
                : "N/A"}
            </span>
            <span
              className={
                weighted_summary.hours_covered_by_saved_rate > 0
                  ? weighted_summary.weighted_profit_per_hour >= 0
                    ? "value-good"
                    : "value-bad"
                  : ""
              }
            >
              {weighted_summary.hours_covered_by_saved_rate > 0
                ? `${weighted_summary.weighted_profit_per_hour >= 0 ? "+" : ""}${formatCurrency(weighted_summary.weighted_profit_per_hour)}/hr`
                : "N/A"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}