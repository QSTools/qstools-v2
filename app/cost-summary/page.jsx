"use client";

import useModelReadiness from "@/hooks/useModelReadiness";
import useCostSummary from "@/hooks/useCostSummary";

import CostSummaryStatusStrip from "@/components/cost-summary/CostSummaryStatusStrip";
import CostSummaryNoticeBanner from "@/components/cost-summary/CostSummaryNoticeBanner";
import CostSummaryCard from "@/components/cost-summary/CostSummaryCard";
import CostSummaryHelpPanel from "@/components/cost-summary/CostSummaryHelpPanel";

export default function CostSummaryPage() {
  const model_readiness = useModelReadiness();

  const { status, card } = useCostSummary({
    labour: model_readiness.modules.labour,
    assets: model_readiness.modules.assets,
    general_overheads: model_readiness.modules.generalOverheads,
    model_readiness: model_readiness.status,
  });

  return (
    <main className="ui-page">
  <div className="ui-page-stack">
    <CostSummaryNoticeBanner />

    <CostSummaryStatusStrip
      model_ready={status.model_ready}
      model_readiness_status={status.model_readiness_status}
      blocking_modules={status.blocking_modules}
      warning_modules={status.warning_modules}
      blocking_checks={status.blocking_checks}
      warning_checks={status.warning_checks}
      required_recovery_rate={card.required_recovery_rate}
      total_productive_output={card.total_productive_output}
      total_people_cost_annual={card.people_cost_total}
      total_asset_cost_annual={card.asset_cost_total}
      total_business_overheads={card.general_overheads_total}
    />

    <CostSummaryCard
      recovery_model_label={card.recovery_model_block.recovery_model_label}
      linked_staff_count={card.recovery_model_block.linked_staff_count}
      linked_asset_count={card.recovery_model_block.linked_asset_count}
      unlinked_active_staff_count={0}
      recovery_warnings={card.recovery_model_block.warnings}
      people_cost_total={card.people_cost_total}
      gross_wages_total={card.gross_wages_total}
      entitlements_total={card.entitlements_total}
      employer_kiwisaver_total={card.employer_kiwisaver_total}
      esct_total={card.esct_total}
      acc_levy_total={card.acc_levy_total}
      employer_contribution_total={card.employer_contribution_total}
      people_rows={card.people_rows}
      business_cost_total={card.business_cost_total}
      asset_cost_total={card.asset_cost_total}
      general_overheads_total={card.general_overheads_total}
      asset_rows={card.asset_rows}
      general_overhead_rows={card.general_overhead_rows}
      total_cost_burden={card.total_cost_burden}
      required_revenue={card.required_revenue}
      required_recovery_rate={card.required_recovery_rate}
      total_productive_output={card.total_productive_output}
      highlight_insight={card.highlight_insight}
    />

    <CostSummaryHelpPanel />
  </div>
</main>
  );
}
