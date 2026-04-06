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

function getDeltaTone(value) {
  if (value > 0) return "text-[var(--success)]";
  if (value < 0) return "text-[var(--danger)]";
  return "text-[var(--text-secondary)]";
}

function getDriverMessage(biggestDriver) {
  if (!biggestDriver) return "Biggest impact: No change";
  return `Biggest impact: ${biggestDriver.shortLabel} (${formatDelta(biggestDriver.delta)}/hr)`;
}

function LabelledField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">
        {label}
      </label>

      <input
        type="number"
        value={value ?? ""}
        onChange={onChange}
        className="number-input w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
      />
    </div>
  );
}

function Metric({ label, value, colorClass = "text-[var(--text-primary)]", subvalue }) {
  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
      <div className="mb-1.5 text-sm text-[var(--text-muted)]">{label}</div>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>

      {subvalue ? (
        <div className="mt-1.5 text-sm text-[var(--text-muted)]">{subvalue}</div>
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
      className={[
        "rounded-xl border p-4",
        isHighlighted
          ? "border-[var(--border-primary)] bg-[var(--bg-hover)]"
          : "border-[var(--border-soft)] bg-transparent",
      ].join(" ")}
    >
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
            Metric
          </div>
          <div className="font-semibold text-[var(--text-primary)]">{label}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
            Live
          </div>
          <div className="text-[var(--text-secondary)]">{formatCurrency(live)}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
            Scenario
          </div>
          <div className="text-[var(--text-primary)]">
            {formatCurrency(scenario)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--text-muted)] md:hidden">
            Delta
          </div>
          <div className={`font-bold ${getDeltaTone(delta)}`}>{formatDelta(delta)}</div>
        </div>
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
    return calculateScenarioLabour(labourState, scenarioInputs);
  }, [labourState, scenarioInputs]);

  const liveOutputs = scenario.live_outputs ?? outputs ?? {};
  const scenarioOutputs = scenario.scenario_outputs ?? {};
  const biggestDriver = scenario.driver_analysis?.biggest_driver ?? null;
  const highlightedKey = biggestDriver?.key ?? null;

  const liveProfitPerHour = Number(liveOutputs.profit_per_hour ?? 0);
  const liveAboveRecovery = Number(liveOutputs.above_recovery ?? 0);

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Scenario Modeller
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Test “what happens if…” without changing your live labour profile.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm min-h-[44px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            {showHelp ? "Hide Explanation" : "Show Explanation"}
          </button>

          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card-muted)] px-4 py-3 text-sm min-h-[44px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            Reset
          </button>
        </div>
      </div>

      {showHelp ? (
        <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
          <div className="mb-2 font-semibold text-[var(--text-primary)]">
            What this does
          </div>

          <div className="text-sm leading-6 text-[var(--text-secondary)]">
            Use this to test “what happens if…” without changing your live numbers.
          </div>

          <div className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            <b>Labour Rate ↑</b> → Cost goes up → Profit drops
            <br />
            <b>Charge-Out ↑</b> → Profit goes up
            <br />
            <b>Productivity ↑</b> → Cost per hour drops → Profit improves
            <br />
            <b>Margin Target ↑</b> → Required charge-out increases
          </div>

          <div className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Green = better. Red = worse.
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Inputs</h3>

          <div className="mt-4 grid grid-cols-1 gap-4">
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

        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Scenario Outputs
          </h3>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Metric
              label="Profit per Hour"
              value={formatCurrency(Number(scenarioOutputs.profit_per_hour ?? 0))}
              subvalue={`Live: ${formatCurrency(liveProfitPerHour)}`}
              colorClass="text-[var(--success)]"
            />

            <Metric
              label="Above Recovery"
              value={formatCurrency(Number(scenarioOutputs.above_recovery ?? 0))}
              subvalue={`Live: ${formatCurrency(liveAboveRecovery)}`}
              colorClass="text-[var(--info)]"
            />

            <Metric
              label="Productive Labour Cost Rate"
              value={formatCurrency(
                Number(scenarioOutputs.productive_labour_cost_rate ?? 0)
              )}
              subvalue={`Live: ${formatCurrency(
                Number(liveOutputs.productive_labour_cost_rate ?? 0)
              )}`}
            />

            <Metric
              label="Minimum Charge-Out Rate"
              value={formatCurrency(
                Number(scenarioOutputs.minimum_charge_out_rate ?? 0)
              )}
              subvalue={`Live: ${formatCurrency(
                Number(liveOutputs.minimum_charge_out_rate ?? 0)
              )}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
        <div className="mb-1.5 font-semibold text-[var(--text-primary)]">
          {getDriverMessage(biggestDriver)}
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          Based on the single largest change in Scenario outputs
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4">
        <div className="mb-1.5 font-semibold text-[var(--text-primary)]">
          {scenario.explanation?.title ?? "Scenario explanation"}
        </div>

        <div className="text-sm leading-6 text-[var(--text-secondary)]">
          {scenario.explanation?.body ??
            "This panel explains the biggest commercial movement in the current scenario."}
        </div>

        {scenario.explanation?.insight ? (
          <div className="mt-2 text-sm text-[var(--text-muted)]">
            {scenario.explanation.insight}
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Live vs Scenario
        </h3>

        <div className="mt-4 hidden border-b border-[var(--border-primary)] pb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] md:grid md:grid-cols-4 md:gap-3">
          <div>Metric</div>
          <div>Live</div>
          <div>Scenario</div>
          <div>Delta</div>
        </div>

        <div className="mt-4 space-y-3">
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
    </section>
  );
}