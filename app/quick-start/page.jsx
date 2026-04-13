"use client";

import useQuickStart from "@/hooks/useQuickStart";
import QuickStartMainCard from "@/components/quick-start/QuickStartMainCard";

export default function QuickStartPage() {
  const { card } = useQuickStart();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <QuickStartMainCard {...card} />
      </div>
    </main>
  );
}