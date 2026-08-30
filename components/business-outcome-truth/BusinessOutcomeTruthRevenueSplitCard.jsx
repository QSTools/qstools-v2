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
  const { is_ready, total_revenue, segments = [] } = revenue_split || {};

  if (!is_ready) {
    return (
      <div className="business-outcome-revenue-split">
        <div className="business-outcome-revenue-split-eyebrow">Where every revenue dollar goes</div>
        <p className="ui-help">Not enough confirmed revenue data yet to show the split.</p>
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
