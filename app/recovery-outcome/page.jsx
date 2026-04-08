"use client";

import useRecoveryOutcome from "@/hooks/useRecoveryOutcome";
import RecoveryOutcomeStatusStrip from "@/components/recovery-outcome/RecoveryOutcomeStatusStrip";
import RecoveryOutcomeMainCard from "@/components/recovery-outcome/RecoveryOutcomeMainCard";
import RecoveryOutcomeHelpPanel from "@/components/recovery-outcome/RecoveryOutcomeHelpPanel";

export default function RecoveryOutcomePage() {
  const { status, card } = useRecoveryOutcome();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <RecoveryOutcomeStatusStrip {...status} />
        <RecoveryOutcomeMainCard {...card} />
        <RecoveryOutcomeHelpPanel />
      </div>
    </main>
  );
}