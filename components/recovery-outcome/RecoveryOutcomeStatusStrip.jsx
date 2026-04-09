"use client";

function Pill({ label, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{label}</span>;
}

export default function RecoveryOutcomeStatusStrip({
  outcome_status = "not_viable",
  outcome_status_tone = "bad",
  primary_constraint_title = "No constraint identified",
  active_recovery_model = "labour_only",
  structure_valid = false,
  structure_tone = "bad",
  warning_count = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery Outcome</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Macro business verdict
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Fast check of whether the current model looks commercially workable.
            </p>
          </div>

          <div className="ui-actions">
            <Pill label={`Outcome: ${outcome_status}`} tone={outcome_status_tone} />
            <Pill
              label={`Structure: ${structure_valid ? "valid" : "invalid"}`}
              tone={structure_tone}
            />
            <Pill label={`Model: ${active_recovery_model}`} tone="ok" />
            <Pill label={`Warnings: ${warning_count}`} tone={warning_count > 0 ? "bad" : "good"} />
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Primary constraint</span>
            <div className="text-sm text-[var(--text-primary)]">
              {primary_constraint_title}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}