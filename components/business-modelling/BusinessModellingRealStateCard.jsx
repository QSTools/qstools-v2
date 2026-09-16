"use client";

// Section A of the Business Modelling rebuild (2026-09-16) - "where the
// business actually is right now," matching Business Outcome exactly.
// Deliberately NOT editable, NOT a lever exercise - see
// BUSINESS_MODELLING_COMPLETE_REBUILD_SCOPING_BRIEF_2026-09-16.txt for
// the full rationale. Reads per_source.headline_real_capacity directly -
// View A, "How the Business Runs" - the same real, cascade-adjusted
// figure Business Outcome's own CrossCheck confirms matches real P&L
// cost to the cent. No new calculation - pure reuse, per S05's original
// "must not recalculate source modules" principle.

function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}$${Math.abs(rounded).toLocaleString()}`;
}

export default function BusinessModellingRealStateCard({ per_source }) {
  const real = per_source?.headline_real_capacity;

  if (!per_source?.available || !real) {
    return (
      <div className="ui-panel">
        <div className="ui-help">
          Business Outcome data isn't ready yet - set up Cost Allocation and Rate Builder first,
          then this card will show the real, current state of your business here.
        </div>
      </div>
    );
  }

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Where the business actually is</div>
        <div className="business-outcome-headline-text">
          Right now, your business is making{" "}
          <span className={real.total_net_profit >= 0 ? "value-good" : "value-bad"}>
            {formatCurrency(real.total_net_profit)}
          </span>{" "}
          in net profit.
          {real.all_good ? (
            <> Every part is pulling its weight.</>
          ) : (
            <>
              {" "}
              <span className="value-bad">
                {real.being_carried_count} of {real.total_group_count}
              </span>{" "}
              {real.being_carried_count === 1 ? "source is" : "sources are"} currently being
              carried by the rest of the business.
            </>
          )}
        </div>
        <p className="ui-help">
          This is the real, reconciled figure - it matches Business Outcome exactly, including
          any cross-subsidy between sources. Use the section below to see what happens if each
          source had to stand entirely on its own.
        </p>

        <div className="ui-stack-sm" style={{ marginTop: "0.5rem" }}>
          {(real.all_sources || []).map((source) => (
            <div key={source.key} className="ui-row-between">
              <span className="theme-text-secondary">{source.name}</span>
              <span className={source.net_profit >= 0 ? "value-good" : "value-bad"}>
                {formatCurrency(source.net_profit)}
              </span>
            </div>
          ))}
          {per_source?.unassigned?.total > 0 && (
            <div className="ui-row-between">
              <span className="theme-text-secondary">Unassigned cost (not attributed to any source)</span>
              <span className="value-bad">{formatCurrency(-per_source.unassigned.total)}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}