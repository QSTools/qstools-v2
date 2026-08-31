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

function LabourRecoveryRow({ row }) {
  const tag_class = STATUS_TAG_CLASS[row.recovery_status] || "business-outcome-ledger-status-tag neutral";
  const status_label = STATUS_LABELS[row.recovery_status] || "Unknown";
  const not_ready = row.recovery_status === "not_ready";

  return (
    <div className="business-outcome-ledger-row">
      <span>
        {row.labour_source_type_name || row.labour_source_type_id}
        <span className={tag_class}>{status_label}</span>
      </span>
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

  return (
    <div className="business-outcome-ledger">
      <div className={`ui-help ${headline_class}`} style={{ fontWeight: 700, fontSize: "1rem" }}>
        {headline}
      </div>
      <div className="ui-help">
        True cost per hour (labour + allocated overhead, from Cost Allocation) compared against
        the saved charge-out rate (from Rate Builder).
      </div>

      <div className="business-outcome-ledger-table">
        <div className="business-outcome-ledger-row business-outcome-ledger-header">
          <span>Labour source</span>
          <span>True cost</span>
          <span>Charged rate</span>
          <span>Profit / hr</span>
        </div>
        {labour_recovery_rows.map((row) => (
          <LabourRecoveryRow key={row.labour_source_type_id} row={row} />
        ))}
        {labour_recovery?.weighted_summary && (
          <div className="business-outcome-ledger-row business-outcome-ledger-total">
            <span>Weighted average</span>
            <span>{formatCurrency(labour_recovery.weighted_summary.weighted_true_cost_per_hour)}/hr</span>
            <span>
              {labour_recovery.weighted_summary.hours_covered_by_saved_rate > 0
                ? `${formatCurrency(labour_recovery.weighted_summary.weighted_charge_out_rate)}/hr`
                : "N/A"}
            </span>
            <span
              className={
                labour_recovery.weighted_summary.hours_covered_by_saved_rate > 0
                  ? labour_recovery.weighted_summary.weighted_profit_per_hour >= 0
                    ? "value-good"
                    : "value-bad"
                  : ""
              }
            >
              {labour_recovery.weighted_summary.hours_covered_by_saved_rate > 0
                ? `${labour_recovery.weighted_summary.weighted_profit_per_hour >= 0 ? "+" : ""}${formatCurrency(labour_recovery.weighted_summary.weighted_profit_per_hour)}/hr (covers ${labour_recovery.weighted_summary.rate_coverage_percent}% of hours)`
                : "N/A"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}