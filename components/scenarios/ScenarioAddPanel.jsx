"use client";

// R3 slice 4 batch C3a (Business Modelling brief, Addendum 30). The Add form for scenario adds, shown on the Labour (kind "staff") and Assets (kind "asset")
// pages in Model mode ONLY (renders nothing otherwise, so baseline mode is untouched). It adds a scratch staff member or asset to the scenario, lists what
// has been added, makes "N more" copies of an item and removes an item. Real data and the baseline never change: an added item is only an entry kept in
// mirra_scenarios_v1. All rules and messages come from scenarioAdds.js / modelScenarios.js; this file only collects what the owner types.
// Existing ui-system classes only (no inline colours). The Remove / Undo list for REAL items stays in ScenarioRemovalPanel.

import { useState } from "react";

import useScenarioAddControls from "@/hooks/useScenarioAddControls";
import { build_add_input, parse_copy_count, describe_add } from "@/lib/calculations/scenarioAddForm";

const TEXT = {
  staff: {
    article: "a",
    noun: "staff member",
    name_label: "Name or role",
    cost_label: "Annual cost of employing them ($)",
    none: "No staff added yet.",
    productive_option: "Productive - works in a working group and earns income",
    non_productive_option: "Non-productive - for example an office hire",
  },
  asset: {
    article: "an",
    noun: "asset",
    name_label: "Name",
    cost_label: "Annual cost of owning and running it ($)",
    none: "No assets added yet.",
    productive_option: "Productive - used in a working group to earn income",
    non_productive_option: "Non-productive - for example an idle vehicle",
  },
};

const EMPTY_FORM = { name: "", annual_cost: "", is_productive: "no", productive_hours: "", group_id: "" };

function AddedRow({ add, flag, group_names, controls }) {
  const [count, set_count] = useState("1");
  const [message, set_message] = useState("");

  function run(result) {
    set_message(result && result.ok === false ? result.message || "The change could not be saved." : "");
  }

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <div className="ui-row-between">
          <div className="ui-stack-sm">
            <div className="ui-label">{add.name}</div>
            <div className="ui-help">{describe_add(add, group_names)}</div>
            {flag === "baseline_changed" ? (
              <div className="ui-help">The baseline was corrected after this change was set. Check that it still makes sense.</div>
            ) : null}
          </div>
          <div className="ui-actions">
            <span className="ui-pill ui-pill-warning">{add.copy_of ? "Copy added in scenario" : "Added in scenario"}</span>
            <button type="button" className="ui-button-danger" onClick={() => run(controls.remove(add.id))}>
              Remove
            </button>
          </div>
        </div>

        <div className="ui-actions">
          <label className="ui-label" htmlFor={"copies_" + add.id}>
            Add more of this
          </label>
          <input
            id={"copies_" + add.id}
            className="ui-input"
            type="text"
            inputMode="numeric"
            value={count}
            onChange={(event) => set_count(event.target.value)}
          />
          <button type="button" className="ui-button-secondary" onClick={() => run(controls.copy(add.id, parse_copy_count(count)))}>
            Add copies
          </button>
        </div>

        {message ? <p className="ui-help">{message}</p> : null}
      </div>
    </div>
  );
}

export default function ScenarioAddPanel({ kind, heading = "Scenario: add" }) {
  const controls = useScenarioAddControls(kind);
  const [form, set_form] = useState(EMPTY_FORM);
  const [message, set_message] = useState("");

  if (!controls.active) return null;

  const words = TEXT[kind] || TEXT.staff;
  const is_productive = form.is_productive === "yes";

  function change(field, value) {
    set_form((current) => ({ ...current, [field]: value }));
  }

  function submit() {
    const result = controls.add(
      build_add_input({
        kind,
        name: form.name,
        annual_cost: form.annual_cost,
        is_productive,
        productive_hours: form.productive_hours,
        group_id: form.group_id,
      })
    );
    if (result && result.ok) {
      set_form(EMPTY_FORM);
      set_message("Added to the scenario.");
    } else {
      set_message((result && result.message) || "The change could not be saved.");
    }
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Scenario</div>
          <h2 className="ui-card-title">{heading}</h2>
          <p className="ui-help">
            Add {words.article} {words.noun} to see what the business looks like with them. Your real data does not change, and Remove returns exactly to the
            modelled numbers. A non-productive cost is shared across all working groups by their recovery hours. A productive one goes entirely into the
            working group you choose.
          </p>

          <div className="ui-split-2">
            <div className="ui-field">
              <label className="ui-label" htmlFor={"add_name_" + kind}>{words.name_label}</label>
              <input id={"add_name_" + kind} className="ui-input" type="text" value={form.name} onChange={(event) => change("name", event.target.value)} />
            </div>

            <div className="ui-field">
              <label className="ui-label" htmlFor={"add_cost_" + kind}>{words.cost_label}</label>
              <input
                id={"add_cost_" + kind}
                className="ui-input"
                type="text"
                inputMode="decimal"
                value={form.annual_cost}
                onChange={(event) => change("annual_cost", event.target.value)}
              />
            </div>

            <div className="ui-field">
              <label className="ui-label" htmlFor={"add_type_" + kind}>Kind of cost</label>
              <select id={"add_type_" + kind} className="ui-select" value={form.is_productive} onChange={(event) => change("is_productive", event.target.value)}>
                <option value="no">{words.non_productive_option}</option>
                <option value="yes">{words.productive_option}</option>
              </select>
            </div>

            {is_productive ? (
              <div className="ui-field">
                <label className="ui-label" htmlFor={"add_hours_" + kind}>Productive hours a year</label>
                <input
                  id={"add_hours_" + kind}
                  className="ui-input"
                  type="text"
                  inputMode="decimal"
                  value={form.productive_hours}
                  onChange={(event) => change("productive_hours", event.target.value)}
                />
              </div>
            ) : null}

            {is_productive ? (
              <div className="ui-field">
                <label className="ui-label" htmlFor={"add_group_" + kind}>Working group</label>
                <select id={"add_group_" + kind} className="ui-select" value={form.group_id} onChange={(event) => change("group_id", event.target.value)}>
                  <option value="">Choose a working group</option>
                  {controls.groups.map((group) => (
                    <option key={group.group_id} value={group.group_id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
                {controls.groups.length === 0 ? (
                  <p className="ui-help">No working groups were found. Create one in Cost Allocation, or add this as non-productive.</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="ui-actions">
            <button type="button" className="ui-button-primary" onClick={submit}>
              Add to scenario
            </button>
          </div>

          {message ? <p className="ui-help">{message}</p> : null}

          {controls.items.length === 0 ? (
            <p className="ui-help">{words.none}</p>
          ) : (
            <div className="ui-stack-sm">
              {controls.items.map((add) => (
                <AddedRow key={add.id} add={add} flag={controls.flags[add.id] || ""} group_names={controls.group_names} controls={controls} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
