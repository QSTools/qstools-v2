"use client";

export default function RevenueRealityLabourConsumptionBlock({
  formatted = {},
  labour_consumption_message = "",
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div>
            <div className="ui-kicker">Labour consumption</div>
            <h2 className="ui-card-title-sm">
              How much of your GP labour consumes
            </h2>
          </div>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Labour Cost</div>
              <div className="labour-summary-table-value">
                {formatted.total_labour_cost_annual}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">P&amp;L GP</div>
              <div className="labour-summary-table-value">
                {formatted.material_margin}
              </div>
            </div>
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">
                Labour consumption %
              </div>
              <div className="labour-summary-table-value">
                {formatted.labour_consumption_percent}
              </div>
            </div>
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">
                Remaining margin %
              </div>
              <div className="labour-summary-table-value">
                {formatted.remaining_margin_percent}
              </div>
            </div>
          </div>

          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {labour_consumption_message}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
