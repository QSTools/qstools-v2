"use client";

import { useEffect, useState } from "react";

import useRecoveryOutcome from "@/hooks/useRecoveryOutcome";
import RecoveryOutcomeStatusStrip from "@/components/recovery-outcome/RecoveryOutcomeStatusStrip";
import RecoveryOutcomeMainCard from "@/components/recovery-outcome/RecoveryOutcomeMainCard";
import RecoveryOutcomeHelpPanel from "@/components/recovery-outcome/RecoveryOutcomeHelpPanel";

export default function RecoveryOutcomePage() {
  const [is_mounted, set_is_mounted] = useState(false);

  useEffect(() => {
    set_is_mounted(true);
  }, []);

  const { status, card } = useRecoveryOutcome();

  if (!is_mounted) {
    return null;
  }

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