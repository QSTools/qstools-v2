"use client";

import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import ProfitAndLossStatusStrip from "@/components/p-and-l/ProfitAndLossStatusStrip";
import ProfitAndLossMainCard from "@/components/p-and-l/ProfitAndLossMainCard";
import ProfitAndLossHelpPanel from "@/components/p-and-l/ProfitAndLossHelpPanel";

export default function ProfitAndLossPage() {
  const { status, card } = useProfitAndLoss();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <ProfitAndLossStatusStrip {...status} />
        <ProfitAndLossMainCard {...card} />
        <ProfitAndLossHelpPanel />
      </div>
    </main>
  );
}