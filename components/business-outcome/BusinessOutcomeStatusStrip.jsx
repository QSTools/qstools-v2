"use client";
export default function BusinessOutcomeStatusStrip({ outcome }) {
  const { business_outcome_model_trust_state, warningCount } = outcome;
  const statusColor =
    business_outcome_model_trust_state === "blocked"
      ? "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]"
      : "border-[var(--info)] bg-[rgba(59,130,246,0.08)] text-[var(--info)]";
  const statusLabel =
    business_outcome_model_trust_state === "blocked"
      ? "Blocked - upstream data not trusted"
      : "Modeled Recovery Pressure (Recovery & Rate Justification)";
  return (
    <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${statusColor}`}>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm">{statusLabel}</span>
        {warningCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
            {warningCount} flag{warningCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <span className="text-xs opacity-75">Model-based - not actual performance</span>
    </div>
  );
}
