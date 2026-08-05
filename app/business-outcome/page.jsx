"use client";

import useBusinessOutcomeTruth from "@/hooks/useBusinessOutcomeTruth";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import BusinessOutcomeViewSwitcher from "@/components/navigation/BusinessOutcomeViewSwitcher";
import BusinessOutcomeTruthStatusStrip from "@/components/business-outcome-truth/BusinessOutcomeTruthStatusStrip";
import BusinessOutcomeTruthSummaryCard from "@/components/business-outcome-truth/BusinessOutcomeTruthSummaryCard";
import BusinessOutcomeTruthWarningsPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthWarningsPanel";
import BusinessOutcomeTruthHelpPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthHelpPanel";

// STAGE 3 NOTE (Business Outcome dual-view rebuild, 2026-08-05):
// This is the new v5.0 truth-chain Business Outcome page, built on top of
// the Stage 2 useBusinessOutcomeTruth hook. It answers "is this business
// commercially viable?" using real revenue/COG/cost-burden data. It is
// distinct from, and does not share state with, the preserved
// Recovery & Rate Justification page at /recovery-outcome.
export default function BusinessOutcomePage() {
  const { output_contract } = useBusinessOutcomeTruth();

  return (
    <div className="space-y-6 p-6">
      <BusinessOutcomeViewSwitcher />
      <BusinessOutcomeTruthStatusStrip output_contract={output_contract} />
      <BusinessOutcomeTruthSummaryCard output_contract={output_contract} />
      <BusinessOutcomeTruthWarningsPanel output_contract={output_contract} />
      <BusinessOutcomeTruthHelpPanel />
      <NextStepFooter nextHref="/quote-checker" nextLabel="Next: Quote Checker" />
    </div>
  );
}
