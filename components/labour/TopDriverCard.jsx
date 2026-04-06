"use client";

function fmtCur(v) {
  return Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(v) {
  return `${Number(v || 0).toFixed(2)}%`;
}

function buildTopDriver(outputs = {}, state = {}, has_profile = false) {
  if (!has_profile) {
    return {
      title: "No live driver yet",
      body: "Create or load a labour profile to see what is driving your live labour cost.",
      tone: "neutral",
      metric_label: "Status",
      metric_value: "Waiting for profile",
    };
  }

  const productivity = Number(state.productivity_percent ?? 0);
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const non_productive = Number(outputs.non_productive_paid_hours ?? 0);
  const employer_cost = Number(outputs.total_employer_contribution_cost ?? 0);
  const total_labour_cost = Number(outputs.total_labour_cost_annual ?? 0);
  const margin_gap = Number(outputs.margin_gap ?? 0);

  const entitlement_ratio =
    paid_hours > 0 ? non_productive / paid_hours : 0;

  const employer_cost_ratio =
    total_labour_cost > 0 ? employer_cost / total_labour_cost : 0;

  if (productivity > 0 && productivity < 80) {
    return {
      title: "Productivity is driving cost",
      body: "Your productive hours are being compressed, which pushes up the cost of every hour you sell. Small improvements here can have a strong upside.",
      tone: "bad",
      metric_label: "Productivity",
      metric_value: fmtPct(productivity),
    };
  }

  if (entitlement_ratio >= 0.18) {
    return {
      title: "Entitlements are adding pressure",
      body: "A larger share of paid hours is being lost to leave and non-productive time. That increases cost per productive hour and lifts the charge-out you need.",
      tone: "warn",
      metric_label: "Non-productive hours",
      metric_value: fmtPct(entitlement_ratio * 100),
    };
  }

  if (employer_cost_ratio >= 0.05) {
    return {
      title: "Employer costs are materially lifting labour cost",
      body: "KiwiSaver and ESCT are now a meaningful part of your true labour cost. These costs need to be recovered through your productive hours.",
      tone: "warn",
      metric_label: "Employer cost share",
      metric_value: fmtPct(employer_cost_ratio * 100),
    };
  }

  if (margin_gap < 0) {
    return {
      title: "Your charge-out is below target",
      body: "Your current charge-out rate is not covering the margin target set in the model. That leaves your commercial position exposed.",
      tone: "bad",
      metric_label: "Margin gap",
      metric_value: `$${fmtCur(margin_gap)}`,
    };
  }

  return {
    title: "Your labour position looks healthy",
    body: "No single pressure point is dominating the live labour model right now. Your cost structure and recovery position appear reasonably balanced.",
    tone: "good",
    metric_label: "Above recovery",
    metric_value: `$${fmtCur(outputs.above_recovery ?? 0)}`,
  };
}

export default function TopDriverCard({ outputs, state, has_profile }) {
  const driver = buildTopDriver(outputs, state, has_profile);

  const toneStyles = {
    good: "border-[var(--success)] bg-[var(--success-soft)]/40",
    warn: "border-[var(--warning)] bg-[var(--warning-soft)]/40",
    bad: "border-[var(--danger)] bg-[var(--danger-soft)]/40",
    neutral: "border-[var(--border-primary)] bg-[var(--bg-card)]",
  };

  const badgeStyles = {
    good: "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]",
    warn: "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]",
    bad: "bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]",
    neutral:
      "bg-[var(--bg-card-muted)] text-[var(--text-secondary)] border border-[var(--border-strong)]",
  };

  return (
    <section className={`rounded-2xl border p-5 ${toneStyles[driver.tone]}`}>
      <div className="ui-stack">
        <div>
          <div className="ui-kicker">Top Driver</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {driver.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {driver.body}
          </p>
        </div>

        <div className={`rounded-xl px-4 py-3 ${badgeStyles[driver.tone]}`}>
          <div className="ui-kicker opacity-80">{driver.metric_label}</div>
          <div className="mt-1 text-xl font-semibold">
            {driver.metric_value}
          </div>
        </div>
      </div>
    </section>
  );
}