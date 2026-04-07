"use client";

import { useState } from "react";

function SummaryRow({ label, value, tone = "default" }) {
  const valueClass =
    tone === "success"
      ? "text-[var(--success)]"
      : tone === "warning"
        ? "text-[var(--warning)]"
        : tone === "danger"
          ? "text-[var(--danger)]"
          : "text-[var(--text-primary)]";

  return (
    <div className="ui-panel">
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
      <div className={`mt-1 text-base font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

export default function RecoveryAnalysisCard({
  primary_constraint_title,
  decision_message,
  decision_detail,

  direct_production_staff_count_display,
  total_recoverable_hours_display,

  achievable_revenue_display,
  required_revenue_display,
  revenue_gap,
  revenue_gap_display,

  weighted_achievable_rate_display,
  required_recovery_rate_display,
  recovery_gap,
  recovery_gap_display,

  shortfall_amount_display,
  extra_hours_required_at_current_rates_display,
  cost_reduction_required_at_current_rates_display,
  required_average_rate_increase_display,

  recoverable_rows = [],
}) {
  const [productionRowsOpen, setProductionRowsOpen] = useState(false);
  const [calculationOpen, setCalculationOpen] = useState(false);

  const revenueGapTone =
    Number(revenue_gap || 0) >= 0 ? "success" : "danger";

  const recoveryGapTone =
    Number(recovery_gap || 0) >= 0 ? "success" : "danger";

  return (
    <section className="ui-section">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Recovery Analysis
        </h2>
        <p className="ui-help">
          Decision layer showing whether direct production labour can actually
          recover the full business cost burden.
        </p>
      </div>

      <div className="mt-4 ui-panel">
        <div className="ui-kicker">Primary Constraint</div>
        <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
          {primary_constraint_title}
        </div>
        <div className="mt-2 text-sm text-[var(--text-primary)]">
          {decision_message}
        </div>
        <div className="mt-2 text-sm text-[var(--text-secondary)]">
          {decision_detail}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="ui-panel">
          <div className="text-base font-semibold text-[var(--text-primary)]">
            Recoverable Labour Base
          </div>
          <div className="ui-help">
            These are the direct production staff and hours used to recover the
            full business burden.
          </div>

          <div className="mt-4 space-y-3">
            <SummaryRow
              label="Direct Production Staff"
              value={direct_production_staff_count_display}
            />
            <SummaryRow
              label="Total Recoverable Hours"
              value={total_recoverable_hours_display}
            />
          </div>

          <div className="mt-4 ui-actions">
            <button
              type="button"
              onClick={() => setProductionRowsOpen((prev) => !prev)}
              className="ui-button-secondary"
            >
              {productionRowsOpen ? "Hide Recoverable Rows" : "Show Recoverable Rows"}
            </button>
          </div>

          {productionRowsOpen ? (
            <div className="mt-4 space-y-3">
              {recoverable_rows.length > 0 ? (
                recoverable_rows.map((row, index) => (
                  <div
                    key={row.staff_id || `${row.staff_name}-${index}`}
                    className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] p-4"
                  >
                    <div className="text-base font-semibold text-[var(--text-primary)]">
                      {row.staff_name || "Unnamed Staff"}
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                      {row.staff_role || "No role set"}
                    </div>

                    <div className="mt-4 space-y-3">
                      <SummaryRow
                        label="Recoverable Hours"
                        value={row.productive_hours_display}
                      />
                      <SummaryRow
                        label="Charge Out Rate"
                        value={row.charge_out_rate_display}
                      />
                      <SummaryRow
                        label="Achievable Revenue"
                        value={row.achievable_revenue_display}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="ui-panel">
                  <div className="text-sm text-[var(--text-secondary)]">
                    No direct production rows available.
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="ui-panel">
          <div className="text-base font-semibold text-[var(--text-primary)]">
            Revenue Reality Check
          </div>
          <div className="ui-help">
            This compares what the business needs to recover against what direct
            production labour can actually recover at current charge-out rates.
          </div>

          <div className="mt-4 space-y-3">
            <SummaryRow label="Required Revenue" value={required_revenue_display} />
            <SummaryRow label="Achievable Revenue" value={achievable_revenue_display} />
            <SummaryRow
              label="Revenue Gap"
              value={revenue_gap_display}
              tone={revenueGapTone}
            />
          </div>
        </div>

        <div className="ui-panel">
          <div className="text-base font-semibold text-[var(--text-primary)]">
            Rate Reality Check
          </div>
          <div className="ui-help">
            This compares the required recovery rate against the weighted average
            rate your direct production team can actually achieve.
          </div>

          <div className="mt-4 space-y-3">
            <SummaryRow
              label="Required Recovery Rate"
              value={required_recovery_rate_display}
            />
            <SummaryRow
              label="Weighted Achievable Rate"
              value={weighted_achievable_rate_display}
            />
            <SummaryRow
              label="Recovery Gap"
              value={recovery_gap_display}
              tone={recoveryGapTone}
            />
          </div>
        </div>

        <div className="ui-panel">
          <div className="text-base font-semibold text-[var(--text-primary)]">
            What Would Fix It
          </div>
          <div className="ui-help">
            These are simple guide figures showing what would need to change if
            current direct production rates stay the same.
          </div>

          <div className="mt-4 space-y-3">
            <SummaryRow
              label="Shortfall To Remove"
              value={shortfall_amount_display}
            />
            <SummaryRow
              label="Extra Recoverable Hours Needed At Current Rates"
              value={extra_hours_required_at_current_rates_display}
            />
            <SummaryRow
              label="Cost Reduction Needed At Current Rates"
              value={cost_reduction_required_at_current_rates_display}
            />
            <SummaryRow
              label="Required Average Rate Increase"
              value={required_average_rate_increase_display}
            />
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-actions">
            <button
              type="button"
              onClick={() => setCalculationOpen((prev) => !prev)}
              className="ui-button-secondary"
            >
              {calculationOpen ? "Hide Calculation Explanation" : "Show Calculation Explanation"}
            </button>
          </div>

          {calculationOpen ? (
            <div className="mt-4 ui-stack">
              <div className="text-base font-semibold text-[var(--text-primary)]">
                How this is calculated
              </div>

              <div className="ui-help">
                1. Only staff with labour class set to direct production are used in
                the recoverable labour base.
              </div>

              <div className="ui-help">
                2. Recoverable hours are the sum of productive hours for those direct
                production staff only.
              </div>

              <div className="ui-help">
                3. Achievable revenue is calculated as:
              </div>

              <div className="ui-readonly">
                achievable revenue = sum of (productive hours × charge out rate)
              </div>

              <div className="ui-help">
                4. Weighted achievable rate is calculated as:
              </div>

              <div className="ui-readonly">
                weighted achievable rate = achievable revenue ÷ total recoverable hours
              </div>

              <div className="ui-help">
                5. Required revenue comes from Cost Summary total cost burden.
              </div>

              <div className="ui-readonly">
                required revenue = total cost burden
              </div>

              <div className="ui-help">
                6. Required recovery rate comes from Cost Summary:
              </div>

              <div className="ui-readonly">
                required recovery rate = total cost burden ÷ total recoverable hours
              </div>

              <div className="ui-help">
                7. Revenue gap and recovery gap then show whether current direct
                production pricing can actually carry the business.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}