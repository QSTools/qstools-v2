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
            title: "No meaningful change",
            body: "This scenario is effectively the same as your current setup, so there’s no real commercial impact to call out.",
        };
    }

    const isUp = biggestDriver.delta > 0;
    const isDown = biggestDriver.delta < 0;

    switch (biggestDriver.key) {
        case "productive_labour_cost_rate":
            if (isUp) {
                return {
                    title: "Your labour cost has increased",
                    body:
                        "The cost per productive hour has gone up. That means every hour you sell now needs to recover more cost, which puts pressure on your margin unless you lift your charge-out rate.",
                    insight:
                        "Even a small wage increase can push your required charge-out up a lot, because you're recovering cost over productive hours and then applying margin on top.",
                };
            }
            if (isDown) {
                return {
                    title: "Your labour cost has reduced",
                    body:
                        "The cost per productive hour has dropped. That improves efficiency and gives you more room to make profit at the same charge-out rate.",
                    insight:
                        "Productivity gains and cost reductions have a strong upside because they directly reduce the cost of every productive hour.",
                };
            }
            break;

        case "minimum_charge_out_rate":
            if (isUp) {
                return {
                    title: "You now need to charge more",
                    body:
                        "Your minimum charge-out rate has increased. To hit your target margin, you now need to recover more per hour than before.",
                    insight:
                        "This is typically driven by higher costs or a higher margin target — both push your required recovery up.",
                };
            }
            if (isDown) {
                return {
                    title: "You can charge less to hit your margin",
                    body:
                        "Your minimum charge-out rate has dropped. You can now achieve your target margin at a lower rate.",
                    insight:
                        "Lower costs or improved productivity reduce how much you need to recover per hour.",
                };
            }
            break;

        case "profit_per_hour":
            if (isUp) {
                return {
                    title: "Your profit per hour has improved",
                    body:
                        "You are now making more profit on each productive hour. This strengthens your commercial position.",
                    insight:
                        "This usually comes from better charge-out rates, improved productivity, or reduced cost.",
                };
            }
            if (isDown) {
                return {
                    title: "Your profit per hour has reduced",
                    body:
                        "You are now making less profit per hour. This weakens your commercial position and may need attention.",
                    insight:
                        "This is often caused by rising costs or not keeping charge-out rates aligned with those costs.",
                };
            }
            break;

        case "above_recovery":
            if (isUp) {
                return {
                    title: "You have more buffer above break-even",
                    body:
                        "The gap between your charge-out rate and your minimum recovery has increased. You now have more room for profit.",
                    insight:
                        "A larger buffer gives you protection against cost increases or productivity drops.",
                };
            }
            if (isDown) {
                return {
                    title: "Your buffer is tightening",
                    body:
                        "The gap between your charge-out rate and your minimum recovery has reduced. You're closer to break-even.",
                    insight:
                        "A small buffer increases risk — even minor cost increases can wipe out profit.",
                };
            }
            break;

        default:
            break;
    }

    return {
        title: "No meaningful change",
        body: "There hasn’t been a strong enough movement in the outputs to highlight a clear commercial impact.",
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