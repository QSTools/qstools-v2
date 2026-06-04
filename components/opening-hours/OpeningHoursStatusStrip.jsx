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
        <p className="ui-kicker">Opening hours progress</p>
        <h2 className="ui-card-title-sm">Calendar readiness</h2>

        <p className="ui-help">
          Use this checkpoint to confirm whether the operating calendar is ready
          to flow into later Mirra setup pages.
        </p>

        <div className="ui-stack-sm">
          <div className="ui-row-between">
            <span className="ui-help">Status</span>
            <span className="ui-pill">{opening_hours_status || "not_ready"}</span>
          </div>

          <div className="ui-row-between">
            <span className="ui-help">Trust</span>
            <span className="ui-pill">
              {opening_hours_model_trust_state || "blocked"}
            </span>
          </div>

          <div className="ui-row-between">
            <span className="ui-help">Warnings</span>
            <strong>{warning_count || 0}</strong>
          </div>

          <div className="ui-row-between">
            <span className="ui-help">Weekly open hours</span>
            <strong>{Number(standard_weekly_open_hours || 0).toFixed(2)}</strong>
          </div>

          <div className="ui-row-between">
            <span className="ui-help">Annual open weeks</span>
            <strong>{Number(annual_open_weeks || 0).toFixed(2)}</strong>
          </div>

          <div className="ui-row-between">
            <span className="ui-help">Net annual open hours</span>
            <strong>
              {Number(net_annual_business_open_hours || 0).toFixed(2)}
            </strong>
          </div>
        </div>

        {!opening_hours_ready && (
          <p className="ui-help">
            Blocking issues exist. Review the weekly pattern and annual calendar
            before relying on this context.
          </p>
        )}
      </div>
    </section>
  );
}