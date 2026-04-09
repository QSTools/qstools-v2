"use client";

import useRecoverySummary from "@/hooks/useRecoverySummary";
import useCostAllocation from "@/hooks/useCostAllocation";
import useRecoveryOutcome from "@/hooks/useRecoveryOutcome";

import RecoveryOutcomeStatusStrip from "@/components/recovery-outcome/RecoveryOutcomeStatusStrip";
import RecoveryOutcomeMainCard from "@/components/recovery-outcome/RecoveryOutcomeMainCard";
import RecoveryOutcomeHelpPanel from "@/components/recovery-outcome/RecoveryOutcomeHelpPanel";

export default function RecoveryOutcomePage() {
  const recovery_summary = useRecoverySummary();

  const cost_allocation = useCostAllocation({
    recovery_summary:
      recovery_summary?.output_contract ?? recovery_summary?.outputs ?? {},
  });

  /*
    Safe placeholders for v1.1 wiring.

    Replace these with real hooks once Materials and Rate Models exist, e.g.
    const materials = useMaterials();
    const square_metre_rate = useSquareMetreRate();
    const volume_rate = useVolumeRate();

    This keeps Recovery Outcome buildable now without breaking the page.
  */
  const materials = {
    output_contract: {
      annual_material_cost: 0,
      annual_material_revenue: 0,
      material_margin_annual: 0,
      material_margin_percent: 0,
      warnings: [],
    },
  };

  const rate_models = {
    output_contract: {
      models: [],
      warnings: [],
    },
  };

  const { status, card } = useRecoveryOutcome({
    recovery_summary:
      recovery_summary?.output_contract ?? recovery_summary?.outputs ?? {},
    cost_allocation:
      cost_allocation?.output_contract ?? cost_allocation?.outputs ?? {},
    materials: materials?.output_contract ?? {},
    rate_models: rate_models?.output_contract ?? {},
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