"use client";

export default function LabourStatusStrip({
  is_ready,
  warning_count,
  profile_state_label,
  staff_name_label,
  staff_role_label,
  labour_class_label,
  margin_health_label,
  saved_profiles_label,
  active_profile_label,
  productive_hours_label,
  minimum_charge_out_label,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Labour</p>
            <h2 className="text-xl font-semibold">Status</h2>
            <p className="ui-help">
              Live profile readiness and commercial recovery state.
            </p>
          </div>

          <div className="ui-actions">
            <Badge
              tone={is_ready ? "good" : "warn"}
              text={is_ready ? "Ready" : "Needs attention"}
            />
            <Badge
              tone={profile_state_label === "Profile active" ? "good" : "neutral"}
              text={profile_state_label}
            />
            <Badge
              tone={warning_count === 0 ? "good" : "warn"}
              text={`Warnings: ${warning_count}`}
            />
            <Badge
              tone={
                margin_health_label === "Healthy"
                  ? "good"
                  : margin_health_label === "At risk"
                  ? "warn"
                  : "bad"
              }
              text={`Margin: ${margin_health_label}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="ui-readonly">{staff_name_label}</div>
            <div className="ui-readonly">{staff_role_label}</div>
            <div className="ui-readonly">{labour_class_label}</div>
            <div className="ui-readonly">{saved_profiles_label}</div>
            <div className="ui-readonly">{active_profile_label}</div>
            <div className="ui-readonly">{productive_hours_label}</div>
            <div className="ui-readonly">{minimum_charge_out_label}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ tone, text }) {
  const classes = {
    good: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
    warn: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]",
    bad: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
    neutral:
      "border-[var(--border-strong)] bg-[var(--bg-input)] text-[var(--text-secondary)]",
  };

  return <div className={`ui-pill ${classes[tone]}`}>{text}</div>;
}