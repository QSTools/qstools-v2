"use client";

import { useEffect, useState } from "react";

import useCostAllocation from "@/hooks/useCostAllocation";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import CostAllocationMainCard from "@/components/cost-allocation/CostAllocationMainCard";
import CostAllocationHelpPanel from "@/components/cost-allocation/CostAllocationHelpPanel";

export default function CostAllocationPage() {
  const [is_client_ready, set_is_client_ready] = useState(false);
  const { card, actions } = useCostAllocation();

  useEffect(() => {
    set_is_client_ready(true);
  }, []);

  if (!is_client_ready) {
    return (
      <main className="ui-page cost-allocation-page">
        <div className="ui-page-stack">
          <section className="ui-section">
            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Cost allocation</div>
                <div className="ui-display">Loading allocation model...</div>
                <div className="ui-help">
                  Preparing the operating groups and source-pool checks.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page cost-allocation-page">
      <div className="ui-page-stack">
        <CostAllocationMainCard {...card} {...actions} />

        <CostAllocationHelpPanel />
        <NextStepFooter
          nextHref="/recovery-summary"
          nextLabel="Next: Recovery Summary"
        />
      </div>
    </main>
  );
}
