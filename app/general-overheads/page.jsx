"use client";

import useGeneralOverheads from "@/hooks/useGeneralOverheads";
import GeneralOverheadStatusStrip from "@/components/general-overheads/GeneralOverheadStatusStrip";
import GeneralOverheadMainCard from "@/components/general-overheads/GeneralOverheadMainCard";
import GeneralOverheadHelpPanel from "@/components/general-overheads/GeneralOverheadHelpPanel";

export default function GeneralOverheadsPage() {
  const { status, card } = useGeneralOverheads();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <GeneralOverheadStatusStrip {...status} />
        <GeneralOverheadMainCard {...card} />
        <GeneralOverheadHelpPanel />
      </div>
    </main>
  );
}