"use client";

function Pill({ label, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{label}</span>;
}

export default function RecoveryOutcomeStatusStrip({
  outcome_status = "not_viable",
  outcome_status_tone = "bad",
  primary_constraint_title = "No constraint identified",
  allocation_status = "unknown",
  allocation_dependency_type = "unknown",
  active_recovery_model = "labour_only",
  structure_valid = false,
  structure_tone = "bad",
  dependency_level = "unknown",
  warning_count = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Business Outcome</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Recovery chain verdict
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Final check of whether the selected recovery plan is supported by
              the visible delivery structure.
            </p>
          </div>

          <div className="ui-actions">
            <Pill
              label={`Outcome: ${outcome_status}`}
              tone={outcome_status_tone}
            />
            <Pill
              label={`Allocation: ${allocation_status}`}
              tone={
                allocation_status === "ready"
                  ? "good"
                  : allocation_status === "not_supported"
                    ? "bad"
                    : "ok"
              }
            />
            <Pill
              label={`Structure: ${structure_valid ? "valid" : "invalid"}`}
              tone={structure_tone}
            />
            <Pill label={`Model: ${active_recovery_model}`} tone="ok" />
            <Pill label={`Dependency: ${dependency_level}`} tone="ok" />
            <Pill
              label={`Warnings: ${warning_count}`}
              tone={warning_count > 0 ? "bad" : "good"}
            />
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Primary constraint</span>
            <div className="text-sm text-[var(--text-primary)]">
              {primary_constraint_title}
            </div>
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Dependency type</span>
            <div className="text-sm text-[var(--text-primary)]">
              {allocation_dependency_type}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}