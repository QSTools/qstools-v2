"use client";

export default function ProfitAndLossStatusStrip({ items = [], warnings = [] }) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div>
          <div className="ui-kicker">P&amp;L</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            P&amp;L Business Picture
          </h2>
        </div>

        <div className="ui-stack">
          {items.map((item) => (
            <div key={item.label} className="ui-panel">
              <div className="ui-kicker">{item.label}</div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {warnings.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Warnings</div>
            {warnings.map((warning) => (
              <p key={warning} className="ui-help">
                {warning}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}