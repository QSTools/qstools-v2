"use client";

import React, { useEffect, useMemo, useState } from "react";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
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

function Metric({ label, value, color }) {
  return (
    <div style={{ ...panelStyle(), background: "#0b0b0b" }}>
      <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color }}>
        {value}
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

  const matchesLive =
    toNumber(scenarioInputs.labour_rate) === toNumber(labourState.labour_rate) &&
    toNumber(scenarioInputs.charge_out_rate) === toNumber(labourState.charge_out_rate) &&
    toNumber(scenarioInputs.productivity_percent) === toNumber(labourState.productivity_percent) &&
    toNumber(scenarioInputs.margin_target_percent) === toNumber(labourState.margin_target_percent);

  const live_cost_per_hour = toNumber(outputs.productive_labour_cost_rate);
  const live_min_charge_out = toNumber(outputs.minimum_charge_out_rate);

  const fallback_cost_per_hour =
    clamp(toNumber(scenarioInputs.productivity_percent), 0, 100) > 0
      ? toNumber(scenarioInputs.labour_rate) /
        (clamp(toNumber(scenarioInputs.productivity_percent), 0, 100) / 100)
      : 0;

  const fallback_min_charge_out =
    clamp(toNumber(scenarioInputs.margin_target_percent), 0, 100) < 100
      ? fallback_cost_per_hour /
        (1 - clamp(toNumber(scenarioInputs.margin_target_percent), 0, 100) / 100)
      : 0;

  const cost_per_hour = matchesLive ? live_cost_per_hour : fallback_cost_per_hour;
  const min_charge_out = matchesLive ? live_min_charge_out : fallback_min_charge_out;

  const charge_out_rate = toNumber(scenarioInputs.charge_out_rate);
  const profit_per_hour = charge_out_rate - cost_per_hour;
  const above_recovery = charge_out_rate - min_charge_out;

  return (
    <div style={{ ...panelStyle(), marginTop: "24px" }}>
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
          <h3 style={{ color: "#fff", marginTop: 0 }}>Dollar Outputs</h3>

          <div style={{ display: "grid", gap: "12px" }}>
            <Metric
              label="Profit per Hour"
              value={formatCurrency(profit_per_hour)}
              color="#22c55e"
            />

            <Metric
              label="Above Recovery"
              value={formatCurrency(above_recovery)}
              color="#14b8a6"
            />

            <Metric
              label="Cost per Hour"
              value={formatCurrency(cost_per_hour)}
              color="#fff"
            />

            <Metric
              label="Min Charge-Out"
              value={formatCurrency(min_charge_out)}
              color="#fff"
            />
          </div>
        </div>
      </div>
    </div>
  );
}