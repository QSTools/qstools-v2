"use client";

import { useMemo, useState } from "react";

import CostAllocationGroupLabourBuilder from "@/components/cost-allocation/groups/CostAllocationGroupLabourBuilder";
import CostAllocationGroupAssetBuilder from "@/components/cost-allocation/groups/CostAllocationGroupAssetBuilder";
import AccordionCard from "@/components/cost-allocation/steps/AccordionCard";
import AutomaticOverheadNote from "@/components/cost-allocation/steps/AutomaticOverheadNote";
import CurrentSelectionCard from "@/components/cost-allocation/steps/CurrentSelectionCard";
import GroupRecoveryBasisCard from "@/components/cost-allocation/steps/GroupRecoveryBasisCard";
import SelectedContext from "@/components/cost-allocation/steps/SelectedContext";
import TextField from "@/components/cost-allocation/steps/TextField";
import { getRows, makeLocalId } from "@/components/cost-allocation/steps/stepBuilderHelpers";

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
