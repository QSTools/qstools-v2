"use client";

import Link from "next/link";

function ComparisonBar({ fill_percent, headline_rate_label, equivalent_rate_label, caption }) {
  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div className="ui-help">{headline_rate_label}</div>
        <div className="ui-help">{equivalent_rate_label}</div>

        <div
          className="ui-readonly"
          aria-hidden="true"
          style={{ padding: 6 }}
        >
          <div
            style={{
              width: "100%",
              height: 16,
              borderRadius: 999,
              background: "var(--bg-input)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${fill_percent}%`,
                height: "100%",
                borderRadius: 999,
                background: "var(--accent)",
              }}
            />
          </div>
        </div>

        <p className="ui-help">{caption}</p>
      </div>
    </div>
  );
}

export default function LabourRateRealityCheckMainCard({
  title,
  kicker,
  inputs,
  hero,
  graph,
  explanation,
  annual_snapshot,
  detail_rows = [],
  soft_warning,
  cta,
}) {
  const handle_change = (event) => {
    const { name, value } = event.target;
    inputs.on_change(name, value);
  };

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <div className="ui-kicker">{kicker}</div>
            <h1 className="ui-section-title">{title}</h1>
          </div>

          <div className="ui-stack">
            <label className="ui-label" htmlFor="labour_rate">
              Hourly rate
            </label>
            <input
              id="labour_rate"
              name="labour_rate"
              type="number"
              min="0"
              step="0.01"
              className="ui-input"
              value={inputs.labour_rate}
              onChange={handle_change}
            />

            <label className="ui-label" htmlFor="hours_per_week">
              Hours per week
            </label>
            <input
              id="hours_per_week"
              name="hours_per_week"
              type="number"
              min="0"
              step="0.1"
              className="ui-input"
              value={inputs.hours_per_week}
              onChange={handle_change}
            />

            <label className="ui-label" htmlFor="days_per_week">
              Days per week
            </label>
            <input
              id="days_per_week"
              name="days_per_week"
              type="number"
              min="1"
              step="1"
              className="ui-input"
              value={inputs.days_per_week}
              onChange={handle_change}
            />

            <div className="ui-actions">
              <button type="button" className="ui-button-secondary" onClick={inputs.on_reset}>
                Reset
              </button>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <p className="ui-help">{hero.think_line}</p>
              <h2 className="ui-section-title">{hero.actual_line}</h2>
            </div>
          </div>

          <ComparisonBar {...graph} />

          <div className="ui-stack">
            <p>{explanation.line_1}</p>
            <p>{explanation.line_2}</p>
          </div>

          <div className="ui-panel">
            <div className="ui-stack">
              <div className="ui-split">
                <span className="ui-label">{annual_snapshot.perfect_world_label}</span>
                <strong>{annual_snapshot.perfect_world_value}</strong>
              </div>

              <div className="ui-split">
                <span className="ui-label">{annual_snapshot.realistic_label}</span>
                <strong>{annual_snapshot.realistic_value}</strong>
              </div>
            </div>
          </div>

          <div className="ui-stack">
            {detail_rows.map((row) => (
              <div key={row.label} className="ui-split">
                <span className="ui-label">{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>

          <p className="ui-help">{soft_warning}</p>

          <Link href={cta.href} className="ui-button-primary">
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}