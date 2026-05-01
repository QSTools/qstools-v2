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
          people_cost_total={card.people_cost_total}
          business_cost_total={card.business_cost_total}
          asset_cost_total={card.asset_cost_total}
          total_asset_interest_annual={card.total_asset_interest_annual}
          general_overheads_total={card.general_overheads_total}
          total_cost_burden={card.total_cost_burden}
          required_revenue={card.required_revenue}
          required_recovery_rate={card.required_recovery_rate}
          total_productive_output={card.total_productive_output}
          highlight_insight={card.highlight_insight}
        />

        <CostSummaryNoticeBanner />
        <CostSummaryHelpPanel />
      </div>
    </main>
  );
}
