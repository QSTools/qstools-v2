"use client";

import { useMemo, useState } from "react";

import CostAllocationGroupLabourBuilder from "@/components/cost-allocation/groups/CostAllocationGroupLabourBuilder";
import CostAllocationGroupAssetBuilder from "@/components/cost-allocation/groups/CostAllocationGroupAssetBuilder";

function getRows(value) {
  if (Array.isArray(value?.rows)) {
    return value.rows.filter((row) => row?.is_active !== false);
  }

  if (Array.isArray(value)) {
    return value.filter((row) => row?.is_active !== false);
  }

  return [];
}

function makeLocalId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function AccordionCard({
  title,
  subtitle,
  kicker,
  is_open,
  on_toggle,
  children,
}) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div className="ui-actions">
          <div>
            <h3 className="text-lg font-semibold text-[var(--accent)]">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {subtitle}
            </p>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_toggle}
            >
              {is_open ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {is_open ? (
          <div className="ui-readonly">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">{kicker}</p>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                  {subtitle}
                </h2>
              </div>

              {children}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <select
        className="ui-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="ui-field">
      <span className="ui-label">{label}</span>
      <input
        className="ui-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectedContext({ selected_division, selected_group }) {
  if (!selected_division && !selected_group) {
    return null;
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        {selected_division ? (
          <div>
            <span className="ui-label">Selected division</span>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {selected_division.division_name || "Unnamed division"}
            </p>
          </div>
        ) : null}

        {selected_group ? (
          <div>
            <span className="ui-label">Selected operating group</span>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {selected_group.group_name || "Unnamed operating group"}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CurrentSelectionCard({
  division_rows,
  groups_for_selected_division,
  selected_division_id,
  selected_group_id,
  selected_division,
  selected_group,
  set_selected_division_id,
  set_selected_group_id,
  set_open_section,
}) {
  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="ui-kicker">Current selection</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Choose the operating area and working unit you are currently building.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="ui-field">
            <span className="ui-label">Operating area</span>
            <select
              className="ui-input"
              value={selected_division_id}
              onChange={(event) => {
                set_selected_division_id(event.target.value);
                set_selected_group_id("");
                set_open_section("group");
              }}
            >
              <option value="">Select operating area</option>
              {division_rows.map((division) => (
                <option key={division.division_id} value={division.division_id}>
                  {division.division_name || "Unnamed operating area"}
                </option>
              ))}
            </select>
            <p className="mt-1 ui-help">
              {selected_division?.division_name || "No operating area selected"}
            </p>
          </label>

          <label className="ui-field">
            <span className="ui-label">Working unit</span>
            <select
              className="ui-input"
              value={selected_group_id}
              onChange={(event) => {
                set_selected_group_id(event.target.value);

                if (event.target.value) {
                  set_open_section("labour");
                }
              }}
              disabled={!selected_division_id}
            >
              <option value="">Select working unit</option>
              {groups_for_selected_division.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.group_name || "Unnamed working unit"}
                </option>
              ))}
            </select>
            <p className="mt-1 ui-help">
              {selected_group?.group_name || "No working unit selected"}
            </p>
          </label>
        </div>
      </div>
    </div>
  );
}
function GroupRecoveryBasisCard({
  selected_group,
  update_operational_group,
}) {
  if (!selected_group) {
    return null;
  }

  const group_id = selected_group.group_id || "";
  const recovery_source =
    selected_group.group_recovery_hour_source || "labour_hours";
  const manual_hours = selected_group.manual_group_recovery_hours || "";

  function updateRecoverySource(value) {
    if (!group_id || typeof update_operational_group !== "function") {
      return;
    }

    update_operational_group(group_id, {
      group_recovery_hour_source: value,
    });
  }

  function updateManualHours(value) {
    if (!group_id || typeof update_operational_group !== "function") {
      return;
    }

    update_operational_group(group_id, {
      manual_group_recovery_hours: value,
    });
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Group recovery basis
          </p>
          <p className="ui-help">
            Choose the hours used to spread labour, asset, and overhead cost for
            this working unit.
          </p>
        </div>

        <label className="ui-field">
          <span className="ui-label">Recover this group over</span>
          <select
            className="ui-input"
            value={recovery_source}
            onChange={(event) => updateRecoverySource(event.target.value)}
          >
            <option value="labour_hours">Labour hours</option>
            <option value="asset_hours">Asset hours</option>
            <option value="manual_hours">Manual hours</option>
          </select>
        </label>

        {recovery_source === "manual_hours" ? (
          <label className="ui-field">
            <span className="ui-label">Manual annual recovery hours</span>
            <input
              className="ui-input"
              value={manual_hours}
              onChange={(event) => updateManualHours(event.target.value)}
              placeholder="Example: 1600"
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
function AutomaticOverheadNote() {
  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        Overhead allocation is automatic
      </p>
      <p className="mt-1 ui-help">
        Overhead is distributed from the operating structure after labour and
        assets are assigned. There is no manual overhead input in this step.
      </p>
    </div>
  );
}

export default function CostAllocationStepBuilder({
  divisions,
  groups,
  labour_assignment,
  asset_assignment,
  add_division,
  add_operational_group,
  update_operational_group,
  add_labour_assignment,
  remove_labour_assignment,
  add_asset_assignment,
  remove_asset_assignment,
}) {
  const division_rows = getRows(divisions);
  const group_rows = getRows(groups);

  const [open_section, set_open_section] = useState("division");

  const [selected_division_id, set_selected_division_id] = useState(
    division_rows[0]?.division_id || ""
  );

  const [selected_group_id, set_selected_group_id] = useState("");

  const [division_name, set_division_name] = useState("");
  const [division_description, set_division_description] = useState("");

  const [group_name, set_group_name] = useState("");
  const [group_description, set_group_description] = useState("");

  const selected_division = useMemo(() => {
    return (
      division_rows.find(
        (division) => division?.division_id === selected_division_id
      ) || null
    );
  }, [division_rows, selected_division_id]);

  const groups_for_selected_division = useMemo(() => {
    return group_rows.filter(
      (group) =>
        (group?.division_id || "main_operations") ===
        (selected_division_id || "main_operations")
    );
  }, [group_rows, selected_division_id]);

  const selected_group = useMemo(() => {
    return (
      group_rows.find((group) => group?.group_id === selected_group_id) || null
    );
  }, [group_rows, selected_group_id]);

  function toggle_section(section_key) {
    set_open_section((current) => (current === section_key ? "" : section_key));
  }

  function resetGroupForm() {
    set_selected_group_id("");
    set_group_name("");
    set_group_description("");
  }

  function handle_create_division(event) {
    event.preventDefault();

    const trimmed_name = division_name.trim();

    if (!trimmed_name || typeof add_division !== "function") {
      return;
    }

    const division_id = makeLocalId("division");

    add_division({
      division_id,
      division_name: trimmed_name,
      division_description: division_description.trim(),
    });

    set_selected_division_id(division_id);
    set_selected_group_id("");
    set_division_name("");
    set_division_description("");
    set_open_section("group");
  }

  function handle_create_group(event) {
    event.preventDefault();

    const trimmed_name = group_name.trim();

    if (
      !trimmed_name ||
      !selected_division_id ||
      typeof add_operational_group !== "function"
    ) {
      return;
    }

    const group_id = makeLocalId("group");

    add_operational_group({
      group_id,
      division_id: selected_division_id,
      group_name: trimmed_name,
      group_description: group_description.trim(),
    });

    set_selected_group_id(group_id);
    set_group_name("");
    set_group_description("");
    set_open_section("labour");
  }

  return (
    <div className="ui-stack">
      <CurrentSelectionCard
        division_rows={division_rows}
        groups_for_selected_division={groups_for_selected_division}
        selected_division_id={selected_division_id}
        selected_group_id={selected_group_id}
        selected_division={selected_division}
        selected_group={selected_group}
        set_selected_division_id={set_selected_division_id}
        set_selected_group_id={set_selected_group_id}
        set_open_section={set_open_section}
      />

      <AccordionCard
        title="Step 1"
        subtitle="Choose operating area"
        kicker="Operating area setup"
        is_open={open_section === "division"}
        on_toggle={() => toggle_section("division")}
      >
        <p className="ui-help">
          Create or select the operating area you want to build. The selected area controls the working units shown in the next step.
        </p>

        <form onSubmit={handle_create_division} className="ui-stack-sm">
          <TextField
            label="Operating area name"
            value={division_name}
            onChange={set_division_name}
            placeholder="Main Operations"
          />

          <TextField
            label="Operating area description"
            value={division_description}
            onChange={set_division_description}
            placeholder="Optional"
          />

          <button type="submit" className="ui-button">
            Create operating area
          </button>
        </form>
      </AccordionCard>

      <AccordionCard
        title="Step 2"
        subtitle="Choose working unit"
        kicker="Selected operating area workspace"
        is_open={open_section === "group"}
        on_toggle={() => toggle_section("group")}
      >
        {!selected_division ? (
          <div className="ui-readonly">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Create or select an operating area first.
            </p>
          </div>
        ) : (
          <>
            <p className="ui-help">
              Create a crew, team, machine setup, or working unit inside{" "}
              <strong>{selected_division.division_name}</strong>.
            </p>

            <form onSubmit={handle_create_group} className="ui-stack-sm">
              <TextField
                label="Working unit name"
                value={group_name}
                onChange={set_group_name}
                placeholder="Pump crew 1"
              />

              <TextField
                label="Working unit description"
                value={group_description}
                onChange={set_group_description}
                placeholder="Optional"
              />

              <button type="submit" className="ui-button">
                Create working unit
              </button>
            </form>

            <GroupRecoveryBasisCard
              selected_group={selected_group}
              update_operational_group={update_operational_group}
            />
          </>
        )}
      </AccordionCard>

      <AccordionCard
        title="Step 3"
        subtitle="Assign labour"
        kicker="Labour allocation"
        is_open={open_section === "labour"}
        on_toggle={() => toggle_section("labour")}
      >
        {!selected_group ? (
          <div className="ui-readonly">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Create or select a working unit first.
            </p>
          </div>
        ) : (
          <>
            <SelectedContext
              selected_division={selected_division}
              selected_group={selected_group}
            />

            <CostAllocationGroupLabourBuilder
              group_id={selected_group_id}
              labour_assignment={labour_assignment}
              add_labour_assignment={add_labour_assignment}
              remove_labour_assignment={remove_labour_assignment}
            />

            <div className="ui-actions">
              <button
                type="button"
                className="ui-button-secondary"
                onClick={() => set_open_section("assets")}
              >
                Continue to assets
              </button>
            </div>
          </>
        )}
      </AccordionCard>

      <AccordionCard
        title="Step 4"
        subtitle="Assign assets"
        kicker="Asset allocation"
        is_open={open_section === "assets"}
        on_toggle={() => toggle_section("assets")}
      >
        {!selected_group ? (
          <div className="ui-readonly">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Create or select a working unit first.
            </p>
          </div>
        ) : (
          <>
            <SelectedContext
              selected_division={selected_division}
              selected_group={selected_group}
            />

            <CostAllocationGroupAssetBuilder
              group_id={selected_group_id}
              asset_assignment={asset_assignment}
              add_asset_assignment={add_asset_assignment}
              remove_asset_assignment={remove_asset_assignment}
            />

            <AutomaticOverheadNote />

            <div className="ui-actions">
              <button
                type="button"
                className="ui-button-secondary"
                onClick={() => {
                  resetGroupForm();
                  set_open_section("group");
                }}
              >
                Add another operating group
              </button>

              <button
                type="button"
                className="ui-button-secondary"
                onClick={() => {
                  set_selected_division_id("");
                  resetGroupForm();
                  set_open_section("division");
                }}
              >
                Add another division
              </button>
            </div>
          </>
        )}
      </AccordionCard>
    </div>
  );
}


























