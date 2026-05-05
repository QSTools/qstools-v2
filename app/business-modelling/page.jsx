"use client";

import { useEffect, useState } from "react";
import useBusinessModelling from "@/hooks/useBusinessModelling";
import BusinessModellingStatusStrip from "@/components/business-modelling/BusinessModellingStatusStrip";
import BusinessModellingBaselineCard from "@/components/business-modelling/BusinessModellingBaselineCard";
import BusinessModellingScenarioControls from "@/components/business-modelling/BusinessModellingScenarioControls";
import BusinessModellingScenarioResult from "@/components/business-modelling/BusinessModellingScenarioResult";
import BusinessModellingDeltaCard from "@/components/business-modelling/BusinessModellingDeltaCard";
import BusinessModellingHelpPanel from "@/components/business-modelling/BusinessModellingHelpPanel";

export default function BusinessModellingPage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const {
    status,
    baseline,
    scenario_controls,
    scenario_result,
    delta,
    selected_model_type,
    updateScenarioField,
    refreshBaseline,
    resetScenarioToBaseline,
    selectModel,
  } = useBusinessModelling();

  // Before mount, render stable placeholder to avoid hydration mismatch
  if (!hasMounted) {
    return (
      <main className="ui-page">
        <div className="ui-page-stack">
          <section className="ui-section">
            <div className="ui-panel ui-stack-sm">
              <div className="ui-kicker">Business Modelling</div>
              <div className="ui-card-title-sm">Controlled scenario benchmark</div>
              <p className="ui-help">Loading Business Modelling...</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <BusinessModellingStatusStrip
          baseline_date={status.baseline_date}
          selected_model_name={status.selected_model_name}
          selected_model_type={status.selected_model_type}
          selected_model_trust_state={status.selected_model_trust_state}
          selected_scenario_status={status.selected_scenario_status}
          selected_scenario_modified={status.selected_scenario_modified}
          annual_delta={status.annual_delta}
          per_hour_delta={status.per_hour_delta}
          modelling_ready={status.modelling_ready}
          modelling_warnings={status.modelling_warnings}
          selectModel={selectModel}
          selected_model_type_value={selected_model_type}
        />

        <BusinessModellingBaselineCard
          total_revenue={baseline.total_revenue}
          total_direct_costs={baseline.total_direct_costs}
          margin_pool={baseline.margin_pool}
          total_cost_burden={baseline.total_cost_burden}
          net_position={baseline.net_position}
          total_productive_output={baseline.total_productive_output}
          required_recovery_rate={baseline.required_recovery_rate}
          current_margin_per_productive_hour={baseline.current_margin_per_productive_hour}
          recovery_gap_per_hour={baseline.recovery_gap_per_hour}
          model_trust_state={baseline.model_trust_state}
          onRefreshBaseline={refreshBaseline}
        />

        <BusinessModellingScenarioControls
          scenario_controls={scenario_controls}
          selected_model_type={selected_model_type}
          updateScenarioField={updateScenarioField}
          resetScenarioToBaseline={resetScenarioToBaseline}
        />

        <BusinessModellingScenarioResult scenario_result={scenario_result} />

        <BusinessModellingDeltaCard delta={delta} />

        <BusinessModellingHelpPanel />
      </div>
    </main>
  );
}
