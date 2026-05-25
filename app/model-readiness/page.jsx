"use client";

import useModelReadiness from "@/hooks/useModelReadiness";

import ModelReadinessStatusStrip from "@/components/model-readiness/ModelReadinessStatusStrip";
import ModelReadinessVarianceBreakdown from "@/components/model-readiness/ModelReadinessVarianceBreakdown";
import ModelReadinessBaselineInputsCard from "@/components/model-readiness/ModelReadinessBaselineInputsCard";
import ModelReadinessAuditPanel from "@/components/model-readiness/ModelReadinessAuditPanel";
import ModelReadinessReconciliationChecks from "@/components/model-readiness/ModelReadinessReconciliationChecks";
import ModelReadinessDiagnosticSection from "@/components/model-readiness/ModelReadinessDiagnosticSection";

export default function Page() {
  const model_readiness = useModelReadiness();
  const { status, reconciliation, modules } = model_readiness;

  const raw_input_rows = [
    ["pnl_ready", status.pnl_ready],
    ["total_business_costs", status.total_business_costs, "currency"],
    ["unassigned_balance", status.unassigned_balance, "currency"],
    ["labour_benchmark_total", status.labour_benchmark_total, "currency"],
    ["assets_benchmark_total", status.assets_benchmark_total, "currency"],
    [
      "general_overheads_benchmark_total",
      status.general_overheads_benchmark_total,
      "currency",
    ],
    ["total_labour_cost_annual", status.total_labour_cost_annual, "currency"],
    ["total_general_overheads", status.total_general_overheads, "currency"],
    ["total_asset_cost_annual", status.total_asset_cost_annual, "currency"],
    ["total_productive_output", status.total_productive_output, "number"],
    ["general_overheads_ready", status.general_overheads_ready],
    ["labour_ready", status.labour_ready],
    ["assets_ready", status.assets_ready],
    ["reconciliation_ready", status.reconciliation_ready],
    ["model_ready", status.model_ready],
    ["model_readiness_status", status.model_readiness_status],
    ["blocking_modules", status.blocking_modules],
    ["warning_modules", status.warning_modules],
    [
      "module_total_business_costs",
      status.module_total_business_costs,
      "currency",
    ],
    [
      "pnl_business_cost_variance",
      status.pnl_business_cost_variance,
      "currency",
    ],
    [
      "pnl_business_cost_variance_percent",
      status.pnl_business_cost_variance_percent,
      "percent",
    ],
  ];

  const normalised_input_rows = [
    ["pnl_ready", status.normalised_reconciliation_inputs?.pnl_ready],
    [
      "total_business_costs",
      status.normalised_reconciliation_inputs?.total_business_costs,
      "currency",
    ],
    [
      "unassigned_balance",
      status.normalised_reconciliation_inputs?.unassigned_balance,
      "currency",
    ],
    [
      "total_labour_cost_annual",
      status.normalised_reconciliation_inputs?.total_labour_cost_annual,
      "currency",
    ],
    [
      "total_general_overheads",
      status.normalised_reconciliation_inputs?.total_general_overheads,
      "currency",
    ],
    [
      "total_asset_cost_annual",
      status.normalised_reconciliation_inputs?.total_asset_cost_annual,
      "currency",
    ],
    [
      "total_productive_output",
      status.normalised_reconciliation_inputs?.total_productive_output,
      "number",
    ],
    [
      "general_overheads_ready",
      status.normalised_reconciliation_inputs?.general_overheads_ready,
    ],
    ["labour_ready", status.normalised_reconciliation_inputs?.labour_ready],
    ["assets_ready", status.normalised_reconciliation_inputs?.assets_ready],
    [
      "has_employee_overheads",
      status.normalised_reconciliation_inputs?.has_employee_overheads,
    ],
    [
      "has_legacy_running_costs",
      status.normalised_reconciliation_inputs?.has_legacy_running_costs,
    ],
  ];

  return (
    <main className="ui-page">
      <div className="ui-stack-lg">
        <section className="ui-section">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Developer diagnostics</div>
            <div className="ui-display">Model Readiness</div>
            <p className="ui-help">
              Evaluate Module Reconciliation and Model Readiness against the
              live QS Tools contract.
            </p>
          </div>
        </section>

        <ModelReadinessStatusStrip status={status} />

        <ModelReadinessVarianceBreakdown status={status} />

        <ModelReadinessBaselineInputsCard status={status} />

        <ModelReadinessAuditPanel
          status={status}
          reconciliation={reconciliation}
          modules={modules}
        />

        <ModelReadinessReconciliationChecks
          checks={status.reconciliation_checks ?? []}
        />

        <ModelReadinessDiagnosticSection
          kicker="Raw Input Snapshot"
          description="Exact values used by Module Reconciliation and Model Readiness."
          rows={raw_input_rows}
        />

        <ModelReadinessDiagnosticSection
          kicker="Normalised Reconciliation Inputs"
          description="Values after adapter/normalisation inside moduleReconciliation.js."
          rows={normalised_input_rows}
        />
      </div>
    </main>
  );
}