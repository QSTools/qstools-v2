'use client';

import { useBusinessOutcome } from '@/hooks/useBusinessOutcome';
import BusinessOutcomeStatusStrip from '@/components/business-outcome/BusinessOutcomeStatusStrip';
import BusinessOutcomeWaterfall from '@/components/business-outcome/BusinessOutcomeWaterfall';
import BusinessOutcomeMainCard from '@/components/business-outcome/BusinessOutcomeMainCard';
import BusinessOutcomeHelpPanel from '@/components/business-outcome/BusinessOutcomeHelpPanel';

export default function BusinessOutcomePage() {
  const businessOutcome = useBusinessOutcome();

  return (
    <div className="space-y-6 p-6">
      <BusinessOutcomeStatusStrip outcome={businessOutcome} />
      <BusinessOutcomeWaterfall outcome={businessOutcome} />
      <BusinessOutcomeMainCard outcome={businessOutcome} />
      <BusinessOutcomeHelpPanel />
    </div>
  );
}
