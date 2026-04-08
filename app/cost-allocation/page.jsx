"use client";

import useCostAllocation from "@/hooks/useCostAllocation";
import CostAllocationNoticeBanner from "@/components/cost-allocation/CostAllocationNoticeBanner";
import CostAllocationStatusStrip from "@/components/cost-allocation/CostAllocationStatusStrip";
import CostAllocationMainCard from "@/components/cost-allocation/CostAllocationMainCard";
import CostAllocationHelpPanel from "@/components/cost-allocation/CostAllocationHelpPanel";

export default function CostAllocationPage() {
  const { status, card, actions } = useCostAllocation();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <CostAllocationNoticeBanner
          active_profile_name={card?.profile?.active_profile_name}
        />
        <CostAllocationStatusStrip {...status} />
        <CostAllocationMainCard {...card} {...actions} />
        <CostAllocationHelpPanel />
      </div>
    </main>
  );
}