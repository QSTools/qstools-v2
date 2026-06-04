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
  const [division_name, set_division_name] = useState("");
  const [division_description, set_division_description] = useState("");
  const [first_group_name, set_first_group_name] = useState("");

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

    set_division_name("");
    set_division_description("");
    set_first_group_name("");
  }

  return (
    <form onSubmit={handle_submit} className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Create division and first operating group
          </p>
          <p className="ui-help">
            Create the division, then immediately create the first crew, team,
            machine setup, or working unit inside it.
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

        <div>
          <button type="submit" className="ui-button">
            Create division and group
          </button>
        </div>

        <p className="ui-help">
          You can add more groups inside the division after it has been created.
        </p>
      </div>
    </form>
  );
}