"use client";

import useLabour from "@/hooks/useLabour";
import useEmployeeOverheads from "@/hooks/useEmployeeOverheads";
import useAssets from "@/hooks/useAssets";
import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import useCostSummary from "@/hooks/useCostSummary";
import useRecoverySummary from "@/hooks/useRecoverySummary";

import RecoverySummaryStatusStrip from "@/components/recovery-summary/RecoverySummaryStatusStrip";
import RecoverySummaryMainCard from "@/components/recovery-summary/RecoverySummaryMainCard";
import RecoverySummaryHelpPanel from "@/components/recovery-summary/RecoverySummaryHelpPanel";

export default function RecoverySummaryPage() {
  const labour = useLabour();
  const employee_overheads = useEmployeeOverheads();
  const assets = useAssets();
  const general_overheads = useGeneralOverheads();

  const cost_summary = useCostSummary({
    labour,
    employee_overheads,
    assets,
    general_overheads,
  });

  const { status, card } = useRecoverySummary({
    cost_summary: cost_summary.output_contract ?? {},
  });

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