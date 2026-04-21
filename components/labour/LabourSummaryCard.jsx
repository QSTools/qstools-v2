"use client";

export default function LabourSummaryCard({
  meta = {},
  rows = [],
}) {
  const emphasis_rows = rows.filter((row) => row?.emphasis);
  const standard_rows = rows.filter((row) => !row?.emphasis);

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Labour summary</div>
          <h2 className="ui-card-title">Current labour position</h2>
          <p className="ui-help">
            This card reflects the live Labour engine outputs only. It does not
            include employee overheads, assets, or wider business recovery
            pressure.
          </p>
        </div>

        <div className="ui-split-2">
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Profile context</div>

              <div>
                <div className="ui-label">Staff</div>
                <div>{meta.staff_name || "Unnamed staff"}</div>
              </div>

              <div>
                <div className="ui-label">Role</div>
                <div>{meta.staff_role || "No role"}</div>
              </div>

              <div>
                <div className="ui-label">Class</div>
                <div>{meta.labour_class || "No class"}</div>
              </div>
            </div>
          </div>

          <div className="ui-stack-sm">
            <div className="ui-kicker">Headline outputs</div>

            {emphasis_rows.length > 0 ? (
              emphasis_rows.map((row, index) => (
                <div key={`${row.label}-${index}`} className="ui-panel">
                  <div className="ui-label">{row.label}</div>
                  <div className="ui-card-title-sm">{row.value}</div>
                </div>
              ))
            ) : (
              <p className="ui-help">No headline outputs available yet.</p>
            )}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Detailed breakdown</div>

            {standard_rows.length > 0 ? (
              <div className="ui-stack-sm">
                {standard_rows.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="ui-split">
                    <div className="ui-label">{row.label}</div>
                    <div>{row.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ui-help">No detailed rows available yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}