"use client";

import { useState } from "react";

function Pill({ text, tone = "ok" }) {
  return <span className={`ui-pill ui-pill-${tone}`}>{text}</span>;
}

export default function ModuleReconciliationReadinessChecklist({
  checks = [],
}) {
  const [is_open, set_is_open] = useState(false);

  const pass_count = checks.filter((check) => check.status === "pass").length;
  const total_count = checks.length;

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Readiness</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Module readiness checks
            </h2>
            <p className="ui-help">
              These confirm each module is fully set up and able to
              calculate a number. This is a separate question from the P&amp;L
              comparison above - a module can pass here and still show a
              variance against your P&amp;L. Readiness means the module works.
              The comparison above shows whether its number matches your
              P&amp;L.
            </p>
          </div>

          <button
            type="button"
            className={`business-summary-macro-row ${is_open ? "is-active" : ""}`}
            onClick={() => set_is_open((current) => !current)}
          >
            <div className="business-summary-macro-row-label">
              <div className="business-summary-macro-row-title">
                {pass_count} of {total_count} checks passing
              </div>
              <div className="business-summary-macro-row-help">
                {is_open
                  ? "Click to hide the checklist"
                  : "Click to see the full checklist"}
              </div>
            </div>
            <div className="business-summary-macro-row-value">
              {is_open ? "Hide" : "Show"}
            </div>
          </button>

          {is_open ? (
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
          ) : null}
        </div>
      </div>
    </section>
  );
}