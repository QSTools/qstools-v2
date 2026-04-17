"use client";

export default function LabourRateRealityCheckStatusStrip({
  title,
  readiness_label,
  warning_count,
  warnings = [],
  summary,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <div className="ui-kicker">Quick Start</div>
              <h2 className="ui-section-title">{title}</h2>
            </div>

            <div className="ui-actions">
              <span className="ui-pill">{readiness_label}</span>
              <span className="ui-pill">{warning_count} warnings</span>
            </div>
          </div>

          <p className="ui-help">{summary}</p>

          {warnings.length > 0 ? (
            <div className="ui-stack">
              {warnings.map((warning) => (
                <div key={warning} className="ui-help">
                  • {warning}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}