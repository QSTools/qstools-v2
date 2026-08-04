"use client";

import { useEffect, useState } from "react";

import useRecoverySummary from "@/hooks/useRecoverySummary";

import NextStepFooter from "@/components/navigation/NextStepFooter";
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
        <RecoverySummaryMainCard
          {...card}
          recovery_ready={status.recovery_ready}
          warning_count={status.warning_count}
          warning_items={status.warning_items}
        />

        <RecoverySummaryHelpPanel />
        <NextStepFooter
          nextHref="/rate-builder"
          nextLabel="Next: Rate Builder"
        />
      </div>
    </main>
  );
}
