"use client";

function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(abs)}`;
}

export default function BusinessOutcomeTruthRevenueSplitCard({ revenue_split }) {
  const { is_ready, is_over_committed, total_revenue, segments = [] } = revenue_split || {};

  if (!is_ready) {
    return (
      <div className="business-outcome-revenue-split">
        <div className="business-outcome-revenue-split-eyebrow">Where every revenue dollar goes</div>
        <p className="ui-help">Not enough confirmed revenue data yet to show the split.</p>
      </div>
    );
  }

  // FIX (Section 5.3): a single committed cost segment (labour, assets,
  // overheads, or COG) can legitimately exceed total_revenue on its
  // own - real cost is real regardless of how little the business is
  // currently billing. When that happens this bar's percentages become
  // mathematically impossible (a segment >100%, net profit far past
  // -100%), even though the underlying dollar figures are correct and
  // still reconcile exactly. A stacked bar's whole visual grammar
  // promises "these segments sum to the whole" - rendering that
  // promise falsely is worse than not showing a bar at all, so this
  // replaces the bar with the real figures as plain text instead.
  if (is_over_committed) {
    return (
      <div className="business-outcome-revenue-split">
        <div>
          <div className="business-outcome-revenue-split-eyebrow">Where every revenue dollar goes</div>
          <div className="business-outcome-revenue-split-total">
            {formatCurrency(total_revenue)} total revenue
          </div>
        </div>

        <div className="business-outcome-capacity-warning">
          <strong>Committed costs exceed total revenue this period</strong>
          <div>
            One or more cost categories below are larger than total revenue on their own, so the
            usual percentage breakdown can&apos;t be shown accurately as a bar. The real figures are
            listed below instead.
          </div>
        </div>

        <div className="business-outcome-revenue-split-legend">
          {segments.map((segment) => (
            <div className="business-outcome-revenue-split-legend-item" key={segment.key}>
              <span className={`business-outcome-revenue-split-dot ${segment.key}`} />
              <span>
                {segment.label}{" "}
                <span className="business-outcome-revenue-split-legend-value">
                  ({formatCurrency(segment.value)})
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="business-outcome-revenue-split">
      <div>
        <div className="business-outcome-revenue-split-eyebrow">Where every revenue dollar goes</div>
        <div className="business-outcome-revenue-split-total">
          {formatCurrency(total_revenue)} total revenue
        </div>
      </div>

      <div className="business-outcome-revenue-split-bar">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={`business-outcome-revenue-split-segment ${segment.key}`}
            style={{ "--segment-grow": Math.max(segment.percent, 0) }}
            title={`${segment.label} ${segment.percent}%`}
          />
        ))}
      </div>

      <div className="business-outcome-revenue-split-legend">
        {segments.map((segment) => (
          <div className="business-outcome-revenue-split-legend-item" key={segment.key}>
            <span className={`business-outcome-revenue-split-dot ${segment.key}`} />
            <span>
              {segment.label} {segment.percent}%{" "}
              <span className="business-outcome-revenue-split-legend-value">
                ({formatCurrency(segment.value)})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
