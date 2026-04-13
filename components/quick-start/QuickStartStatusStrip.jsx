export default function QuickStartStatusStrip({
  kicker,
  title,
  subtitle,
  mode_label,
  primary_value,
  primary_label,
  warning_count,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <p className="ui-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="ui-help">{subtitle}</p>

        <div className="ui-split">
          <div className="ui-stack">
            <span className="ui-label">Mode</span>
            <div className="ui-readonly">{mode_label}</div>
          </div>

          <div className="ui-stack">
            <span className="ui-label">{primary_label}</span>
            <div className="ui-readonly">{primary_value}</div>
          </div>

          <div className="ui-stack">
            <span className="ui-label">Warnings</span>
            <div className="ui-readonly">{warning_count}</div>
          </div>
        </div>
      </div>
    </section>
  );
}