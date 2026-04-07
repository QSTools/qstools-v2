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
      <div className="ui-split">
        <div>
          <p className="ui-kicker">General Overheads</p>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            {active_profile_name}
          </h1>
          <p className="ui-help">
            Total annual general overhead burden: {total_general_overheads_display}
          </p>
        </div>

        <div className="ui-stack">
          <span className="ui-pill">
            {is_ready ? "Ready" : `${warning_count} warnings`}
          </span>
          <span className="ui-pill">Saved profiles: {saved_profile_count}</span>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="mt-4 ui-stack">
          {warnings.map((warning) => (
            <p key={warning} className="ui-help">
              {warning}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}