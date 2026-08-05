"use client";

export default function BusinessOutcomeTruthStatusStrip({ output_contract }) {
  const { data_status, downstream_ready, warning_list, data_quality_list, reconciliation_status } =
    output_contract;

  const warning_count =
    (warning_list?.value?.length ?? 0) + (data_quality_list?.value?.length ?? 0);

  const status_color =
    data_status === "blocked"
      ? "bg-red-50 border-red-200 text-red-700"
      : data_status === "partial"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-green-50 border-green-200 text-green-700";

  const status_label =
    data_status === "blocked"
      ? "Blocked - upstream data not trusted"
      : data_status === "partial"
        ? "Partial - some upstream sources not yet ready"
        : "Complete - all upstream sources ready";

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${status_color}`}>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm">{status_label}</span>
        {warning_count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border">
            {warning_count} flag{warning_count !== 1 ? "s" : ""}
          </span>
        )}
        {reconciliation_status === "mismatch" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border">
            Reconciliation mismatch
          </span>
        )}
      </div>
      <span className="text-xs opacity-75">
        {downstream_ready?.value ? "Ready for downstream use" : "Not yet ready for downstream use"}
      </span>
    </div>
  );
}
