function get_status_label(status) {
  const value = String(status || "").toUpperCase();
  return value || "UNKNOWN";
}

function ReadinessGroup({ group = {} }) {
  const checks = Array.isArray(group.checks) ? group.checks : [];

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="ui-kicker">{group.label || group.id}</div>
          <p className="ui-help">
            Passed: {group.passed_count ?? 0} | Warnings:{" "}
            {group.warning_count ?? 0} | Blocking: {group.blocking_count ?? 0}
          </p>
        </div>

        <span className="ui-pill">{get_status_label(group.status)}</span>
      </div>

      <div className="ui-stack-sm">
        {checks.map((check, index) => (
          <div
            key={check.id ?? `group-check-${index}`}
            className="border-b border-[var(--border-primary)] py-3 last:border-b-0"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="ui-stack-sm">
                <strong>{check.label || check.module || "Readiness check"}</strong>
                <p className="ui-help">{check.message}</p>
                {check.recommended_action ? (
                  <p className="ui-help">Next: {check.recommended_action}</p>
                ) : null}
              </div>

              <span className="ui-pill">{get_status_label(check.status)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ModelReadinessReconciliationChecks({
  checks = [],
  readiness_groups = [],
}) {
  const has_readiness_groups =
    Array.isArray(readiness_groups) && readiness_groups.length > 0;

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div>
          <div className="ui-kicker">
            {has_readiness_groups
              ? "Readiness Groups"
              : "Reconciliation Checks"}
          </div>
          <p className="ui-help">
            {has_readiness_groups
              ? "Grouped model readiness checks for source inputs, module outputs, reconciliation, traceability and modelling readiness."
              : "The following checks are derived from Profit & Loss, Labour, General Overheads and Assets."}
          </p>
        </div>

        {has_readiness_groups ? (
          <div className="ui-stack-sm">
            {readiness_groups.map((group, index) => (
              <ReadinessGroup
                key={group.id ?? `readiness-group-${index}`}
                group={group}
              />
            ))}
          </div>
        ) : (
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

                  <span className="ui-pill">
                    {get_status_label(check.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
