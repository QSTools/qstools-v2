"use client";

import { useEffect, useState } from "react";

import useRecoverySummary from "@/hooks/useRecoverySummary";

import RecoverySummaryStatusStrip from "@/components/recovery-summary/RecoverySummaryStatusStrip";
import RecoverySummaryMainCard from "@/components/recovery-summary/RecoverySummaryMainCard";
import RecoverySummaryHelpPanel from "@/components/recovery-summary/RecoverySummaryHelpPanel";

export default function RecoverySummaryPage() {
  const [is_mounted, set_is_mounted] = useState(false);

  useEffect(() => {
    set_is_mounted(true);
  }, []);

  const { status, card } = useRecoverySummary();

  if (!is_mounted) {
    return null;
  }

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <RecoverySummaryStatusStrip
          business_type={card.business_type}
          activity_driver_type={card.activity_driver_type}
          activity_driver_label={card.activity_driver_label}
          recovery_ready={status.recovery_ready}
          warning_count={status.warning_count}
          warning_items={status.warning_items}
          margin_pool={card.margin_pool}
          total_cost_burden={card.total_cost_burden}
          net_position={card.net_position}
          current_margin_per_driver={card.current_margin_per_driver}
          required_recovery_per_driver={card.required_recovery_per_driver}
          recovery_gap_per_driver={card.recovery_gap_per_driver}
          total_revenue={card.total_revenue}
          total_direct_costs={card.total_direct_costs}
          total_people_cost_annual={card.total_people_cost_annual}
          total_asset_cost_annual={card.total_asset_cost_annual}
          total_business_overheads={card.total_business_overheads}
        />

        <RecoverySummaryMainCard {...card} />

        <RecoverySummaryHelpPanel />
      </div>
    </main>
  );
}