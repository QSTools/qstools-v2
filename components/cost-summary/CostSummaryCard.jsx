"use client";

import { useState } from "react";

function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
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
      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Cost Summary</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Internal cost burden and required recovery view.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[2.2fr_1fr]">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recovery Model Block</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
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

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
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
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">People Cost</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Gross Wages + Entitlements + ESCT + Employee Overheads
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {formatMoney(people_cost_total)}
              <span className="ml-1 text-base font-normal text-[var(--text-muted)]">/ year</span>
            </div>
            <span className="pt-1 text-[var(--text-muted)]">
              {peopleCostOpen ? "−" : "+"}
            </span>
          </div>
        </button>

        {peopleCostOpen && (
          <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
            <div className="space-y-4 text-base">
              <div className="flex items-center justify-between text-[var(--text-primary)]">
                <span>Gross Wages</span>
                <span>{formatMoney(gross_wages_total)}</span>
              </div>

              <div className="flex items-center justify-between text-[var(--text-primary)]">
                <span>Entitlements</span>
                <span>{formatMoney(entitlements_total)}</span>
              </div>

              <div className="flex items-center justify-between text-[var(--text-primary)]">
                <span>ESCT</span>
                <span>{formatMoney(esct_total)}</span>
              </div>

              <div className="flex items-center justify-between text-[var(--text-primary)]">
                <span>Employee Overheads</span>
                <span>{formatMoney(employee_overheads_total)}</span>
              </div>

              <div className="border-t border-[var(--border-primary)] pt-4 flex items-center justify-between font-semibold text-[var(--text-primary)]">
                <span>Total People Cost</span>
                <span>{formatMoney(people_cost_total)}</span>
              </div>
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
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
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
                        <div className="flex items-start justify-between gap-4">
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

                          <div className="text-right">
                            <div className="font-semibold text-[var(--text-primary)]">
                              {formatMoney(row.total_people_cost)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-5">
                          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-3">
                            <div className="text-[var(--text-muted)]">Gross Wages</div>
                            <div className="mt-1 text-[var(--text-primary)]">
                              {formatMoney(row.gross_wages_total)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-3">
                            <div className="text-[var(--text-muted)]">Entitlements</div>
                            <div className="mt-1 text-[var(--text-primary)]">
                              {formatMoney(row.entitlement_cost_total)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-3">
                            <div className="text-[var(--text-muted)]">ESCT</div>
                            <div className="mt-1 text-[var(--text-primary)]">
                              {formatMoney(row.esct_total)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-3">
                            <div className="text-[var(--text-muted)]">Employee Overheads</div>
                            <div className="mt-1 text-[var(--text-primary)]">
                              {formatMoney(row.employee_overheads_total)}
                            </div>
                          </div>

                          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] p-3">
                            <div className="text-[var(--text-muted)]">Productive Hours</div>
                            <div className="mt-1 text-[var(--text-primary)]">
                              {Number(row.productive_hours || 0).toLocaleString()}
                            </div>
                          </div>
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
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Business Cost</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Assets + General Overheads
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4 space-y-4">
          <div className="flex items-center justify-between text-[var(--text-primary)]">
            <span>Assets</span>
            <span>{formatMoney(asset_cost_total)}</span>
          </div>

          <div className="flex items-center justify-between text-[var(--text-primary)]">
            <span>General Overheads</span>
            <span>{formatMoney(general_overheads_total)}</span>
          </div>

          <div className="border-t border-[var(--border-primary)] pt-4 flex items-center justify-between font-semibold text-[var(--text-primary)]">
            <span>Total Business Cost</span>
            <span>{formatMoney(business_cost_total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Total Cost & Recovery</h3>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Total Cost Burden
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {formatMoney(total_cost_burden)}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Required Revenue
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {formatMoney(required_revenue)}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4">
            <div className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Required Recovery Rate
            </div>
            <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
              {formatMoney(required_recovery_rate)}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4 text-sm text-[var(--success)]">
          {highlight_insight}
        </div>
      </div>
    </section>
  );
}