"use client";

import React, { useEffect, useMemo, useState } from "react";
import calculateScenarioLabour from "@/lib/calculations/labourScenarioCalculations";

function formatCurrency(value) {
    return new Intl.NumberFormat("en-NZ", {
        style: "currency",
        currency: "NZD",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
}

function formatDelta(value) {
    const safe = Number.isFinite(value) ? value : 0;
    const prefix = safe > 0 ? "+" : "";
    return `${prefix}${formatCurrency(safe)}`;
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

function DeltaRow({ label, liveValue, scenarioValue }) {
    const delta = scenarioValue - liveValue;

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                gap: "12px",
                padding: "10px 0",
                borderBottom: "1px solid #1f1f1f",
                alignItems: "center",
            }}
        >
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                {label}
            </div>

            <div style={{ color: "#a3a3a3", fontSize: "13px" }}>
                {formatCurrency(liveValue)}
            </div>

            <div style={{ color: "#fff", fontSize: "13px" }}>
                {formatCurrency(scenarioValue)}
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
        return calculateScenarioLabour({
            labour_state: labourState,
            labour_outputs: outputs,
            scenario_overrides: scenarioInputs,
        });
    }, [labourState, outputs, scenarioInputs]);

    const liveProfitPerHour =
        Number(outputs.charge_out_rate ?? labourState.charge_out_rate ?? 0) -
        Number(outputs.productive_labour_cost_rate ?? 0);

    const liveAboveRecovery =
        Number(outputs.charge_out_rate ?? labourState.charge_out_rate ?? 0) -
        Number(outputs.minimum_charge_out_rate ?? 0);

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
                <h2 style={{ margin: 0, color: "#fff" }}>Scenario Modeller</h2>

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
                            value={formatCurrency(scenario.profit_per_hour)}
                            subvalue={`Live: ${formatCurrency(liveProfitPerHour)}`}
                            color="#22c55e"
                        />

                        <Metric
                            label="Above Recovery"
                            value={formatCurrency(scenario.above_recovery)}
                            subvalue={`Live: ${formatCurrency(liveAboveRecovery)}`}
                            color="#14b8a6"
                        />

                        <Metric
                            label="Productive Labour Cost Rate"
                            value={formatCurrency(scenario.productive_labour_cost_rate)}
                            subvalue={`Live: ${formatCurrency(Number(outputs.productive_labour_cost_rate ?? 0))}`}
                            color="#fff"
                        />

                        <Metric
                            label="Minimum Charge-Out Rate"
                            value={formatCurrency(scenario.minimum_charge_out_rate)}
                            subvalue={`Live: ${formatCurrency(Number(outputs.minimum_charge_out_rate ?? 0))}`}
                            color="#fff"
                        />
                    </div>
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
                        marginBottom: "2px",
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
                    label="Productive Labour Cost Rate"
                    liveValue={Number(outputs.productive_labour_cost_rate ?? 0)}
                    scenarioValue={Number(scenario.productive_labour_cost_rate ?? 0)}
                />

                <DeltaRow
                    label="Minimum Charge-Out Rate"
                    liveValue={Number(outputs.minimum_charge_out_rate ?? 0)}
                    scenarioValue={Number(scenario.minimum_charge_out_rate ?? 0)}
                />

                <DeltaRow
                    label="Profit per Hour"
                    liveValue={liveProfitPerHour}
                    scenarioValue={Number(scenario.profit_per_hour ?? 0)}
                />

                <DeltaRow
                    label="Above Recovery"
                    liveValue={liveAboveRecovery}
                    scenarioValue={Number(scenario.above_recovery ?? 0)}
                />
            </div>
        </div>
    );
}