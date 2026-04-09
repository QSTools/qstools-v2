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

export default function SquareMetreRateSummaryCard({
  base_rate = 0,
  minimum_charge = 0,
  expected_annual_volume = 0,
  expected_revenue_annual = 0,
  rate_health = "ok",
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Summary</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Square metre model summary
            </h2>
          </div>

          <div className="ui-actions">
            <Pill text={`Rate health: ${rate_health}`} tone={rate_health} />
          </div>

          <div className="ui-stack">
            <div className="ui-readonly">
              <span className="ui-label">Rate per m²</span>
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

          <p className="text-sm text-[var(--text-secondary)]">
            Small jobs often depend heavily on minimum charge. Low annual m² makes
            the model fragile.
          </p>
        </div>
      </div>
    </section>
  );
}