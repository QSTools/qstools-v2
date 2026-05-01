"use client";

import useBusinessSummary from "@/hooks/useBusinessSummary";

import BusinessSummaryStatusStrip from "@/components/business-summary/BusinessSummaryStatusStrip";
import BusinessSummaryCard from "@/components/business-summary/BusinessSummaryCard";
import BusinessSummaryHelpPanel from "@/components/business-summary/BusinessSummaryHelpPanel";

export default function BusinessSummaryPage() {
  const { status, card } = useBusinessSummary();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <BusinessSummaryStatusStrip
          net_position={status.net_position}
          current_margin_per_hour={status.current_margin_per_hour}
          required_recovery_rate={status.required_recovery_rate}
          hourly_gap={status.hourly_gap}
          warning_count={status.warning_count}
          business_summary_warnings={status.business_summary_warnings}
        />

        <BusinessSummaryCard
          total_revenue={card.total_revenue}
          total_direct_costs={card.total_direct_costs}
          margin_pool={card.margin_pool}
          gross_margin_percent={card.gross_margin_percent}
          total_cost_burden={card.total_cost_burden}
          total_productive_output={card.total_productive_output}
          required_recovery_rate={card.required_recovery_rate}
          net_position={card.net_position}
          current_margin_per_hour={card.current_margin_per_hour}
          hourly_gap={card.hourly_gap}
        />

        <BusinessSummaryHelpPanel />
      </div>
    </main>
  );
}
