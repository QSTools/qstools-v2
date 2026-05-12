"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function SummaryTable({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <p className="ui-help">No values available for this section yet.</p>;
  }

  return (
    <div className="labour-summary-table">
      {rows.map((row, index) => {
        if (row.is_spacer) {
          return (
            <div
              key={`spacer-${index}`}
              className="labour-summary-table-spacer"
            />
          );
        }

        return (
          <div
            key={`${row.label}-${index}`}
            className={`labour-summary-table-row ${
              row.is_total ? "total" : ""
            }`}
          >
            <div className="labour-summary-table-label">{row.label}</div>
            <div className="labour-summary-table-value">{row.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function DecisionTile({ row = {}, index = 0 }) {
  const is_primary = row.is_total || index === 4;

  return (
    <div className={`ui-panel ${is_primary ? "ui-panel-strong" : ""}`}>
      <div className="ui-stack-sm">
        <div className="ui-help">{row.label}</div>
        <div className="ui-card-title-sm">{row.value}</div>
        {row.helper ? <p className="ui-help">{row.helper}</p> : null}
      </div>
    </div>
  );
}

function DecisionGrid({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <p className="ui-help">No headline values available yet.</p>;
  }

  return (
    <div className="labour-decision-grid">
      {rows.map((row, index) => (
        <DecisionTile
          key={`${row.label}-${index}`}
          row={row}
          index={index}
        />
      ))}
    </div>
  );
}

function ChargeOutResultCard({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  return (
    <div className="ui-panel labour-charge-out-result">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Current charge-out result</div>
        <h3 className="ui-card-title-sm">What this rate produces</h3>
        <p className="ui-help">
          Labour-only result from the current charge-out. Wider business
          overhead and asset recovery are handled downstream.
        </p>

        <div className="labour-summary-table">
          {rows.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              className={`labour-summary-table-row ${
                row.is_total ? "total" : ""
              }`}
            >
              <div className="labour-summary-table-label">
                <div>{row.label}</div>
                {row.helper ? <div className="ui-help">{row.helper}</div> : null}
              </div>
              <div className="labour-summary-table-value">{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummarySection({ title = "", summary = "", rows = [] }) {
  return (
    <CollapsibleSection title={title} summary={summary} defaultOpen={false}>
      <div className="ui-panel">
        <SummaryTable rows={rows} />
      </div>
    </CollapsibleSection>
  );
}

function ProfileContext({ meta = {} }) {
  return (
    <CollapsibleSection
      title="Profile context"
      summary="Staff, role and labour class"
      defaultOpen={false}
    >
      <div className="ui-panel">
        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Staff</div>
            <div className="labour-summary-table-value">
              {meta.staff_name || "Unnamed staff"}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Role</div>
            <div className="labour-summary-table-value">
              {meta.staff_role || "No role"}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Class</div>
            <div className="labour-summary-table-value">
              {meta.labour_class || "No class"}
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

export default function LabourSummaryCard({
  meta = {},
  decision_status = {},
  decision_rows = [],
  charge_out_result_rows = [],
  sections = [],
  has_profile = false,
  save_profile,
  start_new_profile,
}) {
  const has_sections = Array.isArray(sections) && sections.length > 0;
  const has_decision_rows =
    Array.isArray(decision_rows) && decision_rows.length > 0;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Labour Summary</div>
          <h2 className="ui-card-title">Current labour position</h2>
          <p className="ui-help">
            Paid hours are not productive hours. Productive hours are what the
            business actually has available to recover labour cost.
          </p>
        </div>

        {!has_sections && !has_decision_rows ? (
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">No live summary yet</div>
              <p className="ui-help">
                Create or load a labour profile to unlock the live Labour
                summary.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Decision view</div>
                <h3 className="ui-card-title-sm">
                  {decision_status.status_label || "Labour recovery position"}
                </h3>
                <p className="ui-help">
                  {decision_status.message ||
                    "This view shows the smallest set of values needed to understand the current labour recovery position."}
                </p>
              </div>
            </div>

            <DecisionGrid rows={decision_rows} />

            <ChargeOutResultCard rows={charge_out_result_rows} />

            <div className="ui-stack-sm">
              <ProfileContext meta={meta} />

              {sections.map((section) => (
                <SummarySection
                  key={section.key}
                  title={section.title}
                  summary={section.summary || "Show breakdown"}
                  rows={section.rows}
                />
              ))}

              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div className="ui-kicker">Next step</div>
                  <p className="ui-help">
                    Check this labour summary, save the profile, then continue
                    to the next setup module.
                  </p>

                  <div className="ui-actions">
                    <button
                      type="button"
                      className="ui-button-primary"
                      disabled={!has_profile}
                      onClick={save_profile}
                    >
                      Save profile
                    </button>

                    <button
                      type="button"
                      className="ui-button-secondary"
                      onClick={start_new_profile}
                    >
                      Create new profile
                    </button>

                    <a className="ui-button-secondary" href="/assets">
                      Next module
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}