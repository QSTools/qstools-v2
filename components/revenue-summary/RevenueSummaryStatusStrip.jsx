"use client";

function format_currency(value) {
  return `$${Math.round(Number(value || 0)).toLocaleString()}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

export default function RevenueSummaryStatusStrip({
  profile_active = true,
  current_revenue = 0,
  total_cost_burden = 0,
  actual_profit_model = 0,
  actual_profit_percent = 0,
  health = "ok",
  warning_count = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Revenue Summary</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Actual business baseline
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Capture the critical high-level P&amp;L figures needed to build
              rates later.
            </p>
          </div>

          <div className="ui-actions">
            <Pill
              text={profile_active ? "Profile active" : "Profile inactive"}
              tone={profile_active ? "good" : "bad"}
            />
            <Pill text={`Health: ${health}`} tone={health} />
            <Pill
              text={`Warnings: ${warning_count}`}
              tone={warning_count > 0 ? "bad" : "good"}
            />
          </div>

          <div className="ui-stack">
            <div className="ui-readonly">
              <span className="ui-label">Current Revenue</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(current_revenue)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Total Cost Burden (model)</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(total_cost_burden)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Actual Profit (model)</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(actual_profit_model)} ·{" "}
                {format_percent(actual_profit_percent)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}