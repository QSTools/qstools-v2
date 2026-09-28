"use client";
import { useEffect, useState } from "react";
import {
  readNonProductiveCostPolicy,
  writeNonProductiveCostPolicy,
  NON_PRODUCTIVE_POLICY_CHANGED_EVENT,
} from "@/lib/storage/businessOutcomeNonProductivePolicyStorage";

// Business-wide setting for how a MIXED working unit's own non-productive
// cost (e.g. a shared vehicle) is treated. Pure-support units always spread
// and are not affected. Writes storage and broadcasts an event so every
// instance of useBusinessOutcomePerSourceRevenue re-reads it.
export default function NonProductivePolicyToggle() {
  const [policy, set_policy] = useState("charge_to_self");

  useEffect(() => {
    const reload_policy = () =>
      set_policy(readNonProductiveCostPolicy().mixed_unit_non_productive_policy);
    reload_policy();
    window.addEventListener(NON_PRODUCTIVE_POLICY_CHANGED_EVENT, reload_policy);
    return () => window.removeEventListener(NON_PRODUCTIVE_POLICY_CHANGED_EVENT, reload_policy);
  }, []);

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Support cost in mixed working units</div>
      <div className="business-outcome-view-toggle" aria-label="Non-productive cost policy">
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${policy === "charge_to_self" ? "active" : ""}`}
          onClick={() => writeNonProductiveCostPolicy("charge_to_self")}
        >
          Charge to that unit
        </button>
        <button
          type="button"
          className={`business-outcome-view-toggle-btn ${policy === "spread_as_overhead" ? "active" : ""}`}
          onClick={() => writeNonProductiveCostPolicy("spread_as_overhead")}
        >
          Spread across all units
        </button>
      </div>
      <p className="ui-help" style={{ margin: 0 }}>
        Applies only to a working unit that has both billable work and its own support cost (for example a
        shared vehicle). Charge to that unit: its own rate must cover it. Spread across all units: it is
        shared with pure-support cost, weighted by labour cost. Units with no billable work always spread.
      </p>
    </div>
  );
}