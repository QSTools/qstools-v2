"use client";

import { useState } from "react";

function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function SummaryRow({ label, value, isTotal = false }) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4",
        isTotal
          ? "border-t border-[var(--border-primary)] pt-4 font-semibold text-[var(--text-primary)]"
          : "text-[var(--text-primary)]",
      ].join(" ")}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MetricCard({ label, value, toneClass = "text-[var(--text-primary)]" }) {
  return (
    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}

function DrilldownMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-3">
      <div className="text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

export default function CostSummaryCard({
  recovery_model_label,
  linked_staff_count,
  linked_asset_count,
  recovery_warnings = [],

  people_cost_total,
  gross_wages_total = 0,
  entitlements_total = 0,
  esct_total = 0,
  employee_overheads_total = 0,
  people_rows = [],

  business_cost_total,
  asset_cost_total,
  general_overheads_total,

  total_cost_burden,
  required_revenue,
  required_recovery_rate,
  highlight_insight,
}) {
  const [peopleCostOpen, setPeopleCostOpen] = useState(true);
  const [staffDrilldownOpen, setStaffDrilldownOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-5">
      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
        Cost Summary
      </h2>
      <p className="ui-help">
        Internal cost burden and required recovery view.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[2.2fr_1fr]">
        <div className="ui-panel">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Recovery Model Block
          </h3>
          <p className="ui-help">
            Active structural recovery settings from Cost Allocation.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
              <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Recovery Model
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--success)]">
                {recovery_model_label}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
              <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Linked Staff
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {linked_staff_count}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
              <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                Linked Assets
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {linked_asset_count}
              </div>
            </div>
          </div>
        </div>

        <div className="ui-section-muted">
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Current Warnings
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {recovery_warnings.length > 0 ? (
              recovery_warnings.map((warning) => (
                <div key={warning} className="text-[var(--warning)]">
                  {warning}
                </div>
              ))
            ) : (
              <div className="text-[var(--success)]">No active warnings</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
        <button
          type="button"
          onClick={() => setPeopleCostOpen((prev) => !prev)}
          className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              People Cost
            </h3>
            <p className="ui-help">
              Gross Wages + Entitlements + ESCT + Employee Overheads
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 sm:text-right">
            <div className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              {formatMoney(people_cost_total)}
              <span className="ml-1 text-base font-normal text-[var(--text-muted)]">
                / year
              </span>
            </div>
            <span className="text-[var(--text-muted)]">
              {peopleCostOpen ? "−" : "+"}
            </span>
          </div>
        </button>

        {peopleCostOpen && (
          <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
            <div className="space-y-4 text-base">
              <SummaryRow label="Gross Wages" value={formatMoney(gross_wages_total)} />
              <SummaryRow label="Entitlements" value={formatMoney(entitlements_total)} />
              <SummaryRow label="ESCT" value={formatMoney(esct_total)} />
              <SummaryRow
                label="Employee Overheads"
                value={formatMoney(employee_overheads_total)}
              />
              <SummaryRow
                label="Total People Cost"
                value={formatMoney(people_cost_total)}
                isTotal
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
              <button
                type="button"
                onClick={() => setStaffDrilldownOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--text-secondary)]">
                    Staff Drilldown
                  </div>
                  <div className="ui-help">
                    View staff-level people cost build-up
                  </div>
                </div>

                <span className="text-[var(--text-muted)]">
                  {staffDrilldownOpen ? "−" : "+"}
                </span>
              </button>

              {staffDrilldownOpen && (
                <div className="mt-4 space-y-3">
                  {people_rows.length > 0 ? (
                    people_rows.map((row) => (
                      <div
                        key={row.staff_id ?? row.staff_name}
                        className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">
                              {row.staff_name}
                            </div>
                            <div className="text-sm text-[var(--text-muted)]">
                              {[row.staff_role, row.labour_class]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <div className="font-semibold text-[var(--text-primary)]">
                              {formatMoney(row.total_people_cost)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                          <DrilldownMetric
                            label="Gross Wages"
                            value={formatMoney(row.gross_wages_total)}
                          />
                          <DrilldownMetric
                            label="Entitlements"
                            value={formatMoney(row.entitlement_cost_total)}
                          />
                          <DrilldownMetric
                            label="ESCT"
                            value={formatMoney(row.esct_total)}
                          />
                          <DrilldownMetric
                            label="Employee Overheads"
                            value={formatMoney(row.employee_overheads_total)}
                          />
                          <DrilldownMetric
                            label="Productive Hours"
                            value={Number(row.productive_hours || 0).toLocaleString()}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4 text-[var(--text-muted)]">
                      No staff cost records available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Business Cost
        </h3>
        <p className="ui-help">
          Assets + General Overheads
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4 space-y-4">
          <SummaryRow label="Assets" value={formatMoney(asset_cost_total)} />
          <SummaryRow
            label="General Overheads"
            value={formatMoney(general_overheads_total)}
          />
          <SummaryRow
            label="Total Business Cost"
            value={formatMoney(business_cost_total)}
            isTotal
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Total Cost & Recovery
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard
            label="Total Cost Burden"
            value={formatMoney(total_cost_burden)}
          />
          <MetricCard
            label="Required Revenue"
            value={formatMoney(required_revenue)}
          />
          <MetricCard
            label="Required Recovery Rate"
            value={formatMoney(required_recovery_rate)}
          />
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4 text-sm text-[var(--success)]">
          {highlight_insight}
        </div>
      </div>
    </section>
  );
}