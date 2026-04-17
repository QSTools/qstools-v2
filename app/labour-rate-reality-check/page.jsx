"use client";

import useLabourRateRealityCheck from "@/hooks/useLabourRateRealityCheck";
import LabourRateRealityCheckStatusStrip from "@/components/labour-rate-reality-check/LabourRateRealityCheckStatusStrip";
import LabourRateRealityCheckMainCard from "@/components/labour-rate-reality-check/LabourRateRealityCheckMainCard";
import LabourRateRealityCheckHelpPanel from "@/components/labour-rate-reality-check/LabourRateRealityCheckHelpPanel";

export default function LabourRateRealityCheckPage() {
  const { status, card } = useLabourRateRealityCheck();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <LabourRateRealityCheckStatusStrip {...status} />
        <LabourRateRealityCheckMainCard {...card} />
        <LabourRateRealityCheckHelpPanel />
      </div>
    </main>
  );
}