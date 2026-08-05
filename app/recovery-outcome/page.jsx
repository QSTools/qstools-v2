'use client';

import { useBusinessOutcome } from '@/hooks/useBusinessOutcome';
import NextStepFooter from '@/components/navigation/NextStepFooter';
import BusinessOutcomeViewSwitcher from '@/components/navigation/BusinessOutcomeViewSwitcher';
import BusinessOutcomeStatusStrip from '@/components/business-outcome/BusinessOutcomeStatusStrip';
import BusinessOutcomeWaterfall from '@/components/business-outcome/BusinessOutcomeWaterfall';
import BusinessOutcomeMainCard from '@/components/business-outcome/BusinessOutcomeMainCard';
import BusinessOutcomeHelpPanel from '@/components/business-outcome/BusinessOutcomeHelpPanel';

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
export default function RecoveryOutcomePage() {
  const businessOutcome = useBusinessOutcome();

  return (
    <div className="space-y-6 p-6">
      <BusinessOutcomeViewSwitcher />
      <BusinessOutcomeStatusStrip outcome={businessOutcome} />
      <BusinessOutcomeWaterfall outcome={businessOutcome} />
      <BusinessOutcomeMainCard outcome={businessOutcome} />
      <BusinessOutcomeHelpPanel />
      <NextStepFooter nextHref="/quote-engine" nextLabel="Next: Quote Engine" />
    </div>
  );
}
