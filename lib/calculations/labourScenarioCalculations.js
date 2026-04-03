// lib/calculations/labourScenarioCalculations.js

import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

/**
 * STEP 1 + STEP 2 + STEP 3 SUPPORT
 * --------------------------------
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

function buildDriverExplanation(biggestDriver) {
  if (!biggestDriver) {
    return {
      title: "No material change",
      body: "Your scenario is currently matching the live labour position, so there is no major commercial movement to explain.",
    };
  }

  const isUp = biggestDriver.delta > 0;
  const isDown = biggestDriver.delta < 0;

  switch (biggestDriver.key) {
    case "productive_labour_cost_rate":
      if (isUp) {
        return {
          title: "Cost increased most",
          body:
            "Your cost per productive hour increased the most in this scenario. That means each productive hour is now costing more to recover, which puts pressure on profit unless your charge-out also rises.",
          insight:
            "A small wage increase can result in a much larger required charge-out increase because costs are recovered over productive hours and margin is applied on top.",
        };
      }
      if (isDown) {
        return {
          title: "Cost reduced most",
          body:
            "Your cost per productive hour reduced the most in this scenario. That improves efficiency and creates more room for profit at the same charge-out rate.",
          insight:
            "Improvements in productivity or cost efficiency have a leveraged impact because they reduce cost per productive hour.",
        };
      }
      break;

    case "minimum_charge_out_rate":
      if (isUp) {
        return {
          title: "Required recovery increased most",
          body:
            "Your minimum charge-out rate increased the most in this scenario. This means you now need to recover more per productive hour to hold your target margin.",
        };
      }
      if (isDown) {
        return {
          title: "Required recovery reduced most",
          body:
            "Your minimum charge-out rate reduced the most in this scenario. This means the business can recover its target margin at a lower charge-out level.",
        };
      }
      break;

    case "profit_per_hour":
      if (isUp) {
        return {
          title: "Profit improved most",
          body:
            "Profit per hour increased the most in this scenario. That means your commercial position improved most strongly at the hourly level.",
        };
      }
      if (isDown) {
        return {
          title: "Profit reduced most",
          body:
            "Profit per hour reduced the most in this scenario. That means your commercial position weakened most strongly at the hourly level.",
        };
      }
      break;

    case "above_recovery":
      if (isUp) {
        return {
          title: "Buffer above recovery improved most",
          body:
            "Above recovery increased the most in this scenario. That gives you a stronger commercial buffer above the minimum rate you need to recover.",
        };
      }
      if (isDown) {
        return {
          title: "Buffer above recovery reduced most",
          body:
            "Above recovery reduced the most in this scenario. That leaves less room above your minimum recovery point and tightens the commercial buffer.",
        };
      }
      break;

    default:
      break;
  }

  return {
    title: "No material change",
    body: "Your scenario has not created a strong enough output shift to produce a meaningful commercial explanation.",
  };
}

export function runLabourCalculations(labourState, overrides = {}) {
  const live_outputs = calculateLabourOutputs(labourState);

  const scenario_state = buildScenarioState(labourState, overrides);
  const scenario_outputs = calculateLabourOutputs(scenario_state);

  const driver_analysis = buildDriverAnalysis(live_outputs, scenario_outputs);
  const explanation = buildDriverExplanation(driver_analysis.biggest_driver);

  return {
    live_state: labourState,
    scenario_state,
    live_outputs,
    scenario_outputs,
    driver_analysis,
    explanation,

    // compatibility helpers
    ...scenario_outputs,
    biggest_driver: driver_analysis.biggest_driver,
  };
}

export default runLabourCalculations;