"use client";

import { useState } from "react";

import { get_warning_detail } from "@/components/recovery-summary/recoverySummaryWarningDetails";

function ValueRow({ label, value, emphasis = false }) {
  return (
    <div
      className={`recovery-summary-row ${
        emphasis ? "recovery-summary-row-total" : ""
      }`}
    >
      <div className="recovery-summary-row-label">{label}</div>
      <div className="recovery-summary-row-value">{value}</div>
    </div>
  );
}

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
            These notes explain the recovery pressure being carried forward.
            Use Business Summary Macro Position to audit the source values.
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
                    <p className="ui-label">Where to audit it</p>

                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {selected_detail.source}
                    </p>
                  </div>

                  {selected_detail.actual_maths.length > 0 ? (
                    <div className="ui-panel">
                      <div className="ui-stack-sm">
                        <p className="ui-kicker">
                          {selected_detail.calculation_title}
                        </p>

                        {selected_detail.actual_maths.map((row) => (
                          <ValueRow
                            key={row.label}
                            label={row.label}
                            value={row.value}
                            emphasis={row.emphasis}
                          />
                        ))}

                        {selected_detail.formula ? (
                          <p className="ui-help">
                            {selected_detail.formula}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="ui-readonly">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        No recovery value summary is available for this note
                        yet.
                      </p>
                    </div>
                  )}

                  <div className="ui-readonly">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Recovery Summary carries this recovery pressure forward.
                      Use Cost Allocation next to test whether the structure can
                      support it.
                    </p>
                  </div>
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