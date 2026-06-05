"use client";

import { useState } from "react";

function generate_local_id(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function CostAllocationCreateDivisionForm({
  add_division,
  add_operational_group,
}) {
  const [is_open, set_is_open] = useState(false);
  const [division_name, set_division_name] = useState("");
  const [division_description, set_division_description] = useState("");
  const [first_group_name, set_first_group_name] = useState("");

  function reset_form() {
    set_division_name("");
    set_division_description("");
    set_first_group_name("");
  }

  function handle_cancel() {
    reset_form();
    set_is_open(false);
  }

  function handle_submit(event) {
    event.preventDefault();

    const trimmed_division_name = division_name.trim();
    const trimmed_group_name = first_group_name.trim();

    if (!trimmed_division_name || typeof add_division !== "function") {
      return;
    }

    const division_id = generate_local_id("division");

    add_division({
      division_id,
      division_name: trimmed_division_name,
      division_description: division_description.trim(),
    });

    if (trimmed_group_name && typeof add_operational_group === "function") {
      add_operational_group({
        division_id,
        group_name: trimmed_group_name,
      });
    }

    reset_form();
    set_is_open(false);
  }

  if (!is_open) {
    return (
      <div className="ui-readonly">
        <div className="ui-actions">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Add another division
            </p>
            <p className="ui-help">
              Build the current division first. Add another division only when
              the next major operating area is ready to be built.
            </p>
          </div>

          <button
            type="button"
            className="ui-button"
            onClick={() => set_is_open(true)}
          >
            Add division
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handle_submit} className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Create division
          </p>
          <p className="ui-help">
            Create one division, then complete its operating groups before
            moving to the next division.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="ui-field">
            <span className="ui-label">Division name</span>
            <input
              className="ui-input"
              value={division_name}
              onChange={(event) => set_division_name(event.target.value)}
              placeholder="Pumping"
            />
          </label>

          <label className="ui-field">
            <span className="ui-label">Division description</span>
            <input
              className="ui-input"
              value={division_description}
              onChange={(event) =>
                set_division_description(event.target.value)
              }
              placeholder="Optional"
            />
          </label>

          <label className="ui-field">
            <span className="ui-label">First operating group</span>
            <input
              className="ui-input"
              value={first_group_name}
              onChange={(event) => set_first_group_name(event.target.value)}
              placeholder="Pump crew 1"
            />
          </label>
        </div>

        <div className="ui-actions">
          <button type="submit" className="ui-button">
            Create division and start group
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={handle_cancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}