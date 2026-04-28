export default function GeneralOverheadStatusStrip({
  is_ready,
  warning_count,
  warnings,
  active_profile_name,
  saved_profile_count,
  total_general_overheads_display,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-row-between">
          <div className="ui-stack-sm">
            <div className="ui-kicker">General Overheads</div>
            <div className="ui-card-title-sm">
              {active_profile_name || "Untitled Profile"}
            </div>
            <p className="ui-help">
              Total annual general overhead burden:{" "}
              {total_general_overheads_display}
            </p>
          </div>

          <div className="ui-actions">
            <span className="ui-pill">
              {is_ready ? "Ready" : `${warning_count} warnings`}
            </span>
            <span className="ui-pill">
              Saved profiles: {saved_profile_count}
            </span>
          </div>
        </div>

        {warnings?.length > 0 ? (
          <div className="ui-stack-sm">
            {warnings.map((warning) => (
              <p key={warning} className="ui-help">
                {warning}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}