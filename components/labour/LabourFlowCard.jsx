"use client";

import { useState } from "react";

export default function LabourFlowCard({ outputs, state, has_profile }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!has_profile) {
    return (
      <section className="ui-section">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <h2 className="text-lg font-semibold">Charge-Out Build</h2>
              <p className="ui-help">
                Build your charge-out rate from true annual labour cost and productive hours
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="ui-button-secondary"
              >
                {isOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {isOpen ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-6 text-sm text-[var(--text-muted)]">
              Create or load a labour profile to see the charge-out build flow.
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const margin_status =
    outputs.margin_gap > 0
      ? "good"
      : outputs.margin_gap === 0
        ? "neutral"
        : "bad";

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-split">
          <div>
            <h2 className="text-lg font-semibold">Charge-Out Build</h2>
            <p className="ui-help">
              Build your charge-out rate from true annual labour cost and productive hours
            </p>
          </div>

          <div className="ui-actions">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="ui-button-secondary"
            >
              {isOpen ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="ui-stack">
            <Block title="1. Available Hours">
              <Row label="Paid Hours" value={fmt(outputs.paid_hours_per_year)} />
              <Row label="Entitlements" value={fmt(outputs.non_productive_paid_hours)} />
              <Row
                label="After Entitlements"
                value={fmt(outputs.paid_hours_per_year - outputs.non_productive_paid_hours)}
              />
              <Row label="Productivity %" value={fmtPct(state.productivity_percent)} />
              <Result label="Productive Hours" value={fmt(outputs.productive_hours)} />
            </Block>

            <Block title="2. Annual Cost">
              <Row label="Base Wages" value={fmtCur(outputs.base_labour_cost_annual)} />
              <Row
                label="Employer Costs"
                value={fmtCur(outputs.total_employer_contribution_cost)}
              />
              <Result label="True Labour Cost" value={fmtCur(outputs.total_labour_cost_annual)} />
            </Block>

            <Block title="3. Cost per Productive Hour">
              <Row label="Total Cost" value={fmtCur(outputs.total_labour_cost_annual)} />
              <Row label="Productive Hours" value={fmt(outputs.productive_hours)} />
              <Result
                label="True Cost per Hour"
                value={fmtCur(outputs.productive_labour_cost_rate)}
              />
            </Block>

            <Block title="4. Required Charge-Out Rate">
              <Row
                label="True Cost per Hour"
                value={fmtCur(outputs.productive_labour_cost_rate)}
              />
              <Row label="Target Margin" value={fmtPct(state.margin_target_percent)} />
              <Result
                label="Minimum Charge-Out Rate"
                value={fmtCur(outputs.minimum_charge_out_rate)}
              />

              <div className="mt-3 rounded-xl border border-[var(--success)] bg-[var(--success-soft)] px-4 py-3">
                <div className="text-sm text-[var(--success)]">Recommended Charge-Out</div>
                <div className="text-xl font-semibold text-[var(--text-primary)]">
                  {fmtCur(outputs.minimum_charge_out_rate)}
                </div>
              </div>

              <MarginIndicator status={margin_status} gap={outputs.margin_gap} />
            </Block>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MarginIndicator({ status, gap }) {
  const styles = {
    good: "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]",
    neutral: "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)]",
    bad: "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]",
  };

  const text =
    status === "good"
      ? "Above target margin"
      : status === "neutral"
        ? "At target margin"
        : "Below target margin";

  return (
    <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${styles[status]}`}>
      {text} ({fmtCur(gap)})
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
      <div className="mb-3 text-sm font-medium text-[var(--text-muted)]">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Result({ label, value }) {
  return (
    <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 text-sm font-semibold text-[var(--text-primary)]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function fmt(v) {
  return Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtCur(v) {
  return Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(v) {
  return `${Number(v || 0).toFixed(2)}%`;
}