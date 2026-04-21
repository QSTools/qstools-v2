"use client";

function get_tone_class(tone = "neutral") {
  if (tone === "good") return "ui-pill";
  if (tone === "warn") return "ui-pill";
  if (tone === "bad") return "ui-pill";
  return "ui-pill";
}

function get_tone_label(tone = "neutral") {
  if (tone === "good") return "Healthy";
  if (tone === "warn") return "Watch";
  if (tone === "bad") return "Pressure";
  return "Info";
}

export default function TopDriverCard({
  driver_key = "no_driver",
  driver_title = "No driver available",
  driver_body = "",
  driver_insight = "",
  tone = "neutral",
  metric_label = "Metric",
  metric_value = "—",
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-split">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Top driver</div>
            <h2 className="ui-card-title">{driver_title}</h2>
            <p className="ui-help">
              This highlights the main live Labour pressure using Labour outputs
              only.
            </p>
          </div>

          <div className="ui-actions">
            <span className={get_tone_class(tone)}>
              {get_tone_label(tone)}
            </span>
          </div>
        </div>

        <div className="ui-split-2">
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Why this matters</div>
              <p>{driver_body || "No driver explanation available."}</p>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Key metric</div>

              <div>
                <div className="ui-label">{metric_label}</div>
                <div className="ui-card-title-sm">{metric_value}</div>
              </div>

              <div>
                <div className="ui-label">Driver key</div>
                <div>{driver_key}</div>
              </div>
            </div>
          </div>
        </div>

        {driver_insight ? (
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Insight</div>
              <p>{driver_insight}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}