"use client";

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

function SummarySection({ title = "", rows = [] }) {
  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <div className="ui-kicker">{title}</div>
        <SummaryTable rows={rows} />
      </div>
    </div>
  );
}

export default function LabourSummaryCard({ meta = {}, sections = [] }) {
  const has_sections = Array.isArray(sections) && sections.length > 0;

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Labour Summary</div>
          <h2 className="ui-card-title">Current labour position</h2>
        </div>

        {!has_sections ? (
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
                <div className="ui-kicker">Profile context</div>

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
            </div>

            <div className="ui-stack-sm">
              {sections.map((section) => (
                <SummarySection
                  key={section.key}
                  title={section.title}
                  rows={section.rows}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}