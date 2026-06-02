"use client";

import { getGroupId } from "./costAllocationGroupHelpers";

export default function CostAllocationGroupHeader({
  group,
  update_operational_group,
  remove_operational_group,
}) {
  const group_id = getGroupId(group);

  function updateName(value) {
    if (!update_operational_group || !group_id) {
      return;
    }

    update_operational_group(group_id, {
      group_name: value,
    });
  }

  function removeGroup() {
    if (!remove_operational_group || !group_id) {
      return;
    }

    remove_operational_group(group_id);
  }

  return (
    <div className="cost-allocation-group-header">
      <div className="ui-stack-sm">
        <label className="ui-stack-sm">
          <span className="ui-label">Operating group name</span>
          <input
            className="ui-input"
            value={group?.group_name || ""}
            onChange={(event) => updateName(event.target.value)}
            placeholder="Unnamed operating group"
          />
        </label>

        <p className="ui-help">
          Build this group by adding productive labour groups, assets, and
          overhead below.
        </p>
      </div>

      <button type="button" className="ui-button-danger" onClick={removeGroup}>
        Delete group
      </button>
    </div>
  );
}