"use client";
import { useState } from "react";

import useBusinessOutcomeTruth from "@/hooks/useBusinessOutcomeTruth";
import useBusinessOutcomeLabourRecovery from "@/hooks/useBusinessOutcomeLabourRecovery";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import BusinessOutcomeViewSwitcher from "@/components/navigation/BusinessOutcomeViewSwitcher";
import BusinessOutcomeTruthStatusStrip from "@/components/business-outcome-truth/BusinessOutcomeTruthStatusStrip";

import BusinessOutcomeTruthLabourRecoveryCard from "@/components/business-outcome-truth/BusinessOutcomeTruthLabourRecoveryCard";
import useBusinessOutcomeRevenueSplit from "@/hooks/useBusinessOutcomeRevenueSplit";
import BusinessOutcomeTruthRevenueSplitCard from "@/components/business-outcome-truth/BusinessOutcomeTruthRevenueSplitCard";
import useBusinessOutcomeWaterfall from "@/hooks/useBusinessOutcomeWaterfall";
import useBusinessOutcomePerSourceRevenue from "@/hooks/useBusinessOutcomePerSourceRevenue";
import { selectBusinessOutcomePerSourceRevenue } from "@/lib/selectors/business-outcome/businessOutcomePerSourceRevenueSelectors";
import BusinessOutcomePerSourceRevenueCard from "@/components/business-outcome-truth/BusinessOutcomePerSourceRevenueCard";
import { selectBusinessOutcomeWaterfall } from "@/lib/selectors/business-outcome/businessOutcomeWaterfallSelectors";

import BusinessOutcomeTruthWarningsPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthWarningsPanel";
import BusinessOutcomeTruthHelpPanel from "@/components/business-outcome-truth/BusinessOutcomeTruthHelpPanel";
import BusinessOutcomeNetProfitBuildUp from "@/components/business-outcome-truth/BusinessOutcomeNetProfitBuildUp";
import CollapsibleSection from "@/components/common/CollapsibleSection";

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
  const [smoothing_mode, set_smoothing_mode] = useState("smoothed");
  const { output_contract } = useBusinessOutcomeTruth();
  const labour_recovery = useBusinessOutcomeLabourRecovery();
  const revenue_split = useBusinessOutcomeRevenueSplit();
  const waterfall_calculation = useBusinessOutcomeWaterfall();
  const waterfall = selectBusinessOutcomeWaterfall(waterfall_calculation);
  const per_source_calculation = useBusinessOutcomePerSourceRevenue();
  const per_source = selectBusinessOutcomePerSourceRevenue(per_source_calculation);

  return (
    <div className="space-y-6 p-6">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business Outcome</div>
        <div className="ui-display">Is your business actually working?</div>
      </div>
      <BusinessOutcomeViewSwitcher />
      <BusinessOutcomeTruthStatusStrip output_contract={output_contract} />
      <BusinessOutcomeTruthRevenueSplitCard revenue_split={revenue_split} />
      <div className="business-outcome-view-toggle" aria-label="Smoothing" style={{ marginBottom: "0.25rem" }}>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${smoothing_mode === "smoothed" ? "active" : ""}`}
          onClick={() => set_smoothing_mode("smoothed")}
        >
          How the Business Runs
        </button>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${smoothing_mode === "naive" ? "active" : ""}`}
          onClick={() => set_smoothing_mode("naive")}
        >
          Each Part On Its Own
        </button>
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: "0 0 0.75rem", lineHeight: "1.5" }}>
        <strong style={{ color: "var(--text-primary)" }}>How the Business Runs</strong> answers: is the business
        making money overall, and who&apos;s carrying who? <strong style={{ color: "var(--text-primary)" }}>Each
        Part On Its Own</strong> answers: which parts are actually profitable on their own, with no help from
        anywhere else. Same total either way - this only changes which part gets the credit or the blame.
      </p>

      <BusinessOutcomePerSourceRevenueCard
        per_source={per_source}
        output_contract={output_contract}
        labour_recovery={labour_recovery}
        smoothing_mode={smoothing_mode}
      />

      <CollapsibleSection title="How Net Profit Is Actually Built" defaultOpen={false}>
        <BusinessOutcomeNetProfitBuildUp smoothing_mode={smoothing_mode} />
      </CollapsibleSection>
      <NextStepFooter nextHref="/quote-checker" nextLabel="Next: Quote Checker" />
    </div>
  );
}

