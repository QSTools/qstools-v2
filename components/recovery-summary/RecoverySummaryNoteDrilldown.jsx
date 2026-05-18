"use client";

import { useState } from "react";

import RecoverySummaryCalculationTable from "@/components/recovery-summary/RecoverySummaryCalculationTable";
import { get_warning_detail } from "@/components/recovery-summary/recoverySummaryWarningDetails";

export default function RecoverySummaryNoteDrilldown({
  warning_count,
  warning_items = [],
  values = {},
}) {
  const [active_warning_key, set_active_warning_key] = useState(
    warning_items[0]?.warning_key ?? null
  );

  const selected_warning =
    warning_items.find(
      (warning) => warning.warning_key === active_warning_key
    ) || warning_items[0];

  const selected_detail = selected_warning
    ? get_warning_detail(selected_warning.warning_key, values)
    : null;

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-label">Model notes</p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {warning_count} active note{warning_count === 1 ? "" : "s"}
          </h3>

          <p className="ui-help">
            Click a note to see what it means, where it came from, and the
            actual values behind it.
          </p>
        </div>

        {warning_items.length > 0 ? (
          <div className="ui-split-2">
            <div className="ui-stack-sm">
              {warning_items.map((warning) => (
                <button
                  key={warning.warning_key}
                  type="button"
                  onClick={() => set_active_warning_key(warning.warning_key)}
                  className={`recovery-summary-interactive recovery-summary-note-button ${
                    active_warning_key === warning.warning_key
                      ? "is-active"
                      : ""
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {warning.label}
                  </p>
                </button>
              ))}
            </div>

            {selected_detail ? (
              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div>
                    <p className="ui-label">Selected note</p>

                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      {selected_detail.title}
                    </h4>
                  </div>

                  <div className="ui-readonly">
                    <p className="ui-label">What it means</p>

                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {selected_detail.meaning}
                    </p>
                  </div>

                  <div className="ui-readonly">
                    <p className="ui-label">Where it came from</p>

                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {selected_detail.source}
                    </p>
                  </div>

                  {selected_detail.actual_maths.length > 0 ? (
                    <RecoverySummaryCalculationTable
                      title={selected_detail.calculation_title}
                      rows={selected_detail.actual_maths}
                      formula={selected_detail.formula}
                      values={values}
                    />
                  ) : (
                    <div className="ui-readonly">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        No value breakdown is available for this note yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No active recovery notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}