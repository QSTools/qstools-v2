"use client";

// R3 slice 4 batch C3b (Business Modelling brief, Addendum 31). The scenario-cost line on the Cost Allocation page, shown in Model mode ONLY and only when the
// scenario holds something (renders nothing otherwise, so baseline mode is untouched). It shows two things, both labelled as coming from the scenario:
//   1. the total of the NON-productive adds that is carried in overhead (the same sum General Overheads receives, batch C2a), shared by recovery hours;
//   2. the PRODUCTIVE adds with the working group each one is placed in.
// It calculates nothing and writes nothing. Existing ui-system classes only (no inline colours).

import useScenarioCostSummary from "@/hooks/useScenarioCostSummary";

function money(value) {
  return "$" + Number(value || 0).toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ScenarioCostLine() {
  const { active, summary } = useScenarioCostSummary();

  if (!active || !summary.has_any) return null;

  const count = summary.non_productive_count;

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-row-between">
            <div>
              <div className="ui-kicker">Scenario</div>
              <h3 className="ui-card-title">Cost added by your scenario</h3>
            </div>
            <span className="ui-pill ui-pill-warning">From scenario</span>
          </div>

          {count > 0 ? (
            <div className="ui-stack-sm">
              <div className="ui-label">
                Non-productive cost carried in overhead: {money(summary.non_productive_total)} a year
              </div>
              <p className="ui-help">
                From {count} non-productive {count === 1 ? "item" : "items"} you added in the scenario. It is shared across all working groups by their recovery
                hours, not placed in one group. It is not in your real data.
              </p>
            </div>
          ) : null}

          {summary.productive_items.length > 0 ? (
            <div className="ui-stack-sm">
              <div className="ui-label">Productive items placed in a working group</div>
              {summary.productive_items.map((item) => (
                <div key={item.id} className="ui-row-between">
                  <div className="ui-label">{item.name}</div>
                  <div className="ui-help">{item.description}</div>
                </div>
              ))}
              <p className="ui-help">These are added in the scenario only. Each is costed in the working group shown.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
