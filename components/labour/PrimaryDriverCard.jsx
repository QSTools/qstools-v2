"use client";

function getTonePanelClass(tone = "neutral") {
  if (tone === "good") return "ui-panel ui-panel-success";
  if (tone === "warn") return "ui-panel ui-panel-warning";
  if (tone === "bad") return "ui-panel ui-panel-danger";
  return "ui-panel";
}

function getTonePillClass(tone = "neutral") {
  if (tone === "good") return "ui-pill ui-pill-success";
  if (tone === "warn") return "ui-pill ui-pill-warning";
  if (tone === "bad") return "ui-pill ui-pill-danger";
  return "ui-pill";
}

function getToneLabel(tone = "neutral") {
  if (tone === "good") return "Healthy";
  if (tone === "warn") return "Watch";
  if (tone === "bad") return "Issue";
  return "Info";
}

export default function PrimaryDriverCard({
  driver_title = "No driver available",
  driver_body = "",
  driver_insight = "",
  metric_label = "Metric",
  metric_value = "—",
  tone = "neutral",
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-split">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Primary driver</div>
            <h2 className="ui-card-title">{driver_title}</h2>
            <p className="ui-help">
              This highlights the main factor currently driving your Labour-only
              result.
            </p>
          </div>

          <div className="ui-actions">
            <span className={getTonePillClass(tone)}>
              {getToneLabel(tone)}
            </span>
          </div>
        </div>

        <div className={getTonePanelClass(tone)}>
          <div className="ui-stack-sm">
            <div className="ui-kicker">Why this matters</div>
            <p>{driver_body}</p>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Key metric</div>

            <div className="ui-split">
              <div className="ui-label">{metric_label}</div>
              <div className="ui-card-title-sm">{metric_value}</div>
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">What this means</div>
            <p>{driver_insight}</p>
          </div>
        </div>
      </div>
    </section>
  );
}