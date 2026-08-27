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

function WaterfallRow({ row }) {
  const isNegative = row.value < 0;
  const isPositive = row.value > 0;
  const valueClass = row.isTotal
    ? ""
    : isNegative
    ? "is-negative"
    : isPositive
    ? "is-positive"
    : "";

  return (
    <div
      className={`business-outcome-waterfall-row${row.isTotal ? " total" : ""}`}
      style={{ "--indent-level": row.indent }}
    >
      <div className="business-outcome-waterfall-row-label">{row.label}</div>
      <div className={`business-outcome-waterfall-row-value ${valueClass}`}>
        {formatCurrency(row.value)}
      </div>
    </div>
  );
}

function SplitGroupRow({ row }) {
  const status = row.charged === null ? null : row.isProfitable;
  const valueClass = status === null ? "" : status ? "is-positive" : "is-negative";

  return (
    <div className="business-outcome-waterfall-row" style={{ "--indent-level": 0 }}>
      <div className="business-outcome-waterfall-row-label">{row.groupName}</div>
      <div className={`business-outcome-waterfall-row-value ${valueClass}`}>
        {row.charged === null
          ? row.reason || "Not available"
          : formatCurrency(row.profitOrLoss)}
      </div>
    </div>
  );
}

export default function BusinessOutcomeWaterfallCard({ waterfall }) {
  const {
    waterfallAvailable,
    waterfallRows = [],
    reconciliation,
    labourSplitRows = [],
    assetSplitRows = [],
    warnings = [],
    utilisation_note,
  } = waterfall || {};

  if (!waterfallAvailable) {
    return (
      <div className="business-outcome-waterfall">
        <div className="business-outcome-waterfall-inner">
          <p className="ui-help">
            {reconciliation?.message ||
              "Net profit waterfall not available - Rate Builder labour data incomplete."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="business-outcome-waterfall">
      <div className="ui-kicker">Reconstructed P&amp;L</div>
      <h2 className="ui-section-title" style={{ marginTop: "0.25rem", marginBottom: "1rem" }}>
        Where does net profit actually come from?
      </h2>

      <div className="business-outcome-waterfall-inner">
        <div className="business-outcome-waterfall-grid">
          {waterfallRows.map((row) => (
            <WaterfallRow key={row.id} row={row} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <div className={`business-outcome-reconciliation-banner ${reconciliation.status}`}>
          {reconciliation.message}
        </div>
      </div>

      {(labourSplitRows.length > 0 || assetSplitRows.length > 0) && (
        <div style={{ marginTop: "1.25rem" }}>
          <div className="ui-kicker" style={{ marginBottom: "0.5rem" }}>
            By operating group
          </div>
          <div className="business-outcome-waterfall-grid">
            {labourSplitRows.map((row) => (
              <SplitGroupRow key={row.groupId} row={row} />
            ))}
            {assetSplitRows.map((row) => (
              <SplitGroupRow key={row.groupId} row={row} />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        <div className="business-outcome-utilisation-note">{utilisation_note}</div>
      </div>

      {warnings.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div className="ui-kicker" style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>
            Warnings ({warnings.length})
          </div>
          <div className="ui-stack-sm">
            {warnings.map((warning) => (
              <div key={warning.id} className="ui-help-guardrail">
                {warning.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
