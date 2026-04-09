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

export default function MaterialsSummaryCard({
  annual_material_revenue = 0,
  annual_material_cost = 0,
  material_margin_annual = 0,
  material_margin_percent = 0,
  margin_health = "ok",
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Summary</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Material margin contribution
            </h2>
          </div>

          <div className="ui-actions">
            <Pill text={`Margin health: ${margin_health}`} tone={margin_health} />
          </div>

          <div className="ui-stack">
            <div className="ui-readonly">
              <span className="ui-label">Annual Material Revenue</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(annual_material_revenue)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Annual Material Cost</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(annual_material_cost)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Annual Material Margin</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(material_margin_annual)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Margin %</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_percent(material_margin_percent)}
              </div>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Material margin is one recovery stream only. It does not replace labour
            or asset recovery.
          </p>
        </div>
      </div>
    </section>
  );
}