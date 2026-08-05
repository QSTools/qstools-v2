"use client";

const DEFERRED_FIELD_LABELS = {
  source_period: "Source Period",
  primary_driver_key: "Primary Driver",
  primary_driver_title: "Primary Driver Title",
  primary_driver_evidence: "Primary Driver Evidence",
  strongest_contribution_area: "Strongest Contribution Area",
  weakest_contribution_area: "Weakest Contribution Area",
};

function WarningItem({ warning }) {
  const text = typeof warning === "string" ? warning : warning.message;
  return <li className="text-sm text-gray-700 py-1">{text}</li>;
}

export default function BusinessOutcomeTruthWarningsPanel({ output_contract }) {
  const warning_list = output_contract.warning_list?.value ?? [];
  const data_quality_list = output_contract.data_quality_list?.value ?? [];

  const deferred_fields = Object.entries(DEFERRED_FIELD_LABELS)
    .map(([key, label]) => ({ key, label, field: output_contract[key] }))
    .filter(({ field }) => field?.status === "deferred");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
      {warning_list.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-amber-600 uppercase mb-2">
            Warnings ({warning_list.length})
          </div>
          <ul className="list-disc list-inside space-y-1">
            {warning_list.map((warning, index) => (
              <WarningItem key={index} warning={warning} />
            ))}
          </ul>
        </div>
      )}

      {data_quality_list.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-amber-600 uppercase mb-2">
            Data Quality ({data_quality_list.length})
          </div>
          <ul className="list-disc list-inside space-y-1">
            {data_quality_list.map((item, index) => (
              <WarningItem key={index} warning={item} />
            ))}
          </ul>
        </div>
      )}

      {deferred_fields.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Not Yet Available In This Build
          </div>
          <ul className="space-y-2">
            {deferred_fields.map(({ key, label, field }) => (
              <li key={key} className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">{label}:</span> {field.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warning_list.length === 0 && data_quality_list.length === 0 && (
        <div className="text-sm text-gray-500">No warnings or data quality issues.</div>
      )}
    </div>
  );
}
