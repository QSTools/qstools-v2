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

export default function MaterialsStatusStrip({
  profile_active = true,
  annual_material_revenue = 0,
  annual_material_cost = 0,
  material_margin_annual = 0,
  material_margin_percent = 0,
  margin_health = "ok",
  revenue_entered = false,
  cost_entered = false,
  warning_count = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Materials</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              Annual material margin
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Enter annual material buy and sell values to calculate material
              margin.
            </p>
          </div>

          <div className="ui-actions">
            <Pill
              text={profile_active ? "Profile active" : "Profile inactive"}
              tone={profile_active ? "good" : "bad"}
            />
            <Pill
              text={revenue_entered ? "Revenue entered" : "Revenue missing"}
              tone={revenue_entered ? "good" : "bad"}
            />
            <Pill
              text={cost_entered ? "Cost entered" : "Cost missing"}
              tone={cost_entered ? "good" : "bad"}
            />
            <Pill
              text={`Margin: ${margin_health}`}
              tone={margin_health}
            />
            <Pill
              text={`Warnings: ${warning_count}`}
              tone={warning_count > 0 ? "bad" : "good"}
            />
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
              <span className="ui-label">Material Margin</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(material_margin_annual)} ·{" "}
                {format_percent(material_margin_percent)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}