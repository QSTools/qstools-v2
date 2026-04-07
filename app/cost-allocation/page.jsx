"use client";

import useCostAllocation from "@/hooks/useCostAllocation";
import CostAllocationStatusStrip from "@/components/cost-allocation/CostAllocationStatusStrip";
import CostAllocationMainCard from "@/components/cost-allocation/CostAllocationMainCard";
import CostAllocationHelpPanel from "@/components/cost-allocation/CostAllocationHelpPanel";

export default function CostAllocationPage() {
  const {
    status,
    card,
    actions,
  } = useCostAllocation();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <CostAllocationStatusStrip {...status} />
        <CostAllocationMainCard {...card} {...actions} />
        <CostAllocationHelpPanel />
      </div>
    </main>
  );
}