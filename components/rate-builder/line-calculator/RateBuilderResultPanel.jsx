import {
  formatCurrency,
  formatPercent,
  formatRate,
} from "@/lib/calculations/rateBuilderCalculations";

import { get_unit_label } from "./rateBuilderLineCalculatorConstants";

export default function RateBuilderResultPanel({
  display_calculator_name,
  has_labour_rate_context,
  labour_charge_out_rate,
  labour_job_charge,
  labour_minimum_recoverable_rate,
  labour_per_hr_profit,
  preview,
  recovery_driver_quantity,
  recovery_preview,
  selected_cost_allocation_group,
  selected_group_asset_rate,
  selected_group_labour_rate,
  selected_group_overhead_rate,
  selected_group_recovery_rate,
}) {
  return (
        <article className="ui-section">
          <p className="ui-kicker">Calculator result</p>

          <h2 className="ui-section-title">
            Example charge total - {display_calculator_name}
          </h2>

          <p className="ui-help">
            The total charge is divided by the selected output driver quantity
            to show the effective rate per output unit.
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">Total charge</p>

              <p className="rate-builder-result-value">
                {formatCurrency(preview.total_charge)}
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Primary output driver
              </p>

              <p className="rate-builder-driver-name">
                {preview.output_driver_name}
              </p>

              <p className="rate-builder-driver-quantity">
                {preview.output_driver_quantity}{" "}
                {get_unit_label(preview.output_driver_unit)}
              </p>
            </div>

            <div className="rate-builder-effective-card">
              <p className="rate-builder-effective-label">Effective rate</p>

              <p className="rate-builder-result-value">
                {formatRate(
                  preview.effective_rate_per_output_unit,
                  get_unit_label(preview.output_driver_unit)
                )}
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Cost Allocation source
              </p>

              <p className="rate-builder-driver-name">
                {selected_cost_allocation_group?.group_name ||
                  "No cost group selected"}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="ui-help">
                  Labour cost:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.assigned_labour_cost || 0
                  )}
                </p>

                <p className="ui-help">
                  Labour hours:{" "}
                  {Number(
                    selected_cost_allocation_group?.assigned_labour_hours || 0
                  ).toFixed(2)}
                </p>

                <p className="ui-help">
                  Labour recovery rate:{" "}
                  {formatRate(selected_group_labour_rate, "hr")}
                </p>

                <p className="ui-help">
                  Asset cost:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.assigned_asset_burden || 0
                  )}
                </p>

                <p className="ui-help">
                  Asset hours:{" "}
                  {Number(
                    selected_cost_allocation_group?.assigned_asset_hours || 0
                  ).toFixed(2)}
                </p>

                <p className="ui-help">
                  Asset recovery rate: {formatRate(selected_group_asset_rate, "hr")}
                </p>

                <p className="ui-help">
                  Overhead allocation:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.assigned_overhead_amount || 0
                  )}
                </p>

                <p className="ui-help">
                  Overhead recovery rate:{" "}
                  {formatRate(selected_group_overhead_rate, "hr")}
                </p>

                <p className="ui-help">
                  Total group cost:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.total_group_cost || 0
                  )}
                </p>                <p className="ui-help">
                  Recovery basis:{" "}
                  {selected_cost_allocation_group?.group_recovery_hour_source ===
                  "asset_hours"
                    ? "Asset hours"
                    : selected_cost_allocation_group?.group_recovery_hour_source ===
                        "manual_hours"
                      ? "Manual hours"
                      : "Labour hours"}
                </p>

                <p className="ui-help">
                  Recovery hours used:{" "}
                  {Number(
                    selected_cost_allocation_group?.group_recovery_hours || 0
                  ).toFixed(2)}
                </p>

                <p className="ui-help sm:col-span-2">
                  Group recovery rate:{" "}
                  {formatRate(selected_group_recovery_rate, "hr")}
                </p>
              </div>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">Profit / shortfall</p>

              <p className="rate-builder-result-value">
                {formatCurrency(recovery_preview.profit_amount)}
              </p>

              <div className="mt-3 grid gap-1 text-xs text-[var(--text-secondary)] sm:grid-cols-3">
                <p>
                  Pricing unit:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {get_unit_label(preview.output_driver_unit)}
                  </span>
                </p>
                <p>
                  Output quantity:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {preview.output_driver_quantity}{" "}
                    {get_unit_label(preview.output_driver_unit)}
                  </span>
                </p>
                <p>
                  Recovery hours:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {recovery_driver_quantity.toFixed(2)} hrs
                  </span>
                </p>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/80">
                <div className="grid grid-cols-4 border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold text-slate-300">
                  <div className="px-3 py-2">View</div>
                  <div className="px-3 py-2 text-right">Charge</div>
                  <div className="px-3 py-2 text-right">Cost</div>
                  <div className="px-3 py-2 text-right">Profit / Loss</div>
                </div>

                <div className="grid grid-cols-4 border-b border-slate-800/80 text-xs">
                  <div className="px-3 py-2 font-semibold text-slate-200">
                    Total job
                  </div>
                  <div className="px-3 py-2 text-right font-semibold text-slate-100">
                    {formatCurrency(preview.total_charge)}
                  </div>
                  <div className="px-3 py-2 text-right font-semibold text-slate-100">
                    {formatCurrency(selected_group_recovery_rate * recovery_driver_quantity)}
                  </div>
                  <div className="px-3 py-2 text-right font-semibold text-cyan-300">
                    {formatCurrency(recovery_preview.profit_amount)}
                  </div>
                </div>

                <div className="grid grid-cols-4 text-xs">
                  <div className="px-3 py-2 font-semibold text-slate-200">
                    Per {get_unit_label(preview.output_driver_unit)}
                  </div>
                  <div className="px-3 py-2 text-right font-semibold text-slate-100">
                    {formatCurrency(
                      preview.output_driver_quantity > 0
                        ? preview.total_charge / preview.output_driver_quantity
                        : 0
                    )}
                  </div>
                  <div className="px-3 py-2 text-right font-semibold text-slate-100">
                    {formatCurrency(recovery_preview.recovery_cost_per_output_unit)}
                  </div>
                  <div className="px-3 py-2 text-right font-semibold text-cyan-300">
                    {formatCurrency(recovery_preview.profit_per_output_unit)}
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/80">
                <div className="grid grid-cols-4 border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold text-slate-300">
                  <div className="px-3 py-2">Charge / Cost breakdown</div>
                  <div className="px-3 py-2 text-right">Charge</div>
                  <div className="px-3 py-2 text-right">Cost</div>
                  <div className="px-3 py-2 text-right">Profit / Loss</div>
                </div>

                {has_labour_rate_context ? (
                  <>
                    <div className="grid grid-cols-4 border-b border-slate-800/80 text-xs">
                      <div className="px-3 py-2 font-semibold text-slate-200">Labour</div>
                      <div className="px-3 py-2 text-right text-slate-100">{formatCurrency(labour_charge_out_rate)}</div>
                      <div className="px-3 py-2 text-right text-slate-100">{formatCurrency(labour_minimum_recoverable_rate)}</div>
                      <div className={`px-3 py-2 text-right font-semibold ${labour_per_hr_profit >= 0 ? "text-cyan-300" : "text-red-400"}`}>
                        {formatCurrency(labour_per_hr_profit)}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 border-b border-slate-800/80 text-xs">
                      <div className="px-3 py-2 font-semibold text-slate-200">Asset</div>
                      <div className="px-3 py-2 text-right text-slate-100">
                        {formatCurrency(preview.total_charge - labour_job_charge > 0 ? (preview.total_charge - labour_job_charge) / recovery_driver_quantity : 0)}
                      </div>
                      <div className="px-3 py-2 text-right text-slate-100">{formatCurrency(selected_group_asset_rate)}</div>
                      <div className={`px-3 py-2 text-right font-semibold ${(preview.total_charge - labour_job_charge) / recovery_driver_quantity - selected_group_asset_rate >= 0 ? "text-cyan-300" : "text-red-400"}`}>
                        {formatCurrency(recovery_driver_quantity > 0 ? (preview.total_charge - labour_job_charge) / recovery_driver_quantity - selected_group_asset_rate : 0)}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 text-xs">
                      <div className="px-3 py-2 font-semibold text-cyan-300">Total / hr</div>
                      <div className="px-3 py-2 text-right font-semibold text-cyan-300">
                        {formatCurrency(recovery_driver_quantity > 0 ? preview.total_charge / recovery_driver_quantity : 0)}
                      </div>
                      <div className="px-3 py-2 text-right font-semibold text-cyan-300">
                        {formatCurrency(labour_minimum_recoverable_rate + selected_group_asset_rate)}
                      </div>
                      <div className={`px-3 py-2 text-right font-semibold ${recovery_driver_quantity > 0 && (preview.total_charge / recovery_driver_quantity) - (labour_minimum_recoverable_rate + selected_group_asset_rate) >= 0 ? "text-cyan-300" : "text-red-400"}`}>
                        {formatCurrency(recovery_driver_quantity > 0 ? (preview.total_charge / recovery_driver_quantity) - (labour_minimum_recoverable_rate + selected_group_asset_rate) : 0)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-4 border-b border-slate-800/80 text-xs">
                      <div className="px-3 py-2 font-semibold text-slate-200">Labour</div>
                      <div className="px-3 py-2 text-right text-slate-400">—</div>
                      <div className="px-3 py-2 text-right text-slate-100">{formatCurrency(selected_group_labour_rate)}</div>
                      <div className="px-3 py-2 text-right text-slate-400">—</div>
                    </div>
                    <div className="grid grid-cols-4 border-b border-slate-800/80 text-xs">
                      <div className="px-3 py-2 font-semibold text-slate-200">Asset</div>
                      <div className="px-3 py-2 text-right text-slate-400">—</div>
                      <div className="px-3 py-2 text-right text-slate-100">{formatCurrency(selected_group_asset_rate)}</div>
                      <div className="px-3 py-2 text-right text-slate-400">—</div>
                    </div>
                    <div className="grid grid-cols-4 text-xs">
                      <div className="px-3 py-2 font-semibold text-slate-400 text-xs">Set a charge-out rate in Labour Rates Builder to see charge / profit breakdown.</div>
                    </div>
                  </>
                )}
              </div>
              <p className="ui-help mt-3">
                Margin: {formatPercent(recovery_preview.profit_margin_percent)}
              </p>
              <p className="ui-help">
                Status: {recovery_preview.recovery_status}
              </p>
            </div>
          </div>
        </article>
  );
}
