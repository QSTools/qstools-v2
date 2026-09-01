"use client";

import { useState } from "react";

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

function formatRate(value) {
  if (value === null || value === undefined) return "N/A";
  return `$${value.toFixed(2)}/hr`;
}

function formatPercent(value) {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(1)}%`;
}

function AssignmentDetail({ assignments }) {
  if (!assignments || assignments.length === 0) {
    return (
      <div style={{ paddingLeft: "1rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        No staff type assignment detail available for this group.
      </div>
    );
  }

  return (
    <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border-primary)" }}>
      <div className="business-outcome-pressure-row header" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", fontSize: "0.68rem" }}>
        <div style={{ paddingLeft: "1rem" }}>Staff Type</div>
        <div>Cost</div>
        <div>Rate</div>
        <div>Charged</div>
        <div>Profit/(Loss)</div>
      </div>
      {assignments.map((assignment, index) => {
        const hasCharge = assignment.charged !== null;
        const profitColor = !hasCharge ? "var(--text-muted)" : assignment.profitOrLoss >= 0 ? "var(--success)" : "var(--danger)";

        return (
          <div
            key={`${assignment.name}-${index}`}
            className="business-outcome-pressure-row"
            style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", fontSize: "0.78rem" }}
          >
            <div style={{ color: "var(--text-secondary)", paddingLeft: "1rem" }}>{assignment.name}</div>
            <div style={{ color: "var(--text-secondary)" }}>{formatCurrency(assignment.cost)}</div>
            <div style={{ color: "var(--text-secondary)" }}>
              {assignment.rate !== null ? formatRate(assignment.rate) : <span style={{ color: "var(--text-muted)" }}>No saved rate</span>}
            </div>
            <div style={{ color: "var(--text-secondary)" }}>{hasCharge ? formatCurrency(assignment.charged) : "-"}</div>
            <div style={{ color: profitColor, fontWeight: 600 }}>{hasCharge ? formatCurrency(assignment.profitOrLoss) : "-"}</div>
          </div>
        );
      })}
    </div>
  );
}

function GroupRow({ row, isExpanded, onToggle }) {
  const hasCharge = row.charged !== null;
  const profitColor = !hasCharge ? "var(--text-muted)" : row.isProfitable ? "var(--success)" : "var(--danger)";
  const isDrillable = row.assignments && row.assignments.length > 0;

  return (
    <div style={{ borderBottom: "1px solid var(--border-primary)", marginBottom: "0.5rem", paddingBottom: "0.25rem" }}>
      <div
        className="business-outcome-pressure-row"
        style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", cursor: isDrillable ? "pointer" : "default" }}
        onClick={isDrillable ? onToggle : undefined}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {isDrillable && (
            <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", width: "0.75rem", display: "inline-block" }}>
              {isExpanded ? "▾" : "▸"}
            </span>
          )}
          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.88rem" }}>{row.groupName}</div>
        </div>
        <div style={{ color: "var(--text-secondary)" }}>{formatCurrency(row.cost)}</div>
        <div style={{ color: "var(--text-secondary)" }}>
          {hasCharge ? formatCurrency(row.charged) : <span style={{ color: "var(--warning)", fontSize: "0.75rem" }}>{row.reason || "Not available"}</span>}
        </div>
        <div style={{ color: profitColor, fontWeight: 600 }}>{hasCharge ? formatCurrency(row.profitOrLoss) : "-"}</div>
        <div style={{ color: "var(--text-secondary)" }}>{hasCharge ? formatPercent(row.percentOfRevenue) : "-"}</div>
      </div>
      {isDrillable && isExpanded && <AssignmentDetail assignments={row.assignments} />}
    </div>
  );
}

function ReconciliationRow({ row }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "0.75rem",
        padding: row.isTotal ? "0.5rem 0 0.3rem" : "0.3rem 0",
        fontSize: "0.85rem",
        fontWeight: row.isTotal ? 700 : 400,
        borderTop: row.isTotal ? "1px solid var(--border-strong)" : "none",
        marginTop: row.isTotal ? "0.25rem" : 0,
      }}
    >
      <span style={{ color: row.isTotal ? "var(--text-primary)" : "var(--text-secondary)" }}>
        {row.label}
        {row.note && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>({row.note})</span>}
      </span>
      <span style={{ color: row.isTotal ? "var(--text-primary)" : "var(--text-secondary)" }}>{formatCurrency(row.cost)}</span>
      <span style={{ color: row.isTotal ? "var(--text-primary)" : "var(--text-secondary)" }}>
        {row.charged !== null ? formatCurrency(row.charged) : <span style={{ color: "var(--warning)", fontSize: "0.75rem", fontWeight: 400 }}>Pending</span>}
      </span>
    </div>
  );
}

export default function BusinessOutcomeLabourSplit({ outcome }) {
  const {
    labourSplitRows,
    labourSplitTotals,
    labourSplitAllPriced,
    labourChargeOutRateApplied,
    labourReconciliationRows,
    labourReconciles,
    labourChargedReconciles,
  } = outcome;

  const [expandedGroup, setExpandedGroup] = useState(null);

  if (!labourSplitRows || labourSplitRows.length === 0) {
    return (
      <div>
        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Which labour-carrying groups are actually profitable?
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          No Cost Allocation operating groups with labour assigned were found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Which labour-carrying groups are actually profitable?
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
          Labour-only groups shown here (no assets). Groups with both labour and assets appear under
          Assets, with their labour visible in that group&apos;s own breakdown. Click a group to see each
          staff type&apos;s own rate, charge, and profit within it.
        </div>
        {labourChargeOutRateApplied !== null && (
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Applying blended labour charge-out rate: {formatRate(labourChargeOutRateApplied)}
          </div>
        )}
      </div>

      <div className="business-outcome-pressure-row header" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", borderBottom: "2px solid var(--border-strong)", background: "var(--bg-card-muted)" }}>
        <div>Operating Group</div>
        <div>Labour Cost</div>
        <div>Labour Charged</div>
        <div>Profit/(Loss)</div>
        <div>% of Revenue</div>
      </div>

      {labourSplitRows.map((row) => (
        <GroupRow
          key={row.groupId}
          row={row}
          isExpanded={expandedGroup === row.groupId}
          onToggle={() => setExpandedGroup(expandedGroup === row.groupId ? null : row.groupId)}
        />
      ))}

      <div
        className="business-outcome-pressure-row"
        style={{
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
          borderTop: "2px solid var(--border-strong)",
          marginTop: "0.25rem",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        <div>Total{!labourSplitAllPriced ? " (priced groups only)" : ""}</div>
        <div>{formatCurrency(labourSplitTotals.cost)}</div>
        <div>{formatCurrency(labourSplitTotals.charged)}</div>
        <div style={{ color: labourSplitTotals.profitOrLoss >= 0 ? "var(--success)" : "var(--danger)" }}>
          {formatCurrency(labourSplitTotals.profitOrLoss)}
        </div>
        <div></div>
      </div>

      {!labourSplitAllPriced && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--warning)" }}>
          Totals exclude groups that could not be priced (missing rate data).
        </div>
      )}

      {labourReconciliationRows.length > 0 && (
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-primary)" }}>
          <div className="business-outcome-ledger-section-title" style={{ marginTop: 0 }}>
            Full Labour Reconciliation
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", paddingBottom: "0.25rem" }}>
            <div></div>
            <div>Cost</div>
            <div>Charged</div>
          </div>
          {labourReconciliationRows.map((row) => (
            <ReconciliationRow key={row.id} row={row} />
          ))}
          <div style={{ fontSize: "0.75rem", marginTop: "0.5rem", display: "grid", gap: "0.25rem" }}>
            <div>
              {labourReconciles ? (
                <span className="theme-success">✓ Cost matches the pressure map&apos;s total labour cost above.</span>
              ) : (
                <span className="theme-danger" style={{ fontWeight: 600 }}>⚠ Cost does not match the pressure map&apos;s total labour cost - see warnings.</span>
              )}
            </div>
            <div>
              {labourChargedReconciles === true && (
                <span className="theme-success">✓ Total Labour Charged matches Rate Builder&apos;s own Model Capacity figure above.</span>
              )}
              {labourChargedReconciles === false && (
                <span className="theme-danger" style={{ fontWeight: 600 }}>⚠ Total Labour Charged does not match Rate Builder&apos;s Model Capacity figure - see warnings.</span>
              )}
              {labourChargedReconciles === null && (
                <span style={{ color: "var(--text-muted)" }}>Total Labour Charged cross-check pending - not all groups are priced yet.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




