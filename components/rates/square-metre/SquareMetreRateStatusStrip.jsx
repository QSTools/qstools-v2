"use client";

function format_currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

export default function SquareMetreRateStatusStrip({
  profile_active = true,
  base_rate = 0,
  minimum_charge = 0,
  expected_annual_volume = 0,
  expected_revenue_annual = 0,
  rate_health = "ok",
  warning_count = 0,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Square Metre Rate</p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              m²-based revenue model
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              This page models revenue generated from m²-based pricing.
            </p>
          </div>

          <div className="ui-actions">
            <Pill
              text={profile_active ? "Profile active" : "Profile inactive"}
              tone={profile_active ? "good" : "bad"}
            />
            <Pill text={`Rate health: ${rate_health}`} tone={rate_health} />
            <Pill
              text={`Warnings: ${warning_count}`}
              tone={warning_count > 0 ? "bad" : "good"}
            />
          </div>

          <div className="ui-stack">
            <div className="ui-readonly">
              <span className="ui-label">Base Rate</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(base_rate)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Minimum Charge</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(minimum_charge)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Expected Annual m²</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {Number(expected_annual_volume || 0).toLocaleString()}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Expected Annual Revenue</span>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {format_currency(expected_revenue_annual)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}