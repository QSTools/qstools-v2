"use client";

import { useState } from "react";

export default function CostAllocationDivisionHeader({
  division,
  update_division,
  remove_division,
}) {
  const [is_editing, set_is_editing] = useState(false);
  const [division_name, set_division_name] = useState(
    division?.division_name || ""
  );
  const [division_description, set_division_description] = useState(
    division?.division_description || ""
  );

  const division_id = division?.division_id || "";
  const is_default_division = division_id === "main_operations";

  function handle_save() {
    if (!division_id || typeof update_division !== "function") {
      return;
    }

    update_division(division_id, {
      division_name: division_name.trim() || "Unnamed division",
      division_description: division_description.trim(),
    });

    set_is_editing(false);
  }

  function handle_cancel() {
    set_division_name(division?.division_name || "");
    set_division_description(division?.division_description || "");
    set_is_editing(false);
  }

  function handle_remove() {
    if (
      !division_id ||
      is_default_division ||
      typeof remove_division !== "function"
    ) {
      return;
    }

    remove_division(division_id);
  }

  if (is_editing) {
    return (
      <div className="cost-allocation-group-header">
        <div className="ui-stack-sm">
          <label className="ui-field">
            <span className="ui-label">Division name</span>
            <input
              className="ui-input"
              value={division_name}
              onChange={(event) => set_division_name(event.target.value)}
            />
          </label>

          <label className="ui-field">
            <span className="ui-label">Description</span>
            <input
              className="ui-input"
              value={division_description}
              onChange={(event) =>
                set_division_description(event.target.value)
              }
            />
          </label>
        </div>

        <div className="ui-actions">
          <button type="button" className="ui-button" onClick={handle_save}>
            Save
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
    );
  }

  return (
    <div className="cost-allocation-group-header">
      <div>
        <p className="ui-kicker">Division</p>
        <h4 className="text-base font-semibold text-[var(--text-primary)]">
          {division?.division_name || "Unnamed division"}
        </h4>
        <p className="ui-help">
          {division?.division_description ||
            "Operating groups inside this division roll up into a division cost stack."}
        </p>
      </div>

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => set_is_editing(true)}
        >
          Edit division
        </button>

        {!is_default_division ? (
          <button
            type="button"
            className="ui-button-secondary"
            onClick={handle_remove}
          >
            Delete division
          </button>
        ) : null}
      </div>
    </div>
  );
}