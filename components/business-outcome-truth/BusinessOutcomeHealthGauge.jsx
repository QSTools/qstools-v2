"use client";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function polar_to_cartesian(cx, cy, r, angle_deg) {
  const rad = (Math.PI * angle_deg) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

// Scale: -0.5 (deep red, real total is a loss despite each source's own
// best-case being positive) to 1.0 (full green - the ceiling, meaning
// smoothed_net_profit exactly matches independent_net_profit_floored,
// i.e. no cross-subsidy drag at all). health_ratio is mathematically
// bounded at or below 1.0 by construction - independent_net_profit_floored
// is the best-case sum with underperformers floored to $0, so the real
// (smoothed) total can only be lower, never higher.
const SCALE_MIN = -0.5;
const SCALE_MAX = 1.0;

function ratio_to_angle(ratio) {
  const clamped = clamp(ratio, SCALE_MIN, SCALE_MAX);
  const fraction = (clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
  // polar_to_cartesian: angle 0 = right (green end), angle 180 = left
  // (red end). Fraction 0 (worst) must map to 180, fraction 1 (best) to 0.
  return 180 - fraction * 180;
}

function zone_for_ratio(ratio) {
  if (ratio < 0) return { label: "Unhealthy - real loss despite individual sources being viable on their own", color: "var(--danger)" };
  if (ratio < 0.7) return { label: "Some cross-subsidy drag", color: "var(--warning)" };
  return { label: "Healthy - little drag from underperforming sources", color: "var(--success)" };
}

/**
 * BusinessOutcomeHealthGauge
 *
 * Semi-circle arc gauge with a needle (2026-09-11). Reads
 * per_source.health_gauge, computed once in
 * hooks/useBusinessOutcomePerSourceRevenue.js via calculateGaugeInput
 * (moved here from Business Modelling per user decision - the baseline
 * is trusted, computed once in Outcome, consumed downstream later by
 * Modelling, same "reuse the engine" principle as the rest of this
 * session's work).
 *
 * health_ratio = smoothed_net_profit (the real, cascade-adjusted total,
 * after cross-subsidy between sources) / independent_net_profit_floored
 * (what each source would have earned entirely on its own, floored at
 * $0 so an underperformer can't drag the baseline negative). A ratio
 * near 1 means little real drag; well below 1, or negative, means
 * meaningful cross-subsidy is happening beneath the smoothed total.
 *
 * Scale and zone thresholds (-0.5 to 1.0, zones at 0 and 0.7) are a
 * first pass, not yet validated against a range of real businesses -
 * expect to revisit once this has been seen against more real data.
 */
export default function BusinessOutcomeHealthGauge({ health_gauge }) {
  if (!health_gauge || !health_gauge.available) {
    return (
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-section-title">Business Health Gauge</div>
        <p>Not available yet - upstream sources aren&apos;t ready.</p>
      </div>
    );
  }

  const ratio = Number(health_gauge.health_ratio) || 0;
  const angle_deg = ratio_to_angle(ratio);
  const zone = zone_for_ratio(ratio);

  const cx = 150;
  const cy = 150;
  const r_outer = 120;
  const r_inner = 88;
  const needle_length = 105;

  const needle_end = polar_to_cartesian(cx, cy, needle_length, angle_deg);

  const arc_start_outer = polar_to_cartesian(cx, cy, r_outer, 180);
  const arc_end_outer = polar_to_cartesian(cx, cy, r_outer, 0);
  const arc_end_inner = polar_to_cartesian(cx, cy, r_inner, 0);
  const arc_start_inner = polar_to_cartesian(cx, cy, r_inner, 180);

  const arc_path = [
    `M ${arc_start_outer.x} ${arc_start_outer.y}`,
    `A ${r_outer} ${r_outer} 0 0 1 ${arc_end_outer.x} ${arc_end_outer.y}`,
    `L ${arc_end_inner.x} ${arc_end_inner.y}`,
    `A ${r_inner} ${r_inner} 0 0 0 ${arc_start_inner.x} ${arc_start_inner.y}`,
    "Z",
  ].join(" ");

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Business Health Gauge</div>
      <div className="ui-help">
        Compares your real, smoothed net profit (after any cross-subsidy between sources) against
        what each source would have earned entirely on its own, floored at $0. A ratio near 1 means
        little drag from underperforming sources; well below 1, or negative, signals real
        cross-subsidy masking underlying weakness in the smoothed total above.
      </div>
      <svg viewBox="0 0 300 200" style={{ width: "100%", maxWidth: 320, margin: "0 auto", display: "block" }}>
        <defs>
          <linearGradient id="health-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--danger)" />
            <stop offset="50%" stopColor="var(--warning)" />
            <stop offset="100%" stopColor="var(--success)" />
          </linearGradient>
        </defs>
        <path d={arc_path} fill="url(#health-gauge-gradient)" />
        <line
          x1={cx}
          y1={cy}
          x2={needle_end.x}
          y2={needle_end.y}
          stroke="var(--text-primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="8" fill="var(--text-primary)" />
        <text x={cx} y={cy + 32} textAnchor="middle" fontSize="26" fontWeight="700" fill={zone.color}>
          {ratio.toFixed(2)}
        </text>
      </svg>
      <div className="ui-help" style={{ textAlign: "center", color: zone.color, fontWeight: 600 }}>
        {zone.label}
      </div>
    </div>
  );
}