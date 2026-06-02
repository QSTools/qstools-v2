"use client";

import { useState } from "react";

export default function CostAllocationCreateGroupForm({
  add_operational_group,
}) {
  const [group_name, set_group_name] = useState("");

  function handleCreate() {
    const cleaned_name = group_name.trim();

    if (!cleaned_name || !add_operational_group) {
      return;
    }

    add_operational_group(cleaned_name);
    set_group_name("");
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Create operating group
          </p>
          <p className="ui-help">
            Start with the real working unit, then build its productive labour
            groups, assets, and overhead below.
          </p>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Operating group name</span>
          <input
            className="ui-input"
            value={group_name}
            onChange={(event) => set_group_name(event.target.value)}
            placeholder="Example: Pump crew"
          />
        </label>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleCreate}
          disabled={!group_name.trim()}
        >
          Create operating group
        </button>
      </div>
    </div>
  );
}