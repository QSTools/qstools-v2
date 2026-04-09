"use client";

function format_currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function format_percent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

export default function RevenueSummarySummaryCard({
  current_revenue = 0,
  total_cost_burden = 0,
  actual_profit_model = 0,
  actual_profit_percent = 0,
  required_revenue = 0,
  revenue_gap = 0,
  health = "ok",
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Summary</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Business baseline summary
            </h2>
          </div>

          <div className="ui-actions">
            <Pill text={`Health: ${health}`} tone={health} />
          </div>

          <div className="ui-stack">
            <div className="ui-readonly">
              <span className="ui-label">Current Revenue</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(current_revenue)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Total Cost Burden</span>
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

            <div className="ui-readonly">
              <span className="ui-label">Required Revenue</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(required_revenue)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Revenue Gap</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(revenue_gap)}
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            This is the high-level baseline that later pricing pages will use to
            build sustainable rates.
          </p>
        </div>
      </div>
    </section>
  );
}