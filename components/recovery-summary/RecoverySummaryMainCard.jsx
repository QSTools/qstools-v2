"use client";

import RecoverySummaryDistributionBlock from "@/components/recovery-summary/RecoverySummaryDistributionBlock";
import RecoverySummaryHandoffBlock from "@/components/recovery-summary/RecoverySummaryHandoffBlock";
import RecoverySummaryInsightBlock from "@/components/recovery-summary/RecoverySummaryInsightBlock";
import RecoverySummaryModelSelectorBlock from "@/components/recovery-summary/RecoverySummaryModelSelectorBlock";
import RecoverySummaryStartingSplitBlock from "@/components/recovery-summary/RecoverySummaryStartingSplitBlock";
import RecoverySummaryUnassignedCheckBlock from "@/components/recovery-summary/RecoverySummaryUnassignedCheckBlock";

export default function RecoverySummaryMainCard({
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
