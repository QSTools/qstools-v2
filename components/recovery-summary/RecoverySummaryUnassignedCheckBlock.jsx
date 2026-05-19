export default function RecoverySummaryUnassignedCheckBlock({
  overhead_absorption_level,
  overhead_absorption_title,
  overhead_absorption_message,
  overhead_absorption_diagnostics = [],
}) {
  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Unassigned recovery check
          </h3>

          <p className="ui-help">
            This checks whether any part of the starting recovery model still
            needs to be allocated to labour, productive assets, or materials /
            products. This is a recovery strategy issue, not the same as Other /
            Unallocated in General Overheads.
          </p>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">
              {overhead_absorption_level === "high"
                ? "Strong review"
                : overhead_absorption_level === "medium"
                  ? "Review"
                  : "Status"}
            </p>

            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              {overhead_absorption_title}
            </h4>

            <p className="text-sm font-medium text-[var(--text-primary)]">
              {overhead_absorption_message}
            </p>
          </div>
        </div>

        {overhead_absorption_diagnostics.length > 0 ? (
          <div className="ui-stack-sm">
            {overhead_absorption_diagnostics.map((diagnostic) => (
              <div key={diagnostic.diagnostic_key} className="ui-readonly">
                <div className="ui-stack-sm">
                  <p className="ui-label">{diagnostic.title}</p>

                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {diagnostic.message}
                  </p>

                  <p className="ui-help">{diagnostic.check_area}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
