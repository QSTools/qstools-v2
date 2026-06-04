export default function OpeningHoursStatusStrip({
  opening_hours_status,
  opening_hours_ready,
  opening_hours_model_trust_state,
  warning_count,
  standard_weekly_open_hours,
  annual_open_weeks,
  net_annual_business_open_hours,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-split">
          <div>
            <p className="ui-kicker">Opening Hours</p>
            <h1 className="ui-heading">Operating Calendar</h1>
            <p className="ui-help">
              Defines when the business is normally available to operate. This
              is not the same as productive Labour hours or Asset utilisation.
            </p>
          </div>

          <div className="ui-stack">
            <span className="ui-pill">
              Status: {opening_hours_status || "not_ready"}
            </span>
            <span className="ui-pill">
              Trust: {opening_hours_model_trust_state || "blocked"}
            </span>
            <span className="ui-pill">
              Warnings: {warning_count || 0}
            </span>
          </div>
        </div>

        <div className="ui-grid ui-grid-3">
          <div className="ui-readonly">
            <span className="ui-label">Weekly open hours</span>
            <strong>{Number(standard_weekly_open_hours || 0).toFixed(2)}</strong>
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Annual open weeks</span>
            <strong>{Number(annual_open_weeks || 0).toFixed(2)}</strong>
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Net annual open hours</span>
            <strong>
              {Number(net_annual_business_open_hours || 0).toFixed(2)}
            </strong>
          </div>
        </div>

        {!opening_hours_ready && (
          <p className="ui-help">
            Opening Hours has blocking issues. Review the weekly pattern and
            annual calendar before using this context downstream.
          </p>
        )}
      </div>
    </section>
  );
}