"use client";

import { useState } from "react";

import BusinessSummarySourceBreakdown from "@/components/business-summary/BusinessSummarySourceBreakdown";

function CalculationRow({ row, active, onClick, values }) {
  const is_clickable = Boolean(row.drilldown_key);

  return (
    <div className="ui-stack-sm">
      {is_clickable ? (
        <button
          type="button"
          onClick={() => onClick(active ? null : row.drilldown_key)}
          className={`business-summary-macro-row ${
            row.emphasis ? "total" : ""
          } ${active ? "is-active" : ""}`}
        >
          <div className="business-summary-macro-row-label">
            <div className="business-summary-macro-row-title">
              {row.label}
            </div>
          </div>

          <div className="business-summary-macro-row-value">
            {row.value}
          </div>
        </button>
      ) : (
        <div
          className={`business-summary-macro-row ${
            row.emphasis ? "total" : ""
          }`}
        >
          <div className="business-summary-macro-row-label">
            <div className="business-summary-macro-row-title">
              {row.label}
            </div>
          </div>

          <div className="business-summary-macro-row-value">
            {row.value}
          </div>
        </div>
      )}

      {active ? (
        <BusinessSummarySourceBreakdown
          active_breakdown={row.drilldown_key}
          values={values}
        />
      ) : null}
    </div>
  );
}

export default function BusinessSummaryCalculationTable({
  title,
  rows = [],
  formula,
  values,
  active_breakdown,
  on_active_breakdown_change,
}) {
  const [local_active_breakdown, set_local_active_breakdown] = useState(null);

  const controlled = typeof on_active_breakdown_change === "function";
  const current_active = controlled ? active_breakdown : local_active_breakdown;
  const set_current_active = controlled
    ? on_active_breakdown_change
    : set_local_active_breakdown;

  return (
    <div className="ui-stack-sm">
      <p className="business-summary-macro-section-title">{title}</p>

      <div className="ui-stack-sm">
        {rows.map((row) => (
          <CalculationRow
            key={row.label}
            row={row}
            active={current_active === row.drilldown_key}
            onClick={set_current_active}
            values={values}
          />
        ))}
      </div>

      {formula ? <p className="ui-help">{formula}</p> : null}
    </div>
  );
}