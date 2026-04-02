"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

export default function ScenarioModelCard({ state, has_profile }) {
  const [scenario_state, setScenarioState] = useState(null);

  useEffect(() => {
    if (!has_profile) {
      setScenarioState(null);
      return;
    }

    setScenarioState({
      hours_per_week: state.hours_per_week,
      labour_rate: state.labour_rate,
      charge_out_rate: state.charge_out_rate,
      productivity_percent: state.productivity_percent,
      margin_target_percent: state.margin_target_percent,
      annual_leave_weeks: state.annual_leave_weeks,
      public_holiday_days: state.public_holiday_days,
      sick_days: state.sick_days,
      bereavement_days: state.bereavement_days,
      family_violence_days: state.family_violence_days,
      employee_kiwisaver_enabled: state.employee_kiwisaver_enabled,
    });
  }, [has_profile, state]);

  const current_outputs = useMemo(() => {
    if (!has_profile) return null;
    return calculateLabourOutputs(state);
  }, [has_profile, state]);

  const scenario_outputs = useMemo(() => {
    if (!scenario_state) return null;
    return calculateLabourOutputs(scenario_state);
  }, [scenario_state]);

  if (!has_profile) {
    return (
      <section className="rounded-2xl border border-sky-800 bg-sky-950/20 p-5">
        <h2 className="text-lg font-semibold">Scenario Modeller</h2>
        <p className="mt-1 mb-5 text-sm text-neutral-300">
          Test changes without affecting your core labour inputs.
        </p>

        <div className="rounded-xl border border-dashed border-sky-800 bg-neutral-950 px-4 py-6 text-sm text-sky-100">
          Create or load a labour profile first to unlock scenario modelling.
        </div>
      </section>
    );
  }

  if (!scenario_state || !scenario_outputs || !current_outputs) return null;

  function update_field(field, value) {
    setScenarioState((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function reset_scenario() {
    setScenarioState({
      hours_per_week: state.hours_per_week,
      labour_rate: state.labour_rate,
      charge_out_rate: state.charge_out_rate,
      productivity_percent: state.productivity_percent,
      margin_target_percent: state.margin_target_percent,
      annual_leave_weeks: state.annual_leave_weeks,
      public_holiday_days: state.public_holiday_days,
      sick_days: state.sick_days,
      bereavement_days: state.bereavement_days,
      family_violence_days: state.family_violence_days,
      employee_kiwisaver_enabled: state.employee_kiwisaver_enabled,
    });
  }

  return (
    <section className="rounded-2xl border border-sky-800 bg-sky-950/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Scenario Modeller</h2>
          <p className="mt-1 text-sm text-neutral-300">
            Test changes without affecting your core labour inputs.
          </p>
        </div>

        <button
          type="button"
          onClick={reset_scenario}
          className="rounded-xl border border-sky-700 bg-sky-950 px-4 py-2 text-sm text-sky-200"
        >
          Reset Scenario
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-sky-900 bg-neutral-950 px-4 py-3 text-sm text-sky-100">
        Core inputs remain unchanged. This modeller works from a copy of your current labour settings.
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Hours per Week">
          <input
            type="number"
            step="0.01"
            value={scenario_state.hours_per_week ?? ""}
            onChange={(e) => update_field("hours_per_week", e.target.value)}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Labour Rate">
          <input
            type="number"
            step="0.01"
            value={scenario_state.labour_rate ?? ""}
            onChange={(e) => update_field("labour_rate", e.target.value)}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Charge Out Rate">
          <input
            type="number"
            step="0.01"
            value={scenario_state.charge_out_rate ?? ""}
            onChange={(e) => update_field("charge_out_rate", e.target.value)}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Productivity Percent">
          <input
            type="number"
            step="0.01"
            value={scenario_state.productivity_percent ?? ""}
            onChange={(e) => update_field("productivity_percent", e.target.value)}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Margin Target Percent">
          <input
            type="number"
            step="0.01"
            value={scenario_state.margin_target_percent ?? ""}
            onChange={(e) => update_field("margin_target_percent", e.target.value)}
            className="number-input w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Employee KiwiSaver Enabled">
          <select
            value={scenario_state.employee_kiwisaver_enabled ? "true" : "false"}
            onChange={(e) =>
              update_field("employee_kiwisaver_enabled", e.target.value === "true")
            }
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </Field>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CompareCard
          title="Current"
          minimum_charge_out_rate={current_outputs.minimum_charge_out_rate}
          productive_hours={current_outputs.productive_hours}
          total_labour_cost_annual={current_outputs.total_labour_cost_annual}
        />

        <CompareCard
          title="Scenario"
          minimum_charge_out_rate={scenario_outputs.minimum_charge_out_rate}
          productive_hours={scenario_outputs.productive_hours}
          total_labour_cost_annual={scenario_outputs.total_labour_cost_annual}
        />
      </div>

      <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="mb-3 text-sm font-medium text-neutral-300">Scenario Difference</div>
        <div className="space-y-2 text-sm">
          <DiffRow
            label="Minimum Charge-Out Rate"
            value={scenario_outputs.minimum_charge_out_rate - current_outputs.minimum_charge_out_rate}
          />
          <DiffRow
            label="Productive Hours"
            value={scenario_outputs.productive_hours - current_outputs.productive_hours}
            currency={false}
          />
          <DiffRow
            label="True Labour Cost (Annual)"
            value={scenario_outputs.total_labour_cost_annual - current_outputs.total_labour_cost_annual}
          />
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-neutral-300">{label}</div>
      {children}
    </label>
  );
}

function CompareCard({
  title,
  minimum_charge_out_rate,
  productive_hours,
  total_labour_cost_annual,
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-3 text-sm font-medium text-neutral-300">{title}</div>
      <div className="space-y-2 text-sm text-neutral-300">
        <Row label="Productive Hours" value={fmt(productive_hours)} />
        <Row label="True Labour Cost" value={fmtCur(total_labour_cost_annual)} />
        <Row label="Minimum Charge-Out" value={fmtCur(minimum_charge_out_rate)} />
      </div>
    </div>
  );
}

function DiffRow({ label, value, currency = true }) {
  const positive = Number(value || 0) > 0;
  const neutral = Number(value || 0) === 0;

  const tone = neutral
    ? "text-neutral-300"
    : positive
    ? "text-rose-300"
    : "text-emerald-300";

  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-300">{label}</span>
      <span className={tone}>
        {currency ? fmtSignedCur(value) : fmtSigned(value)}
      </span>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function fmt(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function fmtCur(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtSigned(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function fmtSignedCur(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}