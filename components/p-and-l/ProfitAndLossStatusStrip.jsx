"use client";

function tone_class(tone) {
  switch (tone) {
    case "good":
      return "ui-pill ui-pill-success";
    case "bad":
      return "ui-pill ui-pill-danger";
    case "warn":
      return "ui-pill ui-pill-warning";
    default:
      return "ui-pill";
  }
}

export default function ProfitAndLossStatusStrip({
  items = [],
  warnings = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-stack-sm">
          <span className="ui-kicker">Status</span>
          <h2 className="ui-section-title">Profit &amp; Loss Snapshot</h2>
        </div>

        <div className="ui-section-muted">
          <div className="labour-summary-table">
            {items.map((item) => (
              <div key={item.label} className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  {item.label}
                </div>
                <div className="labour-summary-table-value">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {warnings.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <span className="ui-label">Warnings</span>
            <div className="ui-stack-sm">
              {warnings.map((warning) => (
                <p key={warning} className="ui-help">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}