"use client";

import { useEffect, useState } from "react";
import useCostAllocation from "@/hooks/useCostAllocation";
import CostAllocationNoticeBanner from "@/components/cost-allocation/CostAllocationNoticeBanner";
import CostAllocationStatusStrip from "@/components/cost-allocation/CostAllocationStatusStrip";
import CostAllocationMainCard from "@/components/cost-allocation/CostAllocationMainCard";
import CostAllocationHelpPanel from "@/components/cost-allocation/CostAllocationHelpPanel";

export default function CostAllocationPage() {
  const [is_client_ready, set_is_client_ready] = useState(false);
  const { status, card, actions } = useCostAllocation();

  useEffect(() => {
    set_is_client_ready(true);
  }, []);

  if (!is_client_ready) {
    return (
      <main className="ui-page">
        <div className="ui-page-stack">
          <section className="ui-section">
            <div className="ui-panel">
              <div className="ui-stack-sm">
                <div className="ui-kicker">Cost allocation</div>
                <div className="ui-display">Loading allocation model...</div>
                <div className="ui-help">
                  Preparing the recovery plan and structure summary.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <CostAllocationNoticeBanner
          active_profile_name={card?.profile?.active_profile_name}
        />
        <CostAllocationStatusStrip {...status} />
        <CostAllocationMainCard {...card} {...actions} />
        <CostAllocationHelpPanel />
      </div>
    </main>
  );
}
