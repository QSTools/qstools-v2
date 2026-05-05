"use client";

import { useEffect, useMemo, useState } from "react";

import useBusinessSummary from "@/hooks/useBusinessSummary";
import {
  buildBusinessModellingState,
  loadBusinessModellingState,
  saveBusinessModellingState,
} from "@/lib/storage/businessModellingStorage";
import {
  buildBaselineSnapshot,
  buildScenarioState,
  calculateScenarioDelta,
} from "@/lib/calculations/businessModellingCalculations";
import {
  buildBusinessModellingStatus,
  buildBusinessModellingBaselineCard,
  buildBusinessModellingScenarioControls,
  buildBusinessModellingScenarioResult,
  buildBusinessModellingDeltaCard,
  buildBusinessModellingSelectedModelOutput,
} from "@/lib/selectors/businessModellingSelectors";

const SCENARIO_TYPES = [
  { type: "baseline", name: "Baseline" },
  { type: "upside", name: "Upside Scenario" },
  { type: "downside", name: "Downside Scenario" },
];

function hasUsableBusinessSummary(output_contract = {}) {
  return [
    "total_revenue",
    "margin_pool",
    "total_cost_burden",
    "total_productive_output",
    "net_position",
  ].some((field) => Number(output_contract[field]) !== 0);
}

function isBaselineEmpty(baseline_snapshot) {
  if (!baseline_snapshot) {
    return true;
  }

  return [
    "total_revenue",
    "margin_pool",
    "total_cost_burden",
    "total_productive_output",
    "net_position",
  ].every((field) => Number(baseline_snapshot[field]) === 0);
}

export default function useBusinessModelling() {
  const business_summary = useBusinessSummary();

  const [business_modelling_state, setBusinessModellingState] = useState(() => {
    return {
      baseline_snapshot: null,
      upside_scenario: null,
      downside_scenario: null,
      selected_model_type: "baseline",
      selected_model_id: "",
      created_at: "",
      updated_at: "",
    };
  });

  useEffect(() => {
    const storedState = loadBusinessModellingState();
    setBusinessModellingState(storedState);
  }, []);

  useEffect(() => {
    saveBusinessModellingState(business_modelling_state);
  }, [business_modelling_state]);

  const business_summary_output_contract = useMemo(
    () => business_summary.output_contract ?? {},
    [business_summary.output_contract]
  );

  const business_summary_usable = useMemo(
    () => hasUsableBusinessSummary(business_summary_output_contract),
    [business_summary_output_contract]
  );

  const baseline_snapshot = useMemo(() => {
    if (
      business_modelling_state.baseline_snapshot &&
      !isBaselineEmpty(business_modelling_state.baseline_snapshot)
    ) {
      return business_modelling_state.baseline_snapshot;
    }

    if (!business_summary_usable) {
      return null;
    }

    return buildBaselineSnapshot({
      total_revenue: business_summary_output_contract.total_revenue,
      total_direct_costs: business_summary_output_contract.total_direct_costs,
      margin_pool: business_summary_output_contract.margin_pool,
      gross_margin_percent:
        business_summary_output_contract.gross_margin_percent,
      total_cost_burden: business_summary_output_contract.total_cost_burden,
      net_position: business_summary_output_contract.net_position,
      total_productive_output:
        business_summary_output_contract.total_productive_output,
      weighted_productivity_percent:
        business_summary_output_contract.weighted_productivity_percent,
      total_available_hours_before_productivity:
        business_summary_output_contract.total_available_hours_before_productivity,
      required_recovery_rate:
        business_summary_output_contract.required_recovery_rate,
      current_margin_per_productive_hour:
        business_summary_output_contract.current_margin_per_productive_hour,
      recovery_gap_per_hour:
        business_summary_output_contract.recovery_gap_per_hour,
      business_summary_status:
        business_summary_output_contract.business_summary_status,
      model_trust_state: business_summary_output_contract.model_trust_state,
      business_summary_warnings:
        business_summary_output_contract.business_summary_warnings,
    });
  }, [
    business_modelling_state.baseline_snapshot,
    business_summary_output_contract,
    business_summary_usable,
  ]);

  useEffect(() => {
    const storedBaselineEmpty = isBaselineEmpty(
      business_modelling_state.baseline_snapshot
    );

    if (
      (!business_modelling_state.baseline_snapshot || storedBaselineEmpty) &&
      baseline_snapshot
    ) {
      setBusinessModellingState((previous) =>
        buildBusinessModellingState({
          ...previous,
          baseline_snapshot,
        })
      );
    }
  }, [baseline_snapshot, business_modelling_state.baseline_snapshot]);

  const upside_scenario = useMemo(() => {
    return buildScenarioState({
      baseline_snapshot,
      scenario_type: "upside",
      scenario_name: "Upside Scenario",
      scenario_state: business_modelling_state.upside_scenario ?? {},
    });
  }, [baseline_snapshot, business_modelling_state.upside_scenario]);

  const downside_scenario = useMemo(() => {
    return buildScenarioState({
      baseline_snapshot,
      scenario_type: "downside",
      scenario_name: "Downside Scenario",
      scenario_state: business_modelling_state.downside_scenario ?? {},
    });
  }, [baseline_snapshot, business_modelling_state.downside_scenario]);

  const selected_model_type =
    business_modelling_state.selected_model_type || "baseline";

  const active_scenario = useMemo(() => {
    if (selected_model_type === "upside") {
      return upside_scenario;
    }

    if (selected_model_type === "downside") {
      return downside_scenario;
    }

    if (!baseline_snapshot) {
      return null;
    }

    return {
      ...baseline_snapshot,
      scenario_id: baseline_snapshot.baseline_id,
      scenario_name: baseline_snapshot.baseline_name,
      scenario_type: "baseline",
      scenario_total_revenue: baseline_snapshot.total_revenue,
      scenario_total_direct_costs: baseline_snapshot.total_direct_costs,
      scenario_margin_pool: baseline_snapshot.margin_pool,
      scenario_gross_margin_percent: baseline_snapshot.gross_margin_percent,
      scenario_total_cost_burden: baseline_snapshot.total_cost_burden,
      scenario_net_position: baseline_snapshot.net_position,
      scenario_total_productive_output:
        baseline_snapshot.total_productive_output,
      scenario_required_recovery_rate:
        baseline_snapshot.required_recovery_rate,
      scenario_margin_per_productive_hour:
        baseline_snapshot.current_margin_per_productive_hour,
      scenario_recovery_gap_per_hour: baseline_snapshot.recovery_gap_per_hour,
      scenario_productivity_percent:
        baseline_snapshot.weighted_productivity_percent || 100,
      baseline_productivity_percent:
        baseline_snapshot.weighted_productivity_percent || 100,
      scenario_trust_state: baseline_snapshot.model_trust_state,
      scenario_status:
        baseline_snapshot.model_trust_state === "blocked"
          ? "blocked"
          : "ready",
      scenario_warnings: baseline_snapshot.source_warnings || [],
    };
  }, [
    selected_model_type,
    upside_scenario,
    downside_scenario,
    baseline_snapshot,
  ]);

  const scenario_delta = useMemo(() => {
    return calculateScenarioDelta({
      scenario: active_scenario,
      baseline_snapshot,
    });
  }, [active_scenario, baseline_snapshot]);

  const modelling_ready = useMemo(() => {
    const summary_status =
      business_summary_output_contract.business_summary_status;
    const has_baseline = Boolean(baseline_snapshot);
    const has_scenario = Boolean(active_scenario);

    return has_baseline && has_scenario && summary_status !== "blocked";
  }, [
    baseline_snapshot,
    active_scenario,
    business_summary_output_contract.business_summary_status,
  ]);

  const modelling_warnings = useMemo(() => {
    const warnings = [];
    const summaryWarnings =
      business_summary_output_contract.business_summary_warnings || [];
    const summaryBlocked =
      business_summary_output_contract.business_summary_status === "blocked";

    if (summaryBlocked) {
      warnings.push({
        warning_id: "baseline_not_trusted",
        message:
          "Business Summary is not trusted, so the baseline is preview only.",
      });
    }

    const storedBaselineEmpty =
      Boolean(business_modelling_state.baseline_snapshot) &&
      isBaselineEmpty(business_modelling_state.baseline_snapshot);
    const shouldWarnAboutStoredBaselineEmpty =
      storedBaselineEmpty && !baseline_snapshot && business_summary_usable;

    if (shouldWarnAboutStoredBaselineEmpty) {
      warnings.push({
        warning_id: "stored_baseline_empty",
        message:
          "Stored baseline appears empty. Refresh baseline from current business.",
      });
    }

    if (summaryWarnings.length > 0) {
      warnings.push({
        warning_id: "upstream_business_summary_warning",
        message:
          "Business Summary has warnings, so the Business Modelling benchmark may be preview only.",
      });
    }

    if (!active_scenario) {
      warnings.push({
        warning_id: "scenario_missing",
        message: "No active scenario is available to compare with the baseline.",
      });
    }

    if (active_scenario?.scenario_total_productive_output === 0) {
      warnings.push({
        warning_id: "scenario_productive_output_zero",
        message:
          "Scenario productive output is zero, so per-hour outputs are held at 0.",
      });
    }

    if (active_scenario?.scenario_required_recovery_rate === 0) {
      warnings.push({
        warning_id: "scenario_required_recovery_rate_zero",
        message:
          "Scenario required recovery rate is zero, so the gap is not a reliable benchmark.",
      });
    }

    if (!active_scenario || active_scenario.scenario_trust_state === "blocked") {
      warnings.push({
        warning_id: "selected_model_not_trusted",
        message:
          "Selected model is not trusted, so it should be used as a preview benchmark only.",
      });
    }

    return warnings;
  }, [
    business_summary_output_contract,
    active_scenario,
    baseline_snapshot,
    business_summary_usable,
    business_modelling_state.baseline_snapshot,
  ]);

  const status = useMemo(() => {
    return buildBusinessModellingStatus({
      baseline_snapshot,
      active_scenario,
      business_summary_status:
        business_summary_output_contract.business_summary_status,
      modelling_ready,
      modelling_warnings,
      selected_model_type,
    });
  }, [
    baseline_snapshot,
    active_scenario,
    business_summary_output_contract.business_summary_status,
    modelling_ready,
    modelling_warnings,
    selected_model_type,
  ]);

  const baseline = useMemo(() => {
    return buildBusinessModellingBaselineCard(baseline_snapshot);
  }, [baseline_snapshot]);

  const scenario_controls = useMemo(() => {
    return buildBusinessModellingScenarioControls(active_scenario);
  }, [active_scenario]);

  const scenario_result = useMemo(() => {
    return buildBusinessModellingScenarioResult(active_scenario);
  }, [active_scenario]);

  const delta = useMemo(() => {
    return buildBusinessModellingDeltaCard({
      scenario_delta,
      baseline_snapshot,
      scenario: active_scenario,
    });
  }, [scenario_delta, baseline_snapshot, active_scenario]);

  const selected_model_output = useMemo(() => {
    return buildBusinessModellingSelectedModelOutput({
      selected_model_type,
      baseline_snapshot,
      active_scenario,
    });
  }, [selected_model_type, baseline_snapshot, active_scenario]);

  function updateScenarioField(field, value) {
    const update = (previous, scenario_key) => {
      const current = previous[scenario_key] || {};

      return {
        ...previous,
        [scenario_key]: {
          ...current,
          [field]: Number(value) || 0,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      };
    };

    if (selected_model_type === "upside") {
      setBusinessModellingState((previous) =>
        update(previous, "upside_scenario")
      );
    } else if (selected_model_type === "downside") {
      setBusinessModellingState((previous) =>
        update(previous, "downside_scenario")
      );
    }
  }

  function refreshBaseline() {
    setBusinessModellingState((previous) => {
      const baseline = buildBaselineSnapshot({
        total_revenue: business_summary.output_contract.total_revenue,
        total_direct_costs:
          business_summary.output_contract.total_direct_costs,
        margin_pool: business_summary.output_contract.margin_pool,
        gross_margin_percent:
          business_summary.output_contract.gross_margin_percent,
        total_cost_burden:
          business_summary.output_contract.total_cost_burden,
        net_position: business_summary.output_contract.net_position,
        total_productive_output:
          business_summary.output_contract.total_productive_output,
        weighted_productivity_percent:
          business_summary.output_contract.weighted_productivity_percent,
        total_available_hours_before_productivity:
          business_summary.output_contract
            .total_available_hours_before_productivity,
        required_recovery_rate:
          business_summary.output_contract.required_recovery_rate,
        current_margin_per_productive_hour:
          business_summary.output_contract.current_margin_per_productive_hour,
        recovery_gap_per_hour:
          business_summary.output_contract.recovery_gap_per_hour,
        business_summary_status:
          business_summary.output_contract.business_summary_status,
        model_trust_state: business_summary.output_contract.model_trust_state,
        business_summary_warnings:
          business_summary.output_contract.business_summary_warnings,
      });

      return buildBusinessModellingState({
        ...previous,
        baseline_snapshot: baseline,
        updated_at: new Date().toISOString(),
      });
    });
  }

  function resetScenarioToBaseline() {
    if (!baseline_snapshot) {
      return;
    }

    setBusinessModellingState((previous) => {
      const resetScenario = ({ scenario_type, scenario_name }) =>
        buildScenarioState({
          baseline_snapshot,
          scenario_type,
          scenario_name,
          scenario_state: {},
        });

      const next = {
        ...previous,
        updated_at: new Date().toISOString(),
      };

      if (selected_model_type === "upside") {
        next.upside_scenario = resetScenario({
          scenario_type: "upside",
          scenario_name: "Upside Scenario",
        });
      } else if (selected_model_type === "downside") {
        next.downside_scenario = resetScenario({
          scenario_type: "downside",
          scenario_name: "Downside Scenario",
        });
      } else {
        next.upside_scenario = resetScenario({
          scenario_type: "upside",
          scenario_name: "Upside Scenario",
        });

        next.downside_scenario = resetScenario({
          scenario_type: "downside",
          scenario_name: "Downside Scenario",
        });
      }

      return buildBusinessModellingState(next);
    });
  }

  function selectModel(type) {
    if (!SCENARIO_TYPES.some((scenario) => scenario.type === type)) {
      return;
    }

    setBusinessModellingState((previous) =>
      buildBusinessModellingState({
        ...previous,
        selected_model_type: type,
        updated_at: new Date().toISOString(),
      })
    );
  }

  return {
    status,
    baseline,
    scenario_controls,
    scenario_result,
    delta,
    selected_model_output,
    modelling_ready,
    modelling_warnings,
    baseline_snapshot,
    upside_scenario,
    downside_scenario,
    active_scenario,
    selected_model_type,
    scenario_delta_annual: delta.scenario_delta_annual,
    scenario_delta_per_hour: delta.scenario_delta_per_hour,
    scenario_net_position: active_scenario?.scenario_net_position,
    scenario_required_recovery_rate:
      active_scenario?.scenario_required_recovery_rate,
    scenario_margin_per_productive_hour:
      active_scenario?.scenario_margin_per_productive_hour,
    scenario_recovery_gap_per_hour:
      active_scenario?.scenario_recovery_gap_per_hour,
    scenario_status: active_scenario?.scenario_status,
    selected_model_id: selected_model_output.selected_model_id,
    selected_model_name: selected_model_output.selected_model_name,
    selected_model_type: selected_model_output.selected_model_type,
    selected_model_trust_state:
      selected_model_output.selected_model_trust_state,
    selected_model_total_revenue:
      selected_model_output.selected_model_total_revenue,
    selected_model_direct_costs:
      selected_model_output.selected_model_direct_costs,
    selected_model_margin_pool:
      selected_model_output.selected_model_margin_pool,
    selected_model_total_cost_burden:
      selected_model_output.selected_model_total_cost_burden,
    selected_model_total_productive_output:
      selected_model_output.selected_model_total_productive_output,
    selected_model_required_recovery_rate:
      selected_model_output.selected_model_required_recovery_rate,
    selected_model_margin_per_productive_hour:
      selected_model_output.selected_model_margin_per_productive_hour,
    selected_model_recovery_gap_per_hour:
      selected_model_output.selected_model_recovery_gap_per_hour,
    selected_model_net_position: selected_model_output.selected_model_net_position,
    updateScenarioField,
    refreshBaseline,
    resetScenarioToBaseline,
    selectModel,
  };
}