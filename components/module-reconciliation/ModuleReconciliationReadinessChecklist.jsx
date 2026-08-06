"use client";

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

export default function ModuleReconciliationReadinessChecklist({
  checks = [],
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Readiness</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Module readiness checks
            </h2>
          </div>

          <div className="ui-stack">
            {checks.map((check) => (
              <div key={check.id} className="ui-readonly">
                <div className="ui-actions">
                  <span className="ui-label">{check.label}</span>
                  <Pill
                    text={check.status === "pass" ? "Pass" : "Attention"}
                    tone={check.status === "pass" ? "good" : "bad"}
                  />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {check.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}