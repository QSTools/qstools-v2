"use client";

import RecoverySummaryDistributionBlock from "@/components/recovery-summary/RecoverySummaryDistributionBlock";
import RecoverySummaryGrossProfitStatusBlock from "@/components/recovery-summary/RecoverySummaryGrossProfitStatusBlock";
import RecoverySummaryHandoffBlock from "@/components/recovery-summary/RecoverySummaryHandoffBlock";
import RecoverySummaryInsightBlock from "@/components/recovery-summary/RecoverySummaryInsightBlock";
import RecoverySummaryModelSelectorBlock from "@/components/recovery-summary/RecoverySummaryModelSelectorBlock";
import RecoverySummaryRequirementBlock from "@/components/recovery-summary/RecoverySummaryRequirementBlock";
import RecoverySummaryStartingSplitBlock from "@/components/recovery-summary/RecoverySummaryStartingSplitBlock";
import RecoverySummaryUnassignedCheckBlock from "@/components/recovery-summary/RecoverySummaryUnassignedCheckBlock";

export default function RecoverySummaryMainCard({
  total_cost_burden,
  required_recovery_rate,
  recovery_hours_used,

  business_type,
  activity_driver_type,
  units_sold_annual,

  actual_recovery_rate,
  profit_or_deficit_per_recovery_hour,

  recovery_model,
  labour_share_percent,
  asset_share_percent,
  material_share_percent,
  overhead_absorbed_percent,
  overhead_share_percent,

  labour_recovery_cost,
  asset_recovery_cost,
  material_recovery_cost,
  overhead_absorbed_cost,
  explained_recovery_total,
  share_total,

  share_not_balanced,

  gross_profit,
  margin_pool,
  gross_profit_source_status,
  material_margin_status,
  asset_utilisation_status,
  material_recovery_included,
  asset_recovery_included,

  overhead_absorption_level,
  overhead_absorption_title,
  overhead_absorption_message,
  overhead_absorption_diagnostics = [],

  insight_text,

  on_recovery_model_change,
  on_reset,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Recovery basis</p>

            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Recovery basis being carried forward
            </h2>

            <p className="ui-help">
              This section shows how the Business Summary cost burden becomes a
              starting recovery model. Cost Allocation will test whether the
              business structure can support this model.
            </p>
          </div>

          <RecoverySummaryRequirementBlock
            total_cost_burden={total_cost_burden}
            required_recovery_rate={required_recovery_rate}
            recovery_hours_used={recovery_hours_used}
            business_type={business_type}
            activity_driver_type={activity_driver_type}
            units_sold_annual={units_sold_annual}
            actual_recovery_rate={actual_recovery_rate}
            profit_or_deficit_per_recovery_hour={
              profit_or_deficit_per_recovery_hour
            }
          />

          <RecoverySummaryGrossProfitStatusBlock
            gross_profit={gross_profit}
            margin_pool={margin_pool}
            gross_profit_source_status={gross_profit_source_status}
            material_margin_status={material_margin_status}
            asset_utilisation_status={asset_utilisation_status}
          />

          <RecoverySummaryModelSelectorBlock
            recovery_model={recovery_model}
            on_recovery_model_change={on_recovery_model_change}
          />

          <RecoverySummaryStartingSplitBlock
            labour_share_percent={labour_share_percent}
            asset_share_percent={asset_share_percent}
            material_share_percent={material_share_percent}
            overhead_absorbed_percent={overhead_absorbed_percent}
            overhead_share_percent={overhead_share_percent}
            explained_recovery_total={explained_recovery_total}
            share_total={share_total}
            share_not_balanced={share_not_balanced}
            on_reset={on_reset}
          />

          <RecoverySummaryDistributionBlock
            labour_recovery_cost={labour_recovery_cost}
            asset_recovery_cost={asset_recovery_cost}
            material_recovery_cost={material_recovery_cost}
            overhead_absorbed_cost={overhead_absorbed_cost}
          />

          <RecoverySummaryUnassignedCheckBlock
            overhead_absorption_level={overhead_absorption_level}
            overhead_absorption_title={overhead_absorption_title}
            overhead_absorption_message={overhead_absorption_message}
            overhead_absorption_diagnostics={overhead_absorption_diagnostics}
          />

          <RecoverySummaryHandoffBlock
            material_recovery_included={material_recovery_included}
            asset_recovery_included={asset_recovery_included}
          />

          <RecoverySummaryInsightBlock insight_text={insight_text} />
        </div>
      </div>
    </section>
  );
}
