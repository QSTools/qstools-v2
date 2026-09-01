"use client";

import { useState } from "react";
import BusinessOutcomeLabourSplit from "@/components/business-outcome/BusinessOutcomeLabourSplit";
import BusinessOutcomeAssetSplit from "@/components/business-outcome/BusinessOutcomeAssetSplit";

function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(value);
}

function PressureRow({ row, isDrillable, isExpanded, onToggle }) {
  const statusColor =
    row.status === "pressure" || row.status === "unrecovered" || row.status === "asset_recovery_pressure"
      ? "var(--warning)"
      : "var(--success)";

  return (
    <div
      className={`business-outcome-pressure-row ${isDrillable ? "drillable" : ""}`}
      onClick={isDrillable ? onToggle : undefined}
    >
      <div style={{ color: "var(--text-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {isDrillable && (
          <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", width: "0.75rem", display: "inline-block" }}>
            {isExpanded ? "▾" : "▸"}
          </span>
        )}
        {row.stream}
      </div>
      <div style={{ color: "var(--text-secondary)" }}>{formatCurrency(row.cost)}</div>
      <div style={{ color: "var(--text-secondary)" }}>
        {row.modelCapacity !== null ? formatCurrency(row.modelCapacity) : "Not available"}
        {row.modelCapacityNote && (
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{row.modelCapacityNote}</div>
        )}
      </div>
      <div style={{ color: "var(--text-secondary)" }}>
        {row.gap !== null ? (
          <>
            {formatCurrency(row.gap)}
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {row.gap < 0 ? `${formatCurrency(Math.abs(row.gap))} of headroom` : row.gap > 0 ? "over capacity" : "exactly on target"}
            </div>
          </>
        ) : (
          "-"
        )}
      </div>
      <div style={{ color: statusColor, fontWeight: 600 }}>{row.flag}</div>
    </div>
  );
}

export default function BusinessOutcomeMainCard({ outcome }) {
  const { pressureRows, primaryPressureSource, structureConfidence } = outcome;
  const [expandedStream, setExpandedStream] = useState(null);

  const pressureSourceLabel =
    {
      labour: "Labour",
      overhead: "Overheads",
      asset: "Assets",
      combined_labour_overhead: "Labour & Overheads (combined)",
    }[primaryPressureSource] || "None identified";

  const drillableStreams = ["Labour", "Assets"];

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Where is the pressure?</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
        {pressureSourceLabel}
      </div>

      <div className="business-outcome-ledger-table">
        <div className="business-outcome-pressure-row header">
          <div>Stream</div>
          <div>Cost</div>
          <div>Model Capacity / Target</div>
          <div>Gap (Cost vs Capacity)</div>
          <div>Status</div>
        </div>
        {pressureRows.map((row) => {
          const isDrillable = drillableStreams.includes(row.stream);
          const isExpanded = expandedStream === row.stream;

          return (
            <div key={row.stream}>
              <PressureRow
                row={row}
                isDrillable={isDrillable}
                isExpanded={isExpanded}
                onToggle={() => setExpandedStream(isExpanded ? null : row.stream)}
              />
              {isDrillable && isExpanded && (
                <div className="business-outcome-pressure-drill">
                  {row.stream === "Labour" && <BusinessOutcomeLabourSplit outcome={outcome} />}
                  {row.stream === "Assets" && <BusinessOutcomeAssetSplit outcome={outcome} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <div className="business-outcome-ledger-section-title" style={{ marginTop: 0 }}>
          Structure Confidence
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{structureConfidence.note}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.25rem" }}>
          Labour coverage: {structureConfidence.staffCoveragePercent}% · Asset coverage:{" "}
          {structureConfidence.assetCoveragePercent}%
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border-primary)",
          color: "var(--text-muted)",
          fontSize: "0.78rem",
          fontStyle: "italic",
        }}
      >
        {outcome.business_outcome_note}
      </div>
    </div>
  );
}
