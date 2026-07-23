"use client";

import useRecoverySummary from "@/hooks/useRecoverySummary";
import useCostAllocation from "@/hooks/useCostAllocation";
import useBusinessOutcome from "@/hooks/useBusinessOutcome";

import BusinessOutcomeStatusStrip from "@/components/business-outcome/BusinessOutcomeStatusStrip";
import BusinessOutcomeMainCard from "@/components/business-outcome/BusinessOutcomeMainCard";
import BusinessOutcomeHelpPanel from "@/components/business-outcome/BusinessOutcomeHelpPanel";

export default function BusinessOutcomePage() {
  const recovery_summary = useRecoverySummary();

  const recovery_summary_contract =
    recovery_summary?.output_contract ?? recovery_summary?.outputs ?? {};

  const cost_allocation = useCostAllocation({
    recovery_summary: recovery_summary_contract,
  });

  const cost_allocation_contract =
    cost_allocation?.output_contract ?? cost_allocation?.outputs ?? {};

  const { status, card } = useBusinessOutcome({
    recovery_summary: recovery_summary_contract,
    cost_allocation: cost_allocation_contract,
  });

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <BusinessOutcomeStatusStrip {...status} />
        <BusinessOutcomeMainCard {...card} />
        <BusinessOutcomeHelpPanel />
      </div>
    </main>
  );
}
