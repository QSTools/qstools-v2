"use client";
import { useState } from "react";
import { useBusinessOutcome } from "@/hooks/useBusinessOutcome";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import BusinessOutcomeViewSwitcher from "@/components/navigation/BusinessOutcomeViewSwitcher";
import BusinessOutcomeStatusStrip from "@/components/business-outcome/BusinessOutcomeStatusStrip";
import BusinessOutcomeWaterfall from "@/components/business-outcome/BusinessOutcomeWaterfall";
import BusinessOutcomeMainCard from "@/components/business-outcome/BusinessOutcomeMainCard";
import BusinessOutcomeHelpPanel from "@/components/business-outcome/BusinessOutcomeHelpPanel";
import BusinessOutcomeNetProfitBuildUp from "@/components/business-outcome-truth/BusinessOutcomeNetProfitBuildUp";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import BusinessOutcomeRecoveryNarrative from "@/components/business-outcome/BusinessOutcomeRecoveryNarrative";

// STAGE 1 NOTE (Business Outcome dual-view rebuild, 2026-08-05):
// This page was moved here from app/business-outcome/page.jsx.
// It is the existing, working Recovery & Rate Justification module,
// unchanged in logic, calculation, or data source. Only its route and
// user-facing labels changed. The /business-outcome route is reserved
// for the new v5.0 truth-chain Business Outcome module.
//
// STAGE 3 ADDITION (2026-08-05): added the shared view switcher so users
// can move between this page and the new /business-outcome page. No
// other change - everything below the switcher is identical to Stage 1.
//
// TIDY-UP PASS (this session): added a proper title block matching
// /business-outcome, and wrapped the detail cards in the same
// CollapsibleSection component that page already uses, so this page
// starts collapsed instead of showing everything open at once.
export default function RecoveryOutcomePage() {
  const [smoothing_mode, set_smoothing_mode] = useState("smoothed");
  const businessOutcome = useBusinessOutcome();
  return (
    <div className="space-y-6 p-6">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business Outcome</div>
        <div className="ui-display">How is Net Profit actually built?</div>
      </div>
      <BusinessOutcomeViewSwitcher />
      <BusinessOutcomeStatusStrip outcome={businessOutcome} />
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

      <CollapsibleSection title="Reconstructed P&L" defaultOpen={false}>
        <BusinessOutcomeWaterfall outcome={businessOutcome} />
      </CollapsibleSection>

      <CollapsibleSection title="Where is the pressure?" defaultOpen={false}>
        <BusinessOutcomeMainCard outcome={businessOutcome} />
      </CollapsibleSection>
      <CollapsibleSection title="How Net Profit Is Actually Built" defaultOpen={false}>
        <BusinessOutcomeNetProfitBuildUp smoothing_mode={smoothing_mode} />
      </CollapsibleSection>

      <BusinessOutcomeRecoveryNarrative outcome={businessOutcome} />
      <BusinessOutcomeHelpPanel />
      <NextStepFooter nextHref="/quote-engine" nextLabel="Next: Quote Engine" />
    </div>
  );
}


