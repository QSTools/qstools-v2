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

  function add_staff_to_group(group, staff_id) {
    if (!staff_id) {
      return;
    }

    const current_ids = Array.isArray(group?.required_staff_ids)
      ? group.required_staff_ids
      : [];

    if (current_ids.includes(staff_id)) {
      return;
    }

    update_operational_group(group.group_id, {
      required_staff_ids: [...current_ids, staff_id],
      required_staff_count: current_ids.length + 1,
    });
  }

  function remove_staff_from_group(group, staff_id) {
    const current_ids = Array.isArray(group?.required_staff_ids)
      ? group.required_staff_ids
      : [];

    const next_ids = current_ids.filter((id) => id !== staff_id);

    update_operational_group(group.group_id, {
      required_staff_ids: next_ids,
      required_staff_count: next_ids.length,
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
            <GroupEditor
              key={group.group_id}
              group={group}
              asset_rows={groups?.asset_rows ?? []}
              staff_rows={groups?.staff_rows ?? []}
              toggle_asset={toggle_asset}
              add_staff_to_group={add_staff_to_group}
              remove_staff_from_group={remove_staff_from_group}
              update_operational_group={update_operational_group}
              remove_operational_group={remove_operational_group}
            />
          ))
        )}
      </div>
    </section>
  );
}

function GroupEditor({
  group,
  asset_rows,
  staff_rows,
  toggle_asset,
  add_staff_to_group,
  remove_staff_from_group,
  update_operational_group,
  remove_operational_group,
}) {
  const required_staff_ids = Array.isArray(group?.required_staff_ids)
    ? group.required_staff_ids
    : [];

  const selected_staff_rows = staff_rows.filter((staff) =>
    required_staff_ids.includes(staff.staff_id)
  );

  const available_staff_rows = staff_rows.filter(
    (staff) => !required_staff_ids.includes(staff.staff_id)
  );

  function handle_staff_select(event) {
    const staff_id = event.target.value;

    if (!staff_id) {
      return;
    }

    add_staff_to_group(group, staff_id);
    event.target.value = "";
  }

  return (
    <div className="ui-panel">
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

        <div className="ui-stack">
          <span className="ui-label">Required assets</span>

          {asset_rows.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No active productive assets available.
            </p>
          ) : (
            asset_rows.map((asset) => {
              const is_checked = (group.required_asset_ids ?? []).includes(
                asset.asset_id
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
            })
          )}
        </div>

        <div className="ui-stack">
          <span className="ui-label">Required staff</span>

          <label className="block">
            <select className="ui-input" defaultValue="" onChange={handle_staff_select}>
              <option value="">Select staff to add</option>
              {available_staff_rows.map((staff) => (
                <option key={staff.staff_id} value={staff.staff_id}>
                  {staff.staff_name}
                  {staff.staff_role ? ` — ${staff.staff_role}` : ""}
                </option>
              ))}
            </select>
          </label>

          {selected_staff_rows.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No staff selected yet.
            </p>
          ) : (
            selected_staff_rows.map((staff) => (
              <div key={staff.staff_id} className="ui-readonly">
                <div className="ui-actions">
                  <div>
                    <div className="text-sm text-[var(--text-primary)]">
                      {staff.staff_name}
                      {staff.staff_role ? ` — ${staff.staff_role}` : ""}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Required group staff
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={() => remove_staff_from_group(group, staff.staff_id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
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

          {group.missing_staff_ids?.length > 0 ? (
            <div className="text-sm text-[var(--text-secondary)]">
              Missing staff: {group.missing_staff_ids.join(", ")}
            </div>
          ) : null}

          <div className="text-sm text-[var(--text-secondary)]">
            Required staff selected: {required_staff_ids.length}
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
  );
}