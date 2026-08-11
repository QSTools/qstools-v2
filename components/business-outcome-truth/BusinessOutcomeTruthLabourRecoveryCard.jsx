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

const STATUS_STYLES = {
  recovering: "text-green-600",
  shortfall: "text-red-600",
  not_ready: "text-amber-600",
};

const STATUS_LABELS = {
  recovering: "Recovering",
  shortfall: "Shortfall",
  not_ready: "No rate saved",
};

function LabourRecoveryRow({ row }) {
  const status_class = STATUS_STYLES[row.recovery_status] || "text-gray-500";
  const status_label = STATUS_LABELS[row.recovery_status] || "Unknown";
  const profit_class = row.rate_gap >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="grid grid-cols-5 gap-3 py-2 border-b border-gray-100 last:border-b-0 items-center">
      <div className="text-sm text-gray-600">
        {row.labour_source_type_name || row.labour_source_type_id}
      </div>
      <div className="text-sm text-right text-gray-900">
        {formatCurrency(row.true_cost_per_hour)}/hr
      </div>
      <div className="text-sm text-right text-gray-900">
        {row.recovery_status === "not_ready"
          ? "N/A"
          : `${formatCurrency(row.charge_out_rate)}/hr`}
      </div>
      <div className={`text-sm text-right font-medium ${row.recovery_status === "not_ready" ? "text-gray-400" : profit_class}`}>
        {row.recovery_status === "not_ready"
          ? "N/A"
          : `${row.rate_gap >= 0 ? "+" : ""}${formatCurrency(row.rate_gap)}/hr`}
      </div>
      <div className={`text-sm text-right font-medium ${status_class}`}>
        {status_label}
      </div>
    </div>
  );
}

export default function BusinessOutcomeTruthLabourRecoveryCard({
  labour_recovery,
}) {
  const {
    labour_recovery_rows = [],
    shortfall_row_count = 0,
    not_ready_row_count = 0,
    rate_model_ambiguous = false,
    active_model_name,
    data_status,
  } = labour_recovery || {};

  if (data_status !== "ready") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Labour recovery, by source
        </div>
        <p className="text-sm text-gray-500">
          No labour recovery data available yet. Assign labour to an operating
          group in Cost Allocation to populate this.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div>
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">
          Labour recovery, by source
        </div>
        <div
          className={`text-2xl font-bold ${
            shortfall_row_count > 0
              ? "text-red-600"
              : not_ready_row_count > 0
              ? "text-amber-600"
              : "text-green-600"
          }`}
        >
          {shortfall_row_count > 0
            ? `${shortfall_row_count} labour source${shortfall_row_count === 1 ? "" : "s"} under-recovering`
            : not_ready_row_count > 0
            ? `${labour_recovery_rows.length - not_ready_row_count} of ${labour_recovery_rows.length} confirmed recovering, ${not_ready_row_count} with no saved rate`
            : "All labour sources recovering"}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          True cost per hour (labour + allocated overhead, from Cost
          Allocation) compared against the saved charge-out rate (from Rate
          Builder).
        </p>
      </div>

      <div>
        <div className="grid grid-cols-5 gap-3 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase">
          <div>Labour source</div>
          <div className="text-right">True cost</div>
          <div className="text-right">Charged rate</div>
          <div className="text-right">Profit / hr</div>
          <div className="text-right">Status</div>
        </div>
        {labour_recovery_rows.map((row) => (
          <LabourRecoveryRow key={row.labour_source_type_id} row={row} />
        ))}

        {labour_recovery?.weighted_summary ? (
          <div className="grid grid-cols-5 gap-3 py-2 border-t-2 border-gray-300 items-center font-semibold">
            <div className="text-sm text-gray-900">Weighted average</div>
            <div className="text-sm text-right text-gray-900">
              {formatCurrency(labour_recovery.weighted_summary.weighted_true_cost_per_hour)}/hr
            </div>
            <div className="text-sm text-right text-gray-900">
              {labour_recovery.weighted_summary.hours_covered_by_saved_rate > 0
                ? `${formatCurrency(labour_recovery.weighted_summary.weighted_charge_out_rate)}/hr`
                : "N/A"}
            </div>
            <div
              className={`text-sm text-right ${
                labour_recovery.weighted_summary.hours_covered_by_saved_rate > 0
                  ? labour_recovery.weighted_summary.weighted_profit_per_hour >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  : "text-gray-400"
              }`}
            >
              {labour_recovery.weighted_summary.hours_covered_by_saved_rate > 0
                ? `${labour_recovery.weighted_summary.weighted_profit_per_hour >= 0 ? "+" : ""}${formatCurrency(labour_recovery.weighted_summary.weighted_profit_per_hour)}/hr`
                : "N/A"}
            </div>
            <div className="text-xs text-right text-gray-500 font-normal">
              covers {labour_recovery.weighted_summary.rate_coverage_percent}% of hours
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}





