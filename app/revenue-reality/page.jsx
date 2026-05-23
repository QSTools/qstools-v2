"use client";

import { useEffect, useState } from "react";

import useRevenueReality from "@/hooks/useRevenueReality";

import RevenueRealityStatusStrip from "@/components/revenue-reality/RevenueRealityStatusStrip";
import RevenueRealityMainCard from "@/components/revenue-reality/RevenueRealityMainCard";
import RevenueRealityComparisonBlock from "@/components/revenue-reality/RevenueRealityComparisonBlock";
import RevenueRealityLabourConsumptionBlock from "@/components/revenue-reality/RevenueRealityLabourConsumptionBlock";
import RevenueRealityHandoffBlock from "@/components/revenue-reality/RevenueRealityHandoffBlock";
import RevenueRealityHelpPanel from "@/components/revenue-reality/RevenueRealityHelpPanel";

export default function RevenueRealityPage() {
  const [is_mounted, set_is_mounted] = useState(false);
  const { status, card } = useRevenueReality();

  useEffect(() => {
    set_is_mounted(true);
  }, []);

  if (!is_mounted) {
    return null;
  }

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <RevenueRealityStatusStrip
          status_title={status.status_title}
          total_revenue={status.total_revenue}
          total_direct_costs={status.total_direct_costs}
          material_margin={status.material_margin}
          total_labour_cost_annual={status.total_labour_cost_annual}
          stress_tested_margin_after_labour={
            status.stress_tested_margin_after_labour
          }
          warning_count={status.warning_count}
          revenue_reality_warnings={status.revenue_reality_warnings}
        />

        <RevenueRealityMainCard
          formatted={card.formatted}
          hero_message={card.hero_message}
          is_hours_based={card.is_hours_based}
        />

        <RevenueRealityComparisonBlock
          comparison_rows={card.comparison_rows}
        />

        <RevenueRealityLabourConsumptionBlock
          formatted={card.formatted}
          labour_consumption_message={card.labour_consumption_message}
        />

        <RevenueRealityHandoffBlock />

        <RevenueRealityHelpPanel />
      </div>
    </main>
  );
}
