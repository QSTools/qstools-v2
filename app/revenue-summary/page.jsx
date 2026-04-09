"use client";

import useRevenueSummary from "@/hooks/useRevenueSummary";
import RevenueSummaryNoticeBanner from "@/components/revenue-summary/RevenueSummaryNoticeBanner";
import RevenueSummaryStatusStrip from "@/components/revenue-summary/RevenueSummaryStatusStrip";
import RevenueSummaryMainCard from "@/components/revenue-summary/RevenueSummaryMainCard";
import RevenueSummarySummaryCard from "@/components/revenue-summary/RevenueSummarySummaryCard";
import RevenueSummaryHelpPanel from "@/components/revenue-summary/RevenueSummaryHelpPanel";

export default function RevenueSummaryPage() {
  const { status, card, summary } = useRevenueSummary();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <RevenueSummaryNoticeBanner />
        <RevenueSummaryStatusStrip {...status} />
        <RevenueSummaryMainCard {...card} />
        <RevenueSummarySummaryCard {...summary} />
        <RevenueSummaryHelpPanel />
      </div>
    </main>
  );
}