"use client";

import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import ProfitAndLossStatusStrip from "@/components/p-and-l/ProfitAndLossStatusStrip";
import ProfitAndLossMainCard from "@/components/p-and-l/ProfitAndLossMainCard";
import ProfitAndLossSummaryCard from "@/components/p-and-l/ProfitAndLossSummaryCard";
import ProfitAndLossProfilesCard from "@/components/p-and-l/ProfitAndLossProfilesCard";
import ProfitAndLossHelpPanel from "@/components/p-and-l/ProfitAndLossHelpPanel";

export default function ProfitAndLossPage() {
  const { status, card, summary, profiles, on_load, on_delete } =
    useProfitAndLoss();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <ProfitAndLossStatusStrip {...status} />
        <ProfitAndLossMainCard {...card} />
        <ProfitAndLossSummaryCard {...summary} />

        <ProfitAndLossProfilesCard
          profiles={profiles}
          on_load={on_load}
          on_delete={on_delete}
        />

        <ProfitAndLossHelpPanel />
      </div>
    </main>
  );
}