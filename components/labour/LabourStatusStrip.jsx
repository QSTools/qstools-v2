"use client";

export default function LabourStatusStrip({
  has_profile,
  inputs_enabled,
  missing_fields,
  margin_health,
  staff_name,
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <div className="flex flex-wrap gap-3">
        <Badge
          tone={has_profile ? "good" : "neutral"}
          text={has_profile ? `Profile: ${staff_name || "Active"}` : "No profile"}
        />
        <Badge
          tone={inputs_enabled ? "good" : "warn"}
          text={inputs_enabled ? "Inputs enabled" : "Inputs locked"}
        />
        <Badge
          tone={missing_fields.length === 0 ? "good" : "warn"}
          text={`Missing fields: ${missing_fields.length}`}
        />
        <Badge
          tone={
            margin_health === "healthy"
              ? "good"
              : margin_health === "at-risk"
              ? "warn"
              : "bad"
          }
          text={`Margin: ${margin_health}`}
        />
      </div>
    </section>
  );
}

function Badge({ tone, text }) {
  const classes = {
    good: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
    warn: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]",
    bad: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
    neutral: "border-[var(--border-strong)] bg-[var(--bg-input)] text-[var(--text-secondary)]",
  };

  return (
    <div className={`rounded-full border px-3 py-2 text-xs min-h-[40px] ${classes[tone]}`}>
      {text}
    </div>
  );
}