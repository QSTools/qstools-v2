"use client";

import CostSummaryStatusStrip from "@/components/cost-summary/CostSummaryStatusStrip";
import CostSummaryCard from "@/components/cost-summary/CostSummaryCard";
import CostSummaryHelpPanel from "@/components/cost-summary/CostSummaryHelpPanel";
import useCostSummary from "@/hooks/useCostSummary";

export default function CostSummaryPage() {
  const labour_profiles = [];
  const employee_overheads = [];
  const assets = [];
  const general_overheads = null;
  const cost_allocation = null;

  const { status, card } = useCostSummary({
    labour_profiles,
    employee_overheads,
    assets,
    general_overheads,
    cost_allocation,
  });

  return (
    <main className="space-y-6">
      <CostSummaryStatusStrip {...status} />
      <CostSummaryCard {...card} />
      <CostSummaryHelpPanel />
    </main>
  );
}