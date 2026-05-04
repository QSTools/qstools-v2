"use client";

import { useEffect, useState } from "react";

import useLabour from "@/hooks/useLabour";
import useAssets from "@/hooks/useAssets";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import useCostSummary from "@/hooks/useCostSummary";
import useRecoverySummary from "@/hooks/useRecoverySummary";

import RecoverySummaryStatusStrip from "@/components/recovery-summary/RecoverySummaryStatusStrip";
import RecoverySummaryMainCard from "@/components/recovery-summary/RecoverySummaryMainCard";
import RecoverySummaryHelpPanel from "@/components/recovery-summary/RecoverySummaryHelpPanel";

export default function RecoverySummaryPage() {
  const [is_mounted, set_is_mounted] = useState(false);

  useEffect(() => {
    set_is_mounted(true);
  }, []);

  const labour = useLabour();
  const assets = useAssets();
  const general_overheads = useGeneralOverheads();

  const cost_summary = useCostSummary({
    labour,
    assets,
    general_overheads,
  });

  const { status, card } = useRecoverySummary({
    cost_summary: cost_summary.output_contract ?? {},
  });

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
