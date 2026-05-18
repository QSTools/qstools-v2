"use client";

import { useState } from "react";

import RecoverySummarySourceBreakdown from "@/components/recovery-summary/RecoverySummarySourceBreakdown";

function CalculationRow({ row, active, onClick, values }) {
  const is_clickable = Boolean(row.drilldown_key);

  return (
    <div className="ui-stack-sm">
      {is_clickable ? (
        <button
          type="button"
          onClick={() => onClick(active ? null : row.drilldown_key)}
          className={`recovery-summary-interactive recovery-summary-row ${
            row.emphasis ? "recovery-summary-row-total" : ""
          } ${active ? "is-active" : ""}`}
        >
          <div className="recovery-summary-row-label">{row.label}</div>
          <div className="recovery-summary-row-value">{row.value}</div>
        </button>
      ) : (
        <div
          className={`recovery-summary-row ${
            row.emphasis ? "recovery-summary-row-total" : ""
          }`}
        >
          <div className="recovery-summary-row-label">{row.label}</div>
          <div className="recovery-summary-row-value">{row.value}</div>
        </div>
      )}

      {active ? (
        <RecoverySummarySourceBreakdown
          active_breakdown={row.drilldown_key}
          values={values}
        />
      ) : null}
    </div>
  );
}

export default function RecoverySummaryCalculationTable({
  title,
  rows = [],
  formula,
  values,
}) {
  const [active_breakdown, set_active_breakdown] = useState(null);

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <p className="ui-kicker">{title}</p>

        <div className="ui-stack-sm">
          {rows.map((row) => (
            <CalculationRow
              key={row.label}
              row={row}
              active={active_breakdown === row.drilldown_key}
              onClick={set_active_breakdown}
              values={values}
            />
          ))}
        </div>

        {formula ? <p className="ui-help">{formula}</p> : null}
      </div>
    </div>
  );
}