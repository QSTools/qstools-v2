"use client";

import ModelReadinessStatusStrip from "@/components/model-readiness/ModelReadinessStatusStrip";
import ModelReadinessAuditPanel from "@/components/model-readiness/ModelReadinessAuditPanel";
import useModelReadiness from "@/hooks/useModelReadiness";

export default function Page() {
  const model_readiness = useModelReadiness();
  const { status, reconciliation, modules } = model_readiness;

  return (
    <main className="ui-page">
      <div className="ui-stack-lg">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Developer diagnostics</div>
            <div className="ui-display">Model Readiness</div>
            <p className="ui-help">
              Evaluate Module Reconciliation and Model Readiness against the v3.6 contract.
            </p>
          </div>
        </section>

        <ModelReadinessStatusStrip status={status} />

        <ModelReadinessAuditPanel
          status={status}
          reconciliation={reconciliation}
          modules={modules}
        />

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Reconciliation checks</div>
            <p className="ui-help">
              The following checks are derived from Profit & Loss, Labour, General Overheads and Assets.
            </p>

            <div className="labour-summary-table">
              {(status.reconciliation_checks ?? []).map((check, index) => (
                <div key={`check-row-${index}`} className="labour-summary-row">
                  <div>
                    <strong>{check.label}</strong>
                    <div className="ui-help">{check.message}</div>
                  </div>

                  <div className="labour-summary-value">
                    {String(check.status ?? "").toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Raw Input Snapshot</div>
            <p className="ui-help">
              Exact values used by Module Reconciliation and Model Readiness.
            </p>

            <div className="labour-summary-table">
              {[
                ["pnl_ready", status.pnl_ready],
                ["total_business_costs", status.total_business_costs],
                ["unassigned_balance", status.unassigned_balance],
                ["labour_benchmark_total", status.labour_benchmark_total],
                ["assets_benchmark_total", status.assets_benchmark_total],
                [
                  "general_overheads_benchmark_total",
                  status.general_overheads_benchmark_total,
                ],
                ["total_labour_cost_annual", status.total_labour_cost_annual],
                ["total_general_overheads", status.total_general_overheads],
                ["total_asset_cost_annual", status.total_asset_cost_annual],
                ["total_productive_output", status.total_productive_output],
                ["general_overheads_ready", status.general_overheads_ready],
                ["labour_ready", status.labour_ready],
                ["assets_ready", status.assets_ready],
                ["reconciliation_ready", status.reconciliation_ready],
                ["model_ready", status.model_ready],
                ["model_readiness_status", status.model_readiness_status],
                [
                  "blocking_modules",
                  Array.isArray(status.blocking_modules)
                    ? status.blocking_modules.join(", ")
                    : status.blocking_modules,
                ],
                [
                  "warning_modules",
                  Array.isArray(status.warning_modules)
                    ? status.warning_modules.join(", ")
                    : status.warning_modules,
                ],
                ["module_total_business_costs", status.module_total_business_costs],
                ["pnl_business_cost_variance", status.pnl_business_cost_variance],
                [
                  "pnl_business_cost_variance_percent",
                  status.pnl_business_cost_variance_percent,
                ],
              ].map(([label, value]) => (
                <div key={label} className="labour-summary-row">
                  <span className="labour-summary-label">{label}</span>
                  <span className="labour-summary-value">
                    {value === undefined || value === null ? "n/a" : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Normalised Reconciliation Inputs</div>
            <p className="ui-help">
              Values after adapter/normalisation inside moduleReconciliation.js.
            </p>

            <div className="labour-summary-table">
              {[
                [
                  "pnl_ready",
                  status.normalised_reconciliation_inputs?.pnl_ready,
                ],
                [
                  "total_business_costs",
                  status.normalised_reconciliation_inputs?.total_business_costs,
                ],
                [
                  "unassigned_balance",
                  status.normalised_reconciliation_inputs?.unassigned_balance,
                ],
                [
                  "total_labour_cost_annual",
                  status.normalised_reconciliation_inputs?.total_labour_cost_annual,
                ],
                [
                  "total_general_overheads",
                  status.normalised_reconciliation_inputs?.total_general_overheads,
                ],
                [
                  "total_asset_cost_annual",
                  status.normalised_reconciliation_inputs?.total_asset_cost_annual,
                ],
                [
                  "total_productive_output",
                  status.normalised_reconciliation_inputs?.total_productive_output,
                ],
                [
                  "general_overheads_ready",
                  status.normalised_reconciliation_inputs?.general_overheads_ready,
                ],
                [
                  "labour_ready",
                  status.normalised_reconciliation_inputs?.labour_ready,
                ],
                [
                  "assets_ready",
                  status.normalised_reconciliation_inputs?.assets_ready,
                ],
                [
                  "has_employee_overheads",
                  status.normalised_reconciliation_inputs?.has_employee_overheads,
                ],
                [
                  "has_legacy_running_costs",
                  status.normalised_reconciliation_inputs?.has_legacy_running_costs,
                ],
              ].map(([label, value]) => (
                <div key={label} className="labour-summary-row">
                  <span className="labour-summary-label">{label}</span>
                  <span className="labour-summary-value">
                    {value === undefined || value === null ? "n/a" : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}