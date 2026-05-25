"use client";

import { useState } from "react";
import { downloadLiveAuditSnapshot } from "@/lib/audit/downloadLiveAuditSnapshot";

function to_number(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function display_value(value) {
  if (value === undefined || value === null) return "n/a";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "none";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function SummaryMetric({ label, value }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{label}</div>
      <div className="ui-card-title-sm">{display_value(value)}</div>
    </div>
  );
}

export default function ModelReadinessAuditPanel({
  status = {},
  reconciliation = {},
  modules = {},
}) {
  const [download_status, set_download_status] = useState("");

  function handleDownloadAuditSnapshot() {
    const labour_output =
      modules?.labour?.output_contract ??
      modules?.labour ??
      {};

    const assets_output =
      modules?.assets?.output_contract ??
      modules?.assets ??
      {};

    const general_overheads_output =
      modules?.generalOverheads?.output_contract ??
      modules?.general_overheads?.output_contract ??
      modules?.generalOverheads ??
      modules?.general_overheads ??
      {};

    const pnl_output =
      modules?.profitAndLoss?.output_contract ??
      modules?.profit_and_loss?.output_contract ??
      modules?.pnl?.output_contract ??
      modules?.profitAndLoss ??
      modules?.profit_and_loss ??
      modules?.pnl ??
      {};

    const total_people_cost_annual =
      status.total_people_cost_annual ??
      reconciliation.total_people_cost_annual ??
      labour_output.total_people_cost_annual ??
      labour_output.total_labour_cost_annual ??
      0;

    const total_asset_cost_annual =
      status.total_asset_cost_annual ??
      reconciliation.total_asset_cost_annual ??
      assets_output.total_asset_cost_annual ??
      0;

    const total_business_overheads =
      status.total_business_overheads ??
      reconciliation.total_business_overheads ??
      status.total_general_overheads ??
      reconciliation.total_general_overheads ??
      general_overheads_output.total_general_overheads ??
      0;

    const calculated_total_cost_burden =
      to_number(total_people_cost_annual) +
      to_number(total_asset_cost_annual) +
      to_number(total_business_overheads);

    const total_cost_burden =
      status.total_cost_burden ??
      reconciliation.total_cost_burden ??
      calculated_total_cost_burden;

    const required_revenue =
      status.required_revenue ??
      reconciliation.required_revenue ??
      total_cost_burden;

    const required_recovery_rate =
      status.required_recovery_rate ??
      reconciliation.required_recovery_rate ??
      0;

    const cost_summary_data = {
      total_people_cost_annual,
      total_asset_cost_annual,
      total_business_overheads,
      total_cost_burden,
      required_revenue,
      required_recovery_rate,
    };

    const pnl_data = {
      total_revenue:
        pnl_output.total_revenue ??
        pnl_output.revenue_total ??
        pnl_output.pnl_total_revenue ??
        reconciliation.pnl_total_revenue ??
        0,

      total_cost_of_sales:
        pnl_output.total_cost_of_sales ??
        pnl_output.cost_of_sales_total ??
        pnl_output.pnl_total_cost_of_sales ??
        reconciliation.pnl_total_cost_of_sales ??
        0,

      total_operating_expenses:
        pnl_output.total_operating_expenses ??
        pnl_output.operating_expenses_total ??
        pnl_output.pnl_total_operating_expenses ??
        reconciliation.pnl_total_operating_expenses ??
        0,

      pnl_baseline_cost:
        pnl_output.pnl_baseline_cost ??
        pnl_output.total_business_costs ??
        reconciliation.pnl_baseline_cost ??
        reconciliation.total_business_costs ??
        0,

      pnl_labour_cost:
        pnl_output.pnl_labour_cost ??
        pnl_output.labour_benchmark_total ??
        reconciliation.pnl_labour_cost ??
        reconciliation.labour_benchmark_total ??
        0,

      pnl_asset_cost:
        pnl_output.pnl_asset_cost ??
        pnl_output.assets_benchmark_total ??
        reconciliation.pnl_asset_cost ??
        reconciliation.assets_benchmark_total ??
        0,

      pnl_general_overheads:
        pnl_output.pnl_general_overheads ??
        pnl_output.general_overheads_benchmark_total ??
        reconciliation.pnl_general_overheads ??
        reconciliation.general_overheads_benchmark_total ??
        0,

      pnl_depreciation:
        pnl_output.pnl_depreciation ??
        pnl_output.depreciation_total ??
        reconciliation.pnl_depreciation ??
        reconciliation.depreciation_total ??
        0,

      pnl_interest:
        pnl_output.pnl_interest ??
        pnl_output.interest_total ??
        reconciliation.pnl_interest ??
        reconciliation.interest_total ??
        0,
    };

    const explained_variance = {
      model_ready: status.model_ready === true,
      model_readiness_status: status.model_readiness_status ?? "blocked",

      blocking_modules: status.blocking_modules ?? [],
      warning_modules: status.warning_modules ?? [],
      blocking_checks: status.blocking_checks ?? [],
      warning_checks: status.warning_checks ?? [],

      labour_model_variance:
        status.labour_model_variance ??
        reconciliation.labour_model_variance ??
        0,

      asset_model_variance:
        status.asset_model_variance ??
        reconciliation.asset_model_variance ??
        0,

      asset_finance_variance:
        status.asset_finance_variance ??
        reconciliation.asset_finance_variance ??
        0,

      depreciation_exclusion_variance:
        status.depreciation_exclusion_variance ??
        reconciliation.depreciation_exclusion_variance ??
        0,

      employee_overhead_mapping_variance:
        status.employee_overhead_mapping_variance ??
        reconciliation.employee_overhead_mapping_variance ??
        0,

      general_overhead_mapping_variance:
        status.general_overhead_mapping_variance ??
        reconciliation.general_overhead_mapping_variance ??
        0,

      cost_of_sales_mapping_variance:
        status.cost_of_sales_mapping_variance ??
        reconciliation.cost_of_sales_mapping_variance ??
        0,

      timing_variance:
        status.timing_variance ??
        reconciliation.timing_variance ??
        0,

      rounding_variance:
        status.rounding_variance ??
        reconciliation.rounding_variance ??
        0,

      unmapped_variance:
        status.unmapped_variance ??
        reconciliation.unmapped_variance ??
        0,
    };

    const result = downloadLiveAuditSnapshot({
      snapshotName: "QS Tools Model Readiness Audit Snapshot",
      pnlData: pnl_data,
      costSummaryData: cost_summary_data,
      explainedVariance: explained_variance,
      notes:
        "Diagnostic export from Model Readiness. Used to validate live QS Tools app-state against audit scripts.",
    });

    if (result?.success) {
      set_download_status("Audit snapshot downloaded.");
      return;
    }

    set_download_status(result?.error || "Audit snapshot could not be downloaded.");
  }

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Diagnostic Audit</div>

          <h2 className="ui-card-title-sm">Live audit snapshot export</h2>

          <p className="ui-help">
            Download the current Model Readiness state as a JSON snapshot for the
            Python audit tools. This is a diagnostic support export only. It does
            not change calculations, profiles, or module state.
          </p>
        </div>

        <div className="ui-actions">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={handleDownloadAuditSnapshot}
          >
            Download diagnostic audit snapshot
          </button>
        </div>

        {download_status ? (
          <p className="ui-help">{download_status}</p>
        ) : null}

        <div className="ui-panel ui-stack-sm">
          <div className="ui-label">Current readiness state</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SummaryMetric
              label="Model ready"
              value={status.model_ready === true}
            />

            <SummaryMetric
              label="Readiness status"
              value={status.model_readiness_status ?? "blocked"}
            />

            <SummaryMetric
              label="Blocking checks"
              value={(status.blocking_checks ?? []).length}
            />

            <SummaryMetric
              label="Warning checks"
              value={(status.warning_checks ?? []).length}
            />
          </div>
        </div>
      </div>
    </section>
  );
}