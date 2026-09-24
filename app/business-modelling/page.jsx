"use client";

import { useEffect, useState } from "react";
import useBusinessModelling from "@/hooks/useBusinessModelling";
import NextStepFooter from "@/components/navigation/NextStepFooter";
import BusinessModellingStatusStrip from "@/components/business-modelling/BusinessModellingStatusStrip";
import BusinessModellingBaselineCard from "@/components/business-modelling/BusinessModellingBaselineCard";
import BusinessModellingScenarioControls from "@/components/business-modelling/BusinessModellingScenarioControls";
import BusinessModellingScenarioResult from "@/components/business-modelling/BusinessModellingScenarioResult";
import BusinessModellingDeltaCard from "@/components/business-modelling/BusinessModellingDeltaCard";
import BusinessModellingHelpPanel from "@/components/business-modelling/BusinessModellingHelpPanel";
import CollapsibleSection from "@/components/common/CollapsibleSection";
import BusinessModellingLeverCard from "@/components/business-modelling/BusinessModellingLeverCard";
import BusinessModellingRealStateCard from "@/components/business-modelling/BusinessModellingRealStateCard";
import useBusinessModellingScenario from "@/hooks/useBusinessModellingScenario";
import BusinessModellingScenarioSection from "@/components/business-modelling/BusinessModellingScenarioSection";
import useBusinessModellingLevers from "@/hooks/useBusinessModellingLevers";
import BusinessModellingLeverPanel from "@/components/business-modelling/BusinessModellingLeverPanel";

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
    live_headline,
    breakeven_summary,
    lever_rows,
    rate_target_by_group_id,
    updateLeverTargetRate,
    materials_lever_row,
    materials_markup_percent,
    updateMaterialsMarkupPercent,
    proportional_suggestions,
    applyProportionalSuggestions,
    per_source,
    modelled_per_source,
    unsupported_lever_group_ids,
  } = useBusinessModelling();

  const {
    current_baseline,
    downside,
    upside_scenario,
    baseline_history,
    lockNewBaseline,
    revertToBaseline,
    saveUpsideScenario,
    clearUpsideScenario,
  } = useBusinessModellingScenario(per_source);

  // v6.0 redesign (2026-09-24) - additive lever model, View A achieved base.
  const bm_levers = useBusinessModellingLevers(per_source);

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
        <BusinessModellingRealStateCard per_source={per_source} />

        <BusinessModellingLeverPanel model={bm_levers} />

        <BusinessModellingLeverCard
          headline={live_headline}
          real_headline={per_source?.headline_real_capacity}
          breakeven_summary={breakeven_summary}
          lever_rows={lever_rows}
          rate_target_by_group_id={rate_target_by_group_id}
          onTargetRateChange={updateLeverTargetRate}
          proportional_suggestions={proportional_suggestions}
          onApplyProportional={applyProportionalSuggestions}
          materials_lever_row={materials_lever_row}
          materials_markup_percent={materials_markup_percent}
          onMaterialsMarkupChange={updateMaterialsMarkupPercent}
        />

        {/* TEMPORARY DEBUG (2026-09-17) - proves the real-engine-rerun
            override mechanism works end-to-end against real data.
            Remove once confirmed and a real display is decided. */}
        <div className="ui-panel ui-stack-sm" style={{ border: "2px dashed orange" }}>
          <div className="ui-kicker">DEBUG: real engine rerun check</div>
          <div className="ui-row-between">
            <span>Real total net profit - View A (headline_real_capacity)</span>
            <strong>{per_source?.headline_real_capacity?.total_net_profit ?? "n/a"}</strong>
          </div>
          <div className="ui-row-between">
            <span>Modelled total net profit - View A (headline_real_capacity)</span>
            <strong>{modelled_per_source?.headline_real_capacity?.total_net_profit ?? "n/a"}</strong>
          </div>
          {/* Added 2026-09-18 - View B is the only cascade where materials
              has genuinely independent, lever-movable economics (View
              A's materials is a residual, nothing for the markup
              override to affect). These two rows are the real proof: if
              the materials lever is genuinely wired correctly, changing
              markup% should move the View B modelled figure while the
              View A figures above stay comparatively unaffected by that
              specific lever (labour/asset rate levers correctly move
              both, since both views share the same labour/asset input). */}
          <div className="ui-row-between">
            <span>Real total net profit - View B (view_b_headline_real_capacity)</span>
            <strong>{per_source?.view_b_headline_real_capacity?.total_net_profit ?? "n/a"}</strong>
          </div>
          <div className="ui-row-between">
            <span>Modelled total net profit - View B (view_b_headline_real_capacity)</span>
            <strong>{modelled_per_source?.view_b_headline_real_capacity?.total_net_profit ?? "n/a"}</strong>
          </div>
          <div className="ui-row-between">
            <span>Unsupported working units (ambiguous lever)</span>
            <strong>{JSON.stringify(unsupported_lever_group_ids ?? [])}</strong>
          </div>
        </div>

        <section className="ui-section">
          <div className="ui-panel">
            <BusinessModellingScenarioSection
              per_source={per_source}
              current_baseline={current_baseline}
              downside={downside}
              upside_scenario={upside_scenario}
              baseline_history={baseline_history}
              lockNewBaseline={lockNewBaseline}
              revertToBaseline={revertToBaseline}
              saveUpsideScenario={saveUpsideScenario}
              clearUpsideScenario={clearUpsideScenario}
              current_rate_target_by_group_id={rate_target_by_group_id}
              current_materials_markup_percent={materials_markup_percent}
            />
          </div>
        </section>

        <CollapsibleSection
          title="Previous scenario tools"
          summary="Legacy baseline / upside / downside controls - being replaced"
          defaultOpen={false}
        >
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
        </CollapsibleSection>

        <NextStepFooter
          nextHref="/quote-checker"
          nextLabel="Next: Quote Checker"
        />
      </div>
    </main>
  );
}

