"use client";

import useBusinessOutcomeTruth from "@/hooks/useBusinessOutcomeTruth";
import useBusinessOutcomeLabourRecovery from "@/hooks/useBusinessOutcomeLabourRecovery";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import BusinessOutcomeViewSwitcher from "@/components/navigation/BusinessOutcomeViewSwitcher";
import BusinessOutcomeTruthStatusStrip from "@/components/business-outcome-truth/BusinessOutcomeTruthStatusStrip";
import BusinessOutcomeTruthSummaryCard from "@/components/business-outcome-truth/BusinessOutcomeTruthSummaryCard";
import BusinessOutcomeTruthLabourRecoveryCard from "@/components/business-outcome-truth/BusinessOutcomeTruthLabourRecoveryCard";
import useBusinessOutcomeRevenueSplit from "@/hooks/useBusinessOutcomeRevenueSplit";
import BusinessOutcomeTruthRevenueSplitCard from "@/components/business-outcome-truth/BusinessOutcomeTruthRevenueSplitCard";
import useBusinessOutcomeWaterfall from "@/hooks/useBusinessOutcomeWaterfall";
import { selectBusinessOutcomeWaterfall } from "@/lib/selectors/business-outcome/businessOutcomeWaterfallSelectors";
import BusinessOutcomeWaterfallCard from "@/components/business-outcome-truth/BusinessOutcomeWaterfallCard";
import BusinessOutcomeTruthWarningsPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthWarningsPanel";
import BusinessOutcomeTruthHelpPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthHelpPanel";

// STAGE 3 NOTE (Business Outcome dual-view rebuild, 2026-08-05):
// This is the new v5.0 truth-chain Business Outcome page, built on top of
// the Stage 2 useBusinessOutcomeTruth hook. It answers "is this business
// commercially viable?" using real revenue/COG/cost-burden data. It is
// distinct from, and does not share state with, the preserved
// Recovery & Rate Justification page at /recovery-outcome.
//
// STAGE 4 ADDITION (2026-08-11): added the labour recovery breakdown, via
// the separate useBusinessOutcomeLabourRecovery hook. This is additive only
// - it does not modify useBusinessOutcomeTruth.js or its output_contract.
// It compares real cost per labour source (Cost Allocation) against the
// real saved charge-out rate for that source (Rate Builder).
export default function BusinessOutcomePage() {
  const { output_contract } = useBusinessOutcomeTruth();
  const labour_recovery = useBusinessOutcomeLabourRecovery();
  const revenue_split = useBusinessOutcomeRevenueSplit();
  const waterfall_calculation = useBusinessOutcomeWaterfall();
  const waterfall = selectBusinessOutcomeWaterfall(waterfall_calculation);

  return (
    <div className="space-y-6 p-6">
      <BusinessOutcomeViewSwitcher />
      <BusinessOutcomeTruthStatusStrip output_contract={output_contract} />
      <BusinessOutcomeTruthSummaryCard output_contract={output_contract} />
      <BusinessOutcomeTruthRevenueSplitCard revenue_split={revenue_split} />
      <BusinessOutcomeWaterfallCard waterfall={waterfall} />
      <BusinessOutcomeTruthLabourRecoveryCard labour_recovery={labour_recovery} />
      <BusinessOutcomeTruthWarningsPanel output_contract={output_contract} />
      <BusinessOutcomeTruthHelpPanel />
      <NextStepFooter nextHref="/quote-checker" nextLabel="Next: Quote Checker" />
    </div>
  );
}
