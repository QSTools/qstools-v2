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

function get_warning_title(warning) {
  return warning?.headline || warning?.message || "Recovery issue";
}

function get_warning_meaning(warning) {
  return (
    warning?.plain_english ||
    warning?.effect ||
    warning?.message ||
    "Recovery Summary has identified pressure that needs review."
  );
}

function get_warning_source(warning) {
  return (
    warning?.audit_location ||
    warning?.module ||
    "Recovery Summary"
  );
}

function get_warning_cascade(warning) {
  return warning?.cascade_effect || "";
}

function get_warning_carry_forward(warning) {
  return warning?.carry_forward_message || "";
}

function get_warning_id(warning, index) {
  return warning?.warning_id || warning?.warning_key || `warning-${index}`;
}

function LegacyWarningDetail({ selected_detail }) {
  if (!selected_detail) {
    return (
      <div className="ui-readonly">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          No recovery value summary is available for this note yet.
        </p>
      </div>
    );
  }

  return (
    <>
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
            <p className="ui-kicker">{selected_detail.calculation_title}</p>

            {selected_detail.actual_maths.map((row) => (
              <ValueRow
                key={row.label}
                label={row.label}
                value={row.value}
                emphasis={row.emphasis}
              />
            ))}

            {selected_detail.formula ? (
              <p className="ui-help">{selected_detail.formula}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="ui-readonly">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            No recovery value summary is available for this note yet.
          </p>
        </div>
      )}
    </>
  );
}

export default function RecoverySummaryNoteDrilldown({
  warning_count,
  warning_items = [],
  values = {},
  primary_recovery_warning = null,
  recovery_failure_path = [],
}) {
  const has_failure_path =
    Array.isArray(recovery_failure_path) && recovery_failure_path.length > 0;

  const failure_rows = has_failure_path ? recovery_failure_path : [];

  const initial_failure_id = has_failure_path
    ? get_warning_id(failure_rows[0], 0)
    : null;

  const [active_failure_id, set_active_failure_id] = useState(
    initial_failure_id
  );

  const [active_warning_key, set_active_warning_key] = useState(
    warning_items[0]?.warning_key ?? null
  );

  const selected_failure =
    failure_rows.find(
      (warning, index) => get_warning_id(warning, index) === active_failure_id
    ) || failure_rows[0];

  const selected_warning =
    warning_items.find(
      (warning) => warning.warning_key === active_warning_key
    ) || warning_items[0];

  const selected_detail = selected_warning
    ? get_warning_detail(selected_warning.warning_key, values)
    : null;

  if (has_failure_path) {
    return (
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-label">Recovery failure path</p>

            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {failure_rows.length} recovery step
              {failure_rows.length === 1 ? "" : "s"} tested
            </h3>

            <p className="ui-help">
              Recovery Summary shows the first failure first, then the
              consequences that flow from it. This prevents separate warnings
              from looking equally important.
            </p>
          </div>

          <div className="ui-split-2">
            <div className="ui-stack-sm">
              {failure_rows.map((warning, index) => {
                const warning_id = get_warning_id(warning, index);
                const is_primary =
                  primary_recovery_warning?.warning_id === warning.warning_id ||
                  index === 0;

                return (
                  <button
                    key={warning_id}
                    type="button"
                    onClick={() => set_active_failure_id(warning_id)}
                    className={`recovery-summary-interactive recovery-summary-note-button ${
                      active_failure_id === warning_id ? "is-active" : ""
                    }`}
                  >
                    <p className="ui-label">
                      {is_primary ? "Primary failure" : `Step ${index + 1}`}
                    </p>

                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {get_warning_title(warning)}
                    </p>
                  </button>
                );
              })}
            </div>

            {selected_failure ? (
              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div>
                    <p className="ui-label">
                      {selected_failure.warning_id ===
                      primary_recovery_warning?.warning_id
                        ? "Primary failure"
                        : "Selected recovery step"}
                    </p>

                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      {get_warning_title(selected_failure)}
                    </h4>
                  </div>

                  <div className="ui-readonly">
                    <p className="ui-label">What it means</p>

                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {get_warning_meaning(selected_failure)}
                    </p>
                  </div>

                  {selected_failure.cause ? (
                    <div className="ui-readonly">
                      <p className="ui-label">Cause</p>

                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {selected_failure.cause}
                      </p>
                    </div>
                  ) : null}

                  {selected_failure.effect ? (
                    <div className="ui-readonly">
                      <p className="ui-label">Effect</p>

                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {selected_failure.effect}
                      </p>
                    </div>
                  ) : null}

                  {get_warning_cascade(selected_failure) ? (
                    <div className="ui-readonly">
                      <p className="ui-label">Cascading effect</p>

                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {get_warning_cascade(selected_failure)}
                      </p>
                    </div>
                  ) : null}

                  <div className="ui-readonly">
                    <p className="ui-label">Where to audit it</p>

                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {get_warning_source(selected_failure)}
                    </p>
                  </div>

                  {get_warning_carry_forward(selected_failure) ? (
                    <div className="ui-readonly">
                      <p className="ui-label">Carry-forward message</p>

                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {get_warning_carry_forward(selected_failure)}
                      </p>
                    </div>
                  ) : (
                    <div className="ui-readonly">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Recovery Summary carries this pressure forward. Use Cost
                        Allocation next to test whether the structure can
                        support it.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

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

            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div>
                  <p className="ui-label">Selected note</p>

                  <h4 className="text-base font-semibold text-[var(--text-primary)]">
                    {selected_detail?.title ?? "Recovery note"}
                  </h4>
                </div>

                <LegacyWarningDetail selected_detail={selected_detail} />

                <div className="ui-readonly">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Recovery Summary carries this recovery pressure forward. Use
                    Cost Allocation next to test whether the structure can
                    support it.
                  </p>
                </div>
              </div>
            </div>
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