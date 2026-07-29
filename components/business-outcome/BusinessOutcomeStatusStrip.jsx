'use client';

export default function BusinessOutcomeStatusStrip({ outcome }) {
  const { business_outcome_model_trust_state, warningCount } = outcome;

  const statusColor =
    business_outcome_model_trust_state === 'blocked'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-blue-50 border-blue-200 text-blue-700';

  const statusLabel =
    business_outcome_model_trust_state === 'blocked'
      ? 'Blocked - upstream data not trusted'
      : 'Modeled Recovery Pressure';

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-center justify-between ${statusColor}`}>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm">{statusLabel}</span>
        {warningCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border">
            {warningCount} flag{warningCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <span className="text-xs opacity-75">Model-based - not actual performance</span>
    </div>
  );
}
