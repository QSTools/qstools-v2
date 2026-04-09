"use client";

import useSquareMetreRate from "@/hooks/useSquareMetreRate";
import SquareMetreRateStatusStrip from "@/components/rates/square-metre/SquareMetreRateStatusStrip";
import SquareMetreRateMainCard from "@/components/rates/square-metre/SquareMetreRateMainCard";
import SquareMetreRateSummaryCard from "@/components/rates/square-metre/SquareMetreRateSummaryCard";
import SquareMetreRateHelpPanel from "@/components/rates/square-metre/SquareMetreRateHelpPanel";

export default function SquareMetreRatePage() {
  const { status, card, summary } = useSquareMetreRate();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <SquareMetreRateStatusStrip {...status} />
        <SquareMetreRateMainCard {...card} />
        <SquareMetreRateSummaryCard {...summary} />
        <SquareMetreRateHelpPanel />
      </div>
    </main>
  );
}