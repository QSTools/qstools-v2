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
        <RecoverySummaryStatusStrip {...status} />
        <RecoverySummaryMainCard {...card} />
        <RecoverySummaryHelpPanel />
      </div>
    </main>
  );
}
