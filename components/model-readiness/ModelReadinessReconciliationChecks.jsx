function get_status_label(status) {
  const value = String(status || "").toUpperCase();
  return value || "UNKNOWN";
}

export default function ModelReadinessReconciliationChecks({ checks = [] }) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div>
          <div className="ui-kicker">Reconciliation Checks</div>
          <p className="ui-help">
            The following checks are derived from Profit & Loss, Labour, General
            Overheads and Assets.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          {checks.map((check, index) => (
            <div
              key={check.id ?? `check-row-${index}`}
              className="border-b border-[var(--border-primary)] py-3 last:border-b-0"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="ui-stack-sm">
                  <strong>{check.label}</strong>
                  <p className="ui-help">{check.message}</p>
                  {check.detail ? (
                    <p className="ui-help">{check.detail}</p>
                  ) : null}
                </div>

                <span className="ui-pill">{get_status_label(check.status)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}