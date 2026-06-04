"use client";

import useOpeningHours from "@/hooks/useOpeningHours";
import OpeningHoursStatusStrip from "@/components/opening-hours/OpeningHoursStatusStrip";
import OpeningHoursMainCard from "@/components/opening-hours/OpeningHoursMainCard";
import OpeningHoursHelpPanel from "@/components/opening-hours/OpeningHoursHelpPanel";

export default function OpeningHoursPage() {
  const {
    status,
    card,
    actions,
  } = useOpeningHours();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <OpeningHoursStatusStrip {...status} />
        <OpeningHoursMainCard {...card} actions={actions} />
        <OpeningHoursHelpPanel />
      </div>
    </main>
  );
}