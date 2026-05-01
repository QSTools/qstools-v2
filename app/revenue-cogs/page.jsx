"use client";

import useRevenueCogs from "@/hooks/useRevenueCogs";

import RevenueCogsStatusStrip from "@/components/revenue-cogs/RevenueCogsStatusStrip";
import RevenueCogsCard from "@/components/revenue-cogs/RevenueCogsCard";
import RevenueCogsHelpPanel from "@/components/revenue-cogs/RevenueCogsHelpPanel";

export default function RevenueCogsPage() {
  const { status, card } = useRevenueCogs();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <RevenueCogsStatusStrip
          revenue_cogs_ready={status.revenue_cogs_ready}
          total_revenue={status.total_revenue}
          total_direct_costs={status.total_direct_costs}
          margin_pool={status.margin_pool}
          warning_count={status.warning_count}
          revenue_cogs_warnings={status.revenue_cogs_warnings}
        />

        <RevenueCogsCard
          total_revenue={card.total_revenue}
          total_direct_costs={card.total_direct_costs}
          margin_pool={card.margin_pool}
          gross_margin_percent={card.gross_margin_percent}
          revenue_line_items={card.revenue_line_items}
          direct_cost_categories={card.direct_cost_categories}
        />

        <RevenueCogsHelpPanel />
      </div>
    </main>
  );
}
