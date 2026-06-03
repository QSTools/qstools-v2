"use client";

import { useState } from "react";

export default function CostAllocationCreateDivisionForm({ add_division }) {
  const [division_name, set_division_name] = useState("");
  const [division_description, set_division_description] = useState("");

  function handle_submit(event) {
    event.preventDefault();

    const trimmed_name = division_name.trim();

    if (!trimmed_name || typeof add_division !== "function") {
      return;
    }

    add_division({
      division_name: trimmed_name,
      division_description: division_description.trim(),
    });

    set_division_name("");
    set_division_description("");
  }

  return (
    <form onSubmit={handle_submit} className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Create division
          </p>
          <p className="ui-help">
            Use divisions for major operating areas such as Pumping, Placing,
            Workshop, Retail, Kitchen, or Delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="ui-field">
            <span className="ui-label">Division name</span>
            <input
              className="ui-input"
              value={division_name}
              onChange={(event) => set_division_name(event.target.value)}
              placeholder="Main Operations"
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
              placeholder="Optional"
            />
          </label>
        </div>

        <div>
          <button type="submit" className="ui-button">
            Add division
          </button>
        </div>
      </div>
    </form>
  );
}