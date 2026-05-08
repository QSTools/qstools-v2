"use client";

import useRecoverySummary from "@/hooks/useRecoverySummary";
import useCostAllocation from "@/hooks/useCostAllocation";
import useRecoveryOutcome from "@/hooks/useRecoveryOutcome";

import RecoveryOutcomeStatusStrip from "@/components/recovery-outcome/RecoveryOutcomeStatusStrip";
import RecoveryOutcomeMainCard from "@/components/recovery-outcome/RecoveryOutcomeMainCard";
import RecoveryOutcomeHelpPanel from "@/components/recovery-outcome/RecoveryOutcomeHelpPanel";

export default function RecoveryOutcomePage() {
  const recovery_summary = useRecoverySummary();

  const recovery_summary_contract =
    recovery_summary?.output_contract ?? recovery_summary?.outputs ?? {};

  const cost_allocation = useCostAllocation({
    recovery_summary: recovery_summary_contract,
  });

  const cost_allocation_contract =
    cost_allocation?.output_contract ?? cost_allocation?.outputs ?? {};

  const { status, card } = useRecoveryOutcome({
    recovery_summary: recovery_summary_contract,
    cost_allocation: cost_allocation_contract,
  });

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