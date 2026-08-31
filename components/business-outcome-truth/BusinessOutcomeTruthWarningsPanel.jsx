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
  return <li className="business-outcome-warnings-item">{text}</li>;
}

export default function BusinessOutcomeTruthWarningsPanel({ output_contract }) {
  const warning_list = output_contract.warning_list?.value ?? [];
  const data_quality_list = output_contract.data_quality_list?.value ?? [];
  const deferred_fields = Object.entries(DEFERRED_FIELD_LABELS)
    .map(([key, label]) => ({ key, label, field: output_contract[key] }))
    .filter(({ field }) => field?.status === "deferred");

  return (
    <div className="business-outcome-warnings-panel">
      {warning_list.length > 0 && (
        <div>
          <div className="business-outcome-warnings-section-title">
            Warnings ({warning_list.length})
          </div>
          <ul className="business-outcome-warnings-list">
            {warning_list.map((warning, index) => (
              <WarningItem key={index} warning={warning} />
            ))}
          </ul>
        </div>
      )}
      {data_quality_list.length > 0 && (
        <div>
          <div className="business-outcome-warnings-section-title">
            Data Quality ({data_quality_list.length})
          </div>
          <ul className="business-outcome-warnings-list">
            {data_quality_list.map((item, index) => (
              <WarningItem key={index} warning={item} />
            ))}
          </ul>
        </div>
      )}
      {deferred_fields.length > 0 && (
        <div>
          <div className="business-outcome-warnings-section-title muted">
            Not Yet Available In This Build
          </div>
          <ul className="business-outcome-warnings-list">
            {deferred_fields.map(({ key, label, field }) => (
              <li key={key} className="business-outcome-warnings-item muted">
                <strong>{label}:</strong> {field.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warning_list.length === 0 && data_quality_list.length === 0 && (
        <div className="ui-help">No warnings or data quality issues.</div>
      )}
    </div>
  );
}