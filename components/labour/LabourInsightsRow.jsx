"use client";

export default function LabourInsightsRow({ state, outputs, has_profile }) {
  if (!has_profile) return null;

  const break_even = outputs.productive_labour_cost_rate;
  const target = outputs.minimum_charge_out_rate;
  const actual = Number(state.charge_out_rate || 0);

  const margin_status =
    outputs.margin_gap > 0
      ? "good"
      : outputs.margin_gap === 0
      ? "neutral"
      : "bad";

  const drivers = get_cost_drivers(state, outputs);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

      {/* 1. RATE COMPARISON */}
      <Card title="Charge-Out Position">
        <Row label="Break-even" value={fmtCur(break_even)} />
        <Row label="Target Rate" value={fmtCur(target)} />
        <Row label="Your Rate" value={fmtCur(actual)} />

        <div className="mt-3 border-t border-[var(--border-primary)] pt-3">
          <StatusBadge status={margin_status} gap={outputs.margin_gap} />
        </div>
      </Card>

      {/* 2. WARNING STATE */}
      <Card title="Margin Status">
        <div className="space-y-2 text-sm">
          <StatusBanner status={margin_status} gap={outputs.margin_gap} />
        </div>
      </Card>

      {/* 3. COST DRIVERS */}
      <Card title="What’s Driving Your Cost">
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          {drivers.map((d, i) => (
            <div key={i}>• {d}</div>
          ))}
        </div>
      </Card>

    </div>
  );
}

function get_cost_drivers(state, outputs) {
  const drivers = [];

  if (Number(state.productivity_percent) < 80) {
    drivers.push("Low productivity is increasing your hourly cost");
  }

  if (outputs.non_productive_paid_hours > 300) {
    drivers.push("High entitlements are reducing productive hours");
  }

  if (Number(state.labour_rate) > 40) {
    drivers.push("Higher wage rate is increasing base cost");
  }

  if (outputs.total_employer_contribution_cost > 10000) {
    drivers.push("Employer contributions are adding significant cost");
  }

  if (drivers.length === 0) {
    drivers.push("Cost structure is well balanced");
  }

  return drivers;
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
      <div className="mb-3 text-sm font-medium text-[var(--text-muted)]">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
      <span>{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function StatusBadge({ status, gap }) {
  const styles = {
    good: "text-emerald-400",
    neutral: "text-amber-400",
    bad: "text-rose-400",
  };

  const text =
    status === "good"
      ? "Above Target"
      : status === "neutral"
      ? "At Target"
      : "Below Target";

  return (
    <div className={`text-sm font-medium ${styles[status]}`}>
      {text} ({fmtCur(gap)})
    </div>
  );
}

function StatusBanner({ status, gap }) {
  const styles = {
    good: "border-emerald-700 bg-emerald-950 text-emerald-300",
    neutral: "border-amber-700 bg-amber-950 text-amber-300",
    bad: "border-rose-700 bg-rose-950 text-rose-300",
  };

  const text =
    status === "good"
      ? "You are charging above your target margin"
      : status === "neutral"
      ? "You are exactly at your target margin"
      : "Your charge-out is below your required margin";

  return (
    <div className={`rounded-xl border px-3 py-2 ${styles[status]}`}>
      {text} ({fmtCur(gap)})
    </div>
  );
}

function fmtCur(v) {
  return Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}