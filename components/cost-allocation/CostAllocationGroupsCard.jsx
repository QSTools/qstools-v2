"use client";

export default function CostAllocationGroupsCard({
  groups,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
}) {
  const active_groups = (groups?.rows ?? []).filter((group) => group?.is_active);

  function toggle_asset(group, asset_id) {
    const current_ids = Array.isArray(group?.required_asset_ids)
      ? group.required_asset_ids
      : [];

    const next_ids = current_ids.includes(asset_id)
      ? current_ids.filter((id) => id !== asset_id)
      : [...current_ids, asset_id];

    update_operational_group(group.group_id, {
      required_asset_ids: next_ids,
    });
  }

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div className="ui-actions">
          <div>
            <p className="ui-kicker">D. Operational groups</p>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Minimum viable delivery units
            </h3>
            <p className="ui-help">
              Groups validate what must work together. They are not pricing
              packages.
            </p>
          </div>

          <button
            type="button"
            className="ui-button-primary"
            onClick={add_operational_group}
          >
            Add group
          </button>
        </div>

        <div className="ui-readonly">
          <div className="text-sm text-[var(--text-primary)]">
            Total groups: {groups?.total_operational_groups ?? 0}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Valid: {groups?.valid_operational_groups ?? 0} · Invalid:{" "}
            {groups?.invalid_operational_groups ?? 0}
          </div>
        </div>

        {active_groups.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No operational groups yet.
          </p>
        ) : (
          active_groups.map((group) => (
            <div key={group.group_id} className="ui-panel">
              <div className="ui-stack">
                <label className="block">
                  <span className="ui-label">Group name</span>
                  <input
                    className="ui-input"
                    type="text"
                    value={group.group_name ?? ""}
                    onChange={(event) =>
                      update_operational_group(group.group_id, {
                        group_name: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="block">
                  <span className="ui-label">Required staff count</span>
                  <input
                    className="ui-input"
                    type="number"
                    min="0"
                    step="1"
                    value={group.required_staff_count ?? 0}
                    onChange={(event) =>
                      update_operational_group(group.group_id, {
                        required_staff_count: Number(event.target.value),
                      })
                    }
                  />
                </label>

                <div className="ui-stack">
                  <span className="ui-label">Required assets</span>
                  {(groups?.asset_rows ?? []).map((asset) => {
                    const is_checked = (group.required_asset_ids ?? []).includes(
                      asset.asset_id,
                    );

                    return (
                      <label key={asset.asset_id} className="block">
                        <span className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                          <input
                            type="checkbox"
                            checked={is_checked}
                            onChange={() => toggle_asset(group, asset.asset_id)}
                          />
                          {asset.asset_name}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="ui-readonly">
                  <div className="text-sm text-[var(--text-primary)]">
                    Status: {group.is_valid ? "Valid" : "Invalid"}
                  </div>
                  {group.missing_asset_ids?.length > 0 ? (
                    <div className="text-sm text-[var(--text-secondary)]">
                      Missing assets: {group.missing_asset_ids.join(", ")}
                    </div>
                  ) : null}
                  <div className="text-sm text-[var(--text-secondary)]">
                    Available staff count: {group.available_staff_count}
                  </div>
                </div>

                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={() => remove_operational_group(group.group_id)}
                  >
                    Remove group
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}