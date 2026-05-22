"use client";

export default function RevenueRealityComparisonBlock({
  comparison_rows = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div>
            <div className="ui-kicker">Before / after</div>
            <h2 className="ui-card-title-sm">
              P&amp;L GP versus stress-tested margin
            </h2>
            <p className="ui-help">
              P&amp;L GP is the accounting view. Stress-tested margin shows
              what remains after labour is enforced.
            </p>
          </div>

          <div className="labour-summary-table">
            {comparison_rows.map((row) => (
              <div
                key={row.label}
                className={`labour-summary-table-row ${
                  row.total ? "total" : ""
                }`}
              >
                <div className="labour-summary-table-label">{row.label}</div>
                <div className="labour-summary-table-value">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
