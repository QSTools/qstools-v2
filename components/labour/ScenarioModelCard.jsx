"use client";

import React, { useEffect, useMemo, useState } from "react";
import calculateScenarioLabour, {
    DRIVER_META,
} from "@/lib/calculations/labourScenarioCalculations";

function formatCurrency(value) {
    return new Intl.NumberFormat("en-NZ", {
        style: "currency",
        currency: "NZD",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
}

function formatDelta(value) {
    const safe = Number.isFinite(value) ? value : 0;
    const prefix = safe > 0 ? "+" : safe < 0 ? "-" : "";
    return `${prefix}${formatCurrency(Math.abs(safe))}`;
}

function fieldStyle() {
    return {
        width: "100%",
        padding: "10px",
        border: "1px solid #2a2a2a",
        borderRadius: "10px",
        background: "#050505",
        color: "#fff",
    };
}

function panelStyle() {
    return {
        border: "1px solid #2a2a2a",
        borderRadius: "14px",
        padding: "16px",
        background: "#111",
    };
}

function mutedTextStyle() {
    return {
        fontSize: "12px",
        lineHeight: 1.5,
        color: "#a3a3a3",
    };
}

function getDeltaColor(value) {
    if (value > 0) return "#22c55e";
    if (value < 0) return "#ef4444";
    return "#a3a3a3";
}

function LabelledField({ label, value, onChange }) {
    return (
        <div>
            <label
                style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#a3a3a3",
                    marginBottom: "6px",
                }}
            >
                {label}
            </label>

            <input
                type="number"
                value={value ?? ""}
                onChange={onChange}
                style={fieldStyle()}
            />
        </div>
    );
}

function Metric({ label, value, color, subvalue }) {
    return (
        <div style={{ ...panelStyle(), background: "#0b0b0b" }}>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                {label}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color }}>
                {value}
            </div>
            {subvalue ? (
                <div style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>
                    {subvalue}
                </div>
            ) : null}
        </div>
    );
}

function DeltaRow({ label, liveValue, scenarioValue, isHighlighted = false }) {
    const live = Number.isFinite(liveValue) ? liveValue : 0;
    const scenario = Number.isFinite(scenarioValue) ? scenarioValue : 0;
    const delta = scenario - live;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                gap: "12px",
                padding: "10px 12px",
                borderBottom: "1px solid #1f1f1f",
                alignItems: "center",
                borderRadius: "10px",
                background: isHighlighted ? "rgba(255,255,255,0.06)" : "transparent",
                border: isHighlighted ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
            }}
        >
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                {label}
            </div>

            <div style={{ color: "#a3a3a3", fontSize: "13px" }}>
                {formatCurrency(live)}
            </div>

            <div style={{ color: "#fff", fontSize: "13px" }}>
                {formatCurrency(scenario)}
            </div>

            <div
                style={{
                    color: getDeltaColor(delta),
                    fontSize: "13px",
                    fontWeight: 700,
                }}
            >
                {formatDelta(delta)}
            </div>
        </div>
    );
}

function getDriverMessage(biggestDriver) {
    if (!biggestDriver) return "Biggest impact: No change";
    return `Biggest impact: ${biggestDriver.shortLabel} (${formatDelta(biggestDriver.delta)}/hr)`;
}

export default function ScenarioModelCard({
    labourState = {},
    outputs = {},
}) {
    const [scenarioInputs, setScenarioInputs] = useState({
        labour_rate: labourState.labour_rate,
        charge_out_rate: labourState.charge_out_rate,
        productivity_percent: labourState.productivity_percent,
        margin_target_percent: labourState.margin_target_percent,
    });

    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        setScenarioInputs({
            labour_rate: labourState.labour_rate,
            charge_out_rate: labourState.charge_out_rate,
            productivity_percent: labourState.productivity_percent,
            margin_target_percent: labourState.margin_target_percent,
        });
    }, [
        labourState.labour_rate,
        labourState.charge_out_rate,
        labourState.productivity_percent,
        labourState.margin_target_percent,
    ]);

    function update(field) {
        return (e) => {
            const value = e.target.value;

            setScenarioInputs((prev) => ({
                ...prev,
                [field]: value === "" ? "" : Number(value),
            }));
        };
    }

    function reset() {
        setScenarioInputs({
            labour_rate: labourState.labour_rate,
            charge_out_rate: labourState.charge_out_rate,
            productivity_percent: labourState.productivity_percent,
            margin_target_percent: labourState.margin_target_percent,
        });
    }

    const scenario = useMemo(() => {
        return calculateScenarioLabour(labourState, scenarioInputs);
    }, [labourState, scenarioInputs]);

    const liveOutputs = scenario.live_outputs ?? outputs ?? {};
    const scenarioOutputs = scenario.scenario_outputs ?? {};
    const biggestDriver = scenario.driver_analysis?.biggest_driver ?? null;
    const highlightedKey = biggestDriver?.key ?? null;

    const liveProfitPerHour = Number(
        liveOutputs.profit_per_hour ?? 0
    );

    const liveAboveRecovery = Number(
        liveOutputs.above_recovery ?? 0
    );

    return (
        <div style={panelStyle()}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                    gap: "12px",
                    flexWrap: "wrap",
                }}
            >
                <h2 className="text-2xl font-semibold text-white m-0">
                    Scenario Modeller
                </h2>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                        onClick={() => setShowHelp((prev) => !prev)}
                        style={{
                            padding: "6px 10px",
                            border: "1px solid #2a2a2a",
                            borderRadius: "8px",
                            background: "#050505",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        {showHelp ? "Hide Explanation" : "Show Explanation"}
                    </button>

                    <button
                        onClick={reset}
                        style={{
                            padding: "6px 10px",
                            border: "1px solid #2a2a2a",
                            borderRadius: "8px",
                            background: "#050505",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {showHelp ? (
                <div style={{ ...panelStyle(), marginBottom: "16px", background: "#0b0b0b" }}>
                    <div style={{ color: "#fff", fontWeight: 700, marginBottom: "8px" }}>
                        What this does
                    </div>

                    <div style={mutedTextStyle()}>
                        Use this to test “what happens if…” without changing your live numbers.
                    </div>

                    <div style={{ ...mutedTextStyle(), marginTop: "10px" }}>
                        <b>Labour Rate ↑</b> → Cost goes up → Profit drops
                        <br />
                        <b>Charge-Out ↑</b> → Profit goes up
                        <br />
                        <b>Productivity ↑</b> → Cost per hour drops → Profit improves
                        <br />
                        <b>Margin Target ↑</b> → Required charge-out increases
                    </div>

                    <div style={{ ...mutedTextStyle(), marginTop: "10px" }}>
                        Green = better. Red = worse.
                    </div>
                </div>
            ) : null}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                }}
            >
                <div style={panelStyle()}>
                    <h3 style={{ color: "#fff", marginTop: 0 }}>Inputs</h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                        <LabelledField
                            label="Labour Rate"
                            value={scenarioInputs.labour_rate}
                            onChange={update("labour_rate")}
                        />

                        <LabelledField
                            label="Charge-Out Rate"
                            value={scenarioInputs.charge_out_rate}
                            onChange={update("charge_out_rate")}
                        />

                        <LabelledField
                            label="Productivity %"
                            value={scenarioInputs.productivity_percent}
                            onChange={update("productivity_percent")}
                        />

                        <LabelledField
                            label="Margin Target %"
                            value={scenarioInputs.margin_target_percent}
                            onChange={update("margin_target_percent")}
                        />
                    </div>
                </div>

                <div style={panelStyle()}>
                    <h3 style={{ color: "#fff", marginTop: 0 }}>Scenario Outputs</h3>

                    <div style={{ display: "grid", gap: "12px" }}>
                        <Metric
                            label="Profit per Hour"
                            value={formatCurrency(Number(scenarioOutputs.profit_per_hour ?? 0))}
                            subvalue={`Live: ${formatCurrency(liveProfitPerHour)}`}
                            color="#22c55e"
                        />

                        <Metric
                            label="Above Recovery"
                            value={formatCurrency(Number(scenarioOutputs.above_recovery ?? 0))}
                            subvalue={`Live: ${formatCurrency(liveAboveRecovery)}`}
                            color="#14b8a6"
                        />

                        <Metric
                            label="Productive Labour Cost Rate"
                            value={formatCurrency(Number(scenarioOutputs.productive_labour_cost_rate ?? 0))}
                            subvalue={`Live: ${formatCurrency(Number(liveOutputs.productive_labour_cost_rate ?? 0))}`}
                            color="#fff"
                        />

                        <Metric
                            label="Minimum Charge-Out Rate"
                            value={formatCurrency(Number(scenarioOutputs.minimum_charge_out_rate ?? 0))}
                            subvalue={`Live: ${formatCurrency(Number(liveOutputs.minimum_charge_out_rate ?? 0))}`}
                            color="#fff"
                        />
                    </div>
                </div>
            </div>

            <div style={{ ...panelStyle(), marginTop: "20px", background: "#0b0b0b" }}>
                <div style={{ color: "#fff", fontWeight: 700, marginBottom: "6px" }}>
                    {getDriverMessage(biggestDriver)}
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>
                    Based on the single largest change in Scenario outputs
                </div>
            </div>

            <div style={{ ...panelStyle(), marginTop: "20px" }}>
                <h3 style={{ color: "#fff", marginTop: 0, marginBottom: "12px" }}>
                    Live vs Scenario
                </h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                        gap: "12px",
                        paddingBottom: "10px",
                        borderBottom: "1px solid #2a2a2a",
                        marginBottom: "8px",
                    }}
                >
                    <div style={{ color: "#888", fontSize: "12px", fontWeight: 700 }}>
                        Metric
                    </div>
                    <div style={{ color: "#888", fontSize: "12px", fontWeight: 700 }}>
                        Live
                    </div>
                    <div style={{ color: "#888", fontSize: "12px", fontWeight: 700 }}>
                        Scenario
                    </div>
                    <div style={{ color: "#888", fontSize: "12px", fontWeight: 700 }}>
                        Delta
                    </div>
                </div>

                <DeltaRow
                    label={DRIVER_META.productive_labour_cost_rate.label}
                    liveValue={Number(liveOutputs.productive_labour_cost_rate ?? 0)}
                    scenarioValue={Number(scenarioOutputs.productive_labour_cost_rate ?? 0)}
                    isHighlighted={highlightedKey === "productive_labour_cost_rate"}
                />

                <DeltaRow
                    label={DRIVER_META.minimum_charge_out_rate.label}
                    liveValue={Number(liveOutputs.minimum_charge_out_rate ?? 0)}
                    scenarioValue={Number(scenarioOutputs.minimum_charge_out_rate ?? 0)}
                    isHighlighted={highlightedKey === "minimum_charge_out_rate"}
                />

                <DeltaRow
                    label={DRIVER_META.profit_per_hour.label}
                    liveValue={liveProfitPerHour}
                    scenarioValue={Number(scenarioOutputs.profit_per_hour ?? 0)}
                    isHighlighted={highlightedKey === "profit_per_hour"}
                />

                <DeltaRow
                    label={DRIVER_META.above_recovery.label}
                    liveValue={liveAboveRecovery}
                    scenarioValue={Number(scenarioOutputs.above_recovery ?? 0)}
                    isHighlighted={highlightedKey === "above_recovery"}
                />
            </div>
        </div>
    );
}