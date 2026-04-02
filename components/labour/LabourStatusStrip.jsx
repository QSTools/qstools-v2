"use client";

export default function LabourStatusStrip({
  has_profile,
  inputs_enabled,
  missing_fields,
  margin_health,
  staff_name,
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
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
    good: "border-emerald-700 bg-emerald-950 text-emerald-300",
    warn: "border-amber-700 bg-amber-950 text-amber-300",
    bad: "border-rose-700 bg-rose-950 text-rose-300",
    neutral: "border-neutral-700 bg-neutral-950 text-neutral-300",
  };

  return (
    <div className={`rounded-full border px-3 py-1 text-xs ${classes[tone]}`}>
      {text}
    </div>
  );
}