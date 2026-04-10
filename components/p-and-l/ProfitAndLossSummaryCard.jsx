"use client";

export default function ProfitAndLossSummaryCard({
  headline = [],
  secondary = [],
  insights = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">Annual Snapshot</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            P&amp;L Summary
          </h2>
        </div>

        <div className="ui-stack">
          {headline.map((item) => (
            <div key={item.label} className="ui-panel">
              <div className="ui-kicker">{item.label}</div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="ui-stack">
          {secondary.map((item) => (
            <div key={item.label} className="ui-panel">
              <div className="ui-kicker">{item.label}</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {insights.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Insights</div>
            {insights.map((insight) => (
              <p key={insight} className="ui-help">
                {insight}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}