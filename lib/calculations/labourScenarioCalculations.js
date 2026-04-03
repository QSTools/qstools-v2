// lib/calculations/labourScenarioCalculations.js

import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

/**
 * STEP 1 + STEP 2 SUPPORT
 * -----------------------
 * Scenario is a labour-only commercial testing layer.
 * This file owns all Scenario-side calculation shaping.
 *
 * Rules:
 * - No UI maths
 * - Reuse Labour engine
 * - Biggest driver must use OUTPUT deltas only
 * - Allowed outputs only:
 *   - productive_labour_cost_rate
 *   - minimum_charge_out_rate
 *   - profit_per_hour
 *   - above_recovery
 */

const DRIVER_ORDER = [
  "productive_labour_cost_rate",
  "minimum_charge_out_rate",
  "profit_per_hour",
  "above_recovery",
];

export const DRIVER_META = {
  productive_labour_cost_rate: {
    key: "productive_labour_cost_rate",
    label: "Productive Labour Cost Rate",
    shortLabel: "Cost",
  },
  minimum_charge_out_rate: {
    key: "minimum_charge_out_rate",
    label: "Minimum Charge-Out Rate",
    shortLabel: "Minimum Charge",
  },
  profit_per_hour: {
    key: "profit_per_hour",
    label: "Profit per Hour",
    shortLabel: "Profit",
  },
  above_recovery: {
    key: "above_recovery",
    label: "Above Recovery",
    shortLabel: "Above Recovery",
  },
};

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalisePercentInput(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildScenarioState(labourState, overrides = {}) {
  return {
    ...labourState,
    labour_rate:
      toNumber(overrides.labour_rate) !== null
        ? toNumber(overrides.labour_rate)
        : labourState.labour_rate,

    charge_out_rate:
      toNumber(overrides.charge_out_rate) !== null
        ? toNumber(overrides.charge_out_rate)
        : labourState.charge_out_rate,

    productivity_percent:
      normalisePercentInput(overrides.productivity_percent) !== null
        ? normalisePercentInput(overrides.productivity_percent)
        : labourState.productivity_percent,

    margin_target_percent:
      normalisePercentInput(overrides.margin_target_percent) !== null
        ? normalisePercentInput(overrides.margin_target_percent)
        : labourState.margin_target_percent,
  };
}

function buildDriverAnalysis(liveOutputs = {}, scenarioOutputs = {}) {
  const deltas = {};
  let biggestDriver = null;

  for (const key of DRIVER_ORDER) {
    const liveValue = toNumber(liveOutputs?.[key]);
    const scenarioValue = toNumber(scenarioOutputs?.[key]);

    const delta =
      liveValue !== null && scenarioValue !== null ? scenarioValue - liveValue : 0;

    const absolute_delta = Math.abs(delta);

    deltas[key] = {
      key,
      live_value: liveValue ?? 0,
      scenario_value: scenarioValue ?? 0,
      delta,
      absolute_delta,
      label: DRIVER_META[key].label,
      shortLabel: DRIVER_META[key].shortLabel,
    };

    if (!biggestDriver || absolute_delta > biggestDriver.absolute_delta) {
      biggestDriver = deltas[key];
    }
  }

  return {
    deltas,
    biggest_driver: biggestDriver
      ? {
          key: biggestDriver.key,
          label: biggestDriver.label,
          shortLabel: biggestDriver.shortLabel,
          delta: biggestDriver.delta,
          absolute_delta: biggestDriver.absolute_delta,
        }
      : null,
  };
}

export function runLabourCalculations(labourState, overrides = {}) {
  const live_outputs = calculateLabourOutputs(labourState);

  const scenario_state = buildScenarioState(labourState, overrides);
  const scenario_outputs = calculateLabourOutputs(scenario_state);

  const driver_analysis = buildDriverAnalysis(live_outputs, scenario_outputs);

  return {
    live_state: labourState,
    scenario_state,
    live_outputs,
    scenario_outputs,
    driver_analysis,

    // Convenience values for compatibility if needed elsewhere
    ...scenario_outputs,
    biggest_driver: driver_analysis.biggest_driver,
  };
}

export default runLabourCalculations;