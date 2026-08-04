"use client";

import useMaterials from "@/hooks/useMaterials";
import NextStepFooter from "@/components/navigation/NextStepFooter";
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
        <NextStepFooter
          nextHref="/rates/square-metre"
          nextLabel="Next: Square Metre Rate"
        />
      </div>
    </main>
  );
}
