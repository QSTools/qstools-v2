"use client";

function StatusPill({ label, value, tone = "info" }) {
  return (
    <div className="ui-panel">
      <p className="ui-kicker">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`ui-pill ui-pill-${tone}`}>{value}</span>
      </div>
    </div>
  );
}

export default function RecoveryOutcomeStatusStrip({
  outcome_status,
  primary_constraint_title,
  active_recovery_model,
  structure_valid,
  warning_count,
  tone = "info",
}) {
  return (
    <section className="ui-section">
      <div className="grid grid-cols-1 gap-4">
        <StatusPill
          label="Outcome"
          value={outcome_status?.replaceAll("_", " ") ?? "unknown"}
          tone={tone}
        />

        <StatusPill
          label="Primary constraint"
          value={primary_constraint_title ?? "Unknown"}
          tone="info"
        />

        <StatusPill
          label="Recovery model"
          value={active_recovery_model?.replaceAll("_", " ") ?? "unknown"}
          tone="info"
        />

        <StatusPill
          label="Structure"
          value={structure_valid ? "valid" : "invalid"}
          tone={structure_valid ? "success" : "warning"}
        />

        <StatusPill
          label="Warnings"
          value={String(warning_count ?? 0)}
          tone={warning_count > 0 ? "warning" : "success"}
        />
      </div>
    </section>
  );
}