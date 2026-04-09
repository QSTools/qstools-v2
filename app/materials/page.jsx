"use client";

import useMaterials from "@/hooks/useMaterials";
import MaterialsStatusStrip from "@/components/materials/MaterialsStatusStrip";
import MaterialsMainCard from "@/components/materials/MaterialsMainCard";
import MaterialsSummaryCard from "@/components/materials/MaterialsSummaryCard";
import MaterialsHelpPanel from "@/components/materials/MaterialsHelpPanel";

export default function MaterialsPage() {
  const { status, card, summary } = useMaterials();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <MaterialsStatusStrip {...status} />
        <MaterialsMainCard {...card} />
        <MaterialsSummaryCard {...summary} />
        <MaterialsHelpPanel />
      </div>
    </main>
  );
}