"use client";

import useModelReadiness from "@/hooks/useModelReadiness";
import useCostSummary from "@/hooks/useCostSummary";

import NextStepFooter from "@/components/navigation/NextStepFooter";
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
    opening_hours: model_readiness.modules.openingHours,
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
          macro_required_operating_hour_rate={card.macro_required_operating_hour_rate}
          net_annual_business_open_hours={card.net_annual_business_open_hours}
          total_cost_burden={card.total_cost_burden}
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
          total_recovery_hours={card.total_recovery_hours}
          macro_required_operating_hour_rate={card.macro_required_operating_hour_rate}
          net_annual_business_open_hours={card.net_annual_business_open_hours}
          labour_detail={card.labour_detail}
          asset_detail={card.asset_detail}
          overhead_detail={card.overhead_detail}
          highlight_insight={card.highlight_insight}
        />

        <CostSummaryNoticeBanner />
        <CostSummaryHelpPanel />
        <NextStepFooter
          nextHref="/revenue-reality"
          nextLabel="Next: Revenue Reality"
        />
      </div>
    </main>
  );
}
