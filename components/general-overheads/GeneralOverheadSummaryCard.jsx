export default function GeneralOverheadSummaryCard({
  total_general_overheads_display,
  overhead_rows,
}) {
  return (
    <section className="ui-panel">
      <div className="ui-page-stack">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Summary
          </h2>
          <p className="ui-help">
            Locked downstream total for Cost Summary consumption.
          </p>
        </div>

        <div className="ui-panel">
          <p className="ui-kicker">Total General Overheads</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {total_general_overheads_display}
          </p>
        </div>

        <div className="ui-stack">
          {overhead_rows.map((row) => (
            <div key={row.key} className="ui-split">
              <span className="ui-label">{row.label}</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {row.amount_display}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}