"use client";

import { useMemo, useState } from "react";

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function getGroupId(group) {
  return group?.group_id || group?.operational_group_id || group?.id;
}

function getStaffId(staff) {
  return staff?.staff_id || staff?.id || staff?.value;
}

function getAssetId(asset) {
  return asset?.asset_id || asset?.id || asset?.value;
}

function getStaffLabel(staff) {
  return (
    staff?.staff_name ||
    staff?.name ||
    staff?.label ||
    staff?.labour_type_label ||
    staff?.staff_role ||
    "Unnamed staff"
  );
}

function getAssetLabel(asset) {
  return asset?.asset_name || asset?.name || asset?.label || "Unnamed asset";
}

function uniqueById(rows, getId) {
  const seen = new Set();

  return rows.filter((row) => {
    const id = getId(row);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normaliseStaffOptions(groups) {
  const raw_rows = [
    ...(groups?.staff_options || []),
    ...(groups?.active_staff || []),
    ...(groups?.available_staff || []),
    ...(groups?.staff_rows || []),
    ...(groups?.productive_labour_type_rows || []),
  ];

  return uniqueById(raw_rows, getStaffId).map((staff) => ({
    ...staff,
    staff_id: getStaffId(staff),
    staff_name: getStaffLabel(staff),
  }));
}

function normaliseAssetOptions(groups) {
  const raw_rows = [
    ...(groups?.asset_options || []),
    ...(groups?.active_assets || []),
    ...(groups?.available_assets || []),
    ...(groups?.asset_rows || []),
    ...(groups?.productive_assets || []),
  ];

  return uniqueById(raw_rows, getAssetId).map((asset) => ({
    ...asset,
    asset_id: getAssetId(asset),
    asset_name: getAssetLabel(asset),
  }));
}

function getGroupStaffIds(group) {
  if (Array.isArray(group?.required_staff_ids)) return group.required_staff_ids;
  if (Array.isArray(group?.staff_ids)) return group.staff_ids;
  if (Array.isArray(group?.selected_staff_ids)) return group.selected_staff_ids;

  if (Array.isArray(group?.staff_recovery_rows)) {
    return group.staff_recovery_rows.map((staff) => staff.staff_id).filter(Boolean);
  }

  return [];
}

function getGroupAssetIds(group) {
  if (Array.isArray(group?.required_asset_ids)) return group.required_asset_ids;
  if (Array.isArray(group?.asset_ids)) return group.asset_ids;
  if (Array.isArray(group?.selected_asset_ids)) return group.selected_asset_ids;

  if (Array.isArray(group?.asset_recovery_rows)) {
    return group.asset_recovery_rows.map((asset) => asset.asset_id).filter(Boolean);
  }

  return [];
}

function getSelectedStaffRows(group, staff_options) {
  if (Array.isArray(group?.selected_staff_rows)) return group.selected_staff_rows;
  if (Array.isArray(group?.staff_rows)) return group.staff_rows;
  if (Array.isArray(group?.staff_recovery_rows)) return group.staff_recovery_rows;

  const ids = getGroupStaffIds(group);

  return ids.map((staff_id) => {
    return (
      staff_options.find((staff) => staff.staff_id === staff_id) || {
        staff_id,
        staff_name: staff_id,
      }
    );
  });
}

function getSelectedAssetRows(group, asset_options) {
  if (Array.isArray(group?.selected_asset_rows)) return group.selected_asset_rows;
  if (Array.isArray(group?.asset_rows)) return group.asset_rows;
  if (Array.isArray(group?.asset_recovery_rows)) return group.asset_recovery_rows;

  const ids = getGroupAssetIds(group);

  return ids.map((asset_id) => {
    return (
      asset_options.find((asset) => asset.asset_id === asset_id) || {
        asset_id,
        asset_name: asset_id,
      }
    );
  });
}

function StatusPill({ children }) {
  return <span className="ui-pill">{children}</span>;
}

function EmptyState() {
  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        No working units created yet
      </p>
      <p className="mt-1 ui-help">
        Create one working unit for each real crew, setup, or operating unit
        that produces revenue.
      </p>
    </div>
  );
}

function WorkingUnitSummary({ groups }) {
  const rows = Array.isArray(groups?.rows) ? groups.rows : [];
  const valid_groups = Number(groups?.valid_operational_groups || 0);
  const invalid_groups = Number(groups?.invalid_operational_groups || 0);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="ui-readonly">
        <span className="ui-label">Working units</span>
        <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
          {formatCount(rows.length)}
        </div>
      </div>

      <div className="ui-readonly">
        <span className="ui-label">Ready units</span>
        <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
          {formatCount(valid_groups)}
        </div>
      </div>

      <div className="ui-readonly">
        <span className="ui-label">Units needing review</span>
        <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
          {formatCount(invalid_groups)}
        </div>
      </div>
    </div>
  );
}

function CreateWorkingUnitForm({ add_operational_group }) {
  const [group_name, set_group_name] = useState("");

  function handleCreate() {
    const cleaned_name = group_name.trim();

    if (!cleaned_name || !add_operational_group) return;

    add_operational_group({
      group_name: cleaned_name,
      required_staff_ids: [],
      required_asset_ids: [],
      is_active: true,
    });

    set_group_name("");
  }

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Create working unit</p>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            Build one real crew or setup
          </h4>
          <p className="ui-help">
            A working unit is what actually produces revenue. It might be a pump
            crew, a gib fixing crew, a coffee truck setup, a retail floor setup,
            or a production station.
          </p>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Working unit name</span>
          <input
            className="ui-input"
            value={group_name}
            onChange={(event) => set_group_name(event.target.value)}
            placeholder="Example: Boom pump crew"
          />
        </label>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleCreate}
          disabled={!group_name.trim()}
        >
          Create working unit
        </button>

        <p className="ui-help">
          Do not add owner, admin, office, or non-productive support here unless
          they are actually doing the productive work. Those costs are carried
          through overhead burden.
        </p>
      </div>
    </div>
  );
}

function WorkingUnitEditor({
  group,
  staff_options,
  asset_options,
  update_operational_group,
  remove_operational_group,
}) {
  const group_id = getGroupId(group);
  const staff_ids = getGroupStaffIds(group);
  const asset_ids = getGroupAssetIds(group);

  const selected_staff_rows = getSelectedStaffRows(group, staff_options);
  const selected_asset_rows = getSelectedAssetRows(group, asset_options);

  const [selected_staff_id, set_selected_staff_id] = useState("");
  const [selected_asset_id, set_selected_asset_id] = useState("");

  function updateGroup(patch) {
    if (!update_operational_group || !group_id) return;
    update_operational_group(group_id, patch);
  }

  function handleNameChange(value) {
    updateGroup({ group_name: value });
  }

  function addStaff(staff_id) {
    if (!staff_id) return;

    const next_staff_ids = Array.from(new Set([...staff_ids, staff_id]));

    updateGroup({
      required_staff_ids: next_staff_ids,
    });

    set_selected_staff_id("");
  }

  function removeStaff(staff_id) {
    const next_staff_ids = staff_ids.filter((id) => id !== staff_id);

    updateGroup({
      required_staff_ids: next_staff_ids,
    });
  }

  function addAsset(asset_id) {
    if (!asset_id) return;

    const next_asset_ids = Array.from(new Set([...asset_ids, asset_id]));

    updateGroup({
      required_asset_ids: next_asset_ids,
    });

    set_selected_asset_id("");
  }

  function removeAsset(asset_id) {
    const next_asset_ids = asset_ids.filter((id) => id !== asset_id);

    updateGroup({
      required_asset_ids: next_asset_ids,
    });
  }

  function handleRemoveGroup() {
    if (!remove_operational_group || !group_id) return;
    remove_operational_group(group_id);
  }

  const has_labour = staff_ids.length > 0;
  const has_assets = asset_ids.length > 0;
  const is_ready = has_labour || has_assets;

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div className="ui-actions">
          <div>
            <p className="ui-kicker">Working unit</p>
            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              {group?.group_name || "Unnamed working unit"}
            </h4>
            <p className="ui-help">
              This is one real crew or setup that will be reviewed for running
              cost, overhead burden, and minimum recoverable rate.
            </p>
          </div>

          <StatusPill>{is_ready ? "Ready for review" : "Needs setup"}</StatusPill>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Working unit name</span>
          <input
            className="ui-input"
            value={group?.group_name || ""}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Example: Trailer pump crew"
          />
        </label>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Productive labour
              </p>
              <p className="ui-help">
                Select the labour that actually does the productive work for
                this unit.
              </p>
            </div>

            <div className="ui-actions">
              <select
                className="ui-input"
                value={selected_staff_id}
                onChange={(event) => {
                  const value = event.target.value;
                  set_selected_staff_id(value);
                  addStaff(value);
                }}
              >
                <option value="">Add productive labour...</option>
                {staff_options
                  .filter((staff) => !staff_ids.includes(staff.staff_id))
                  .map((staff) => (
                    <option key={staff.staff_id} value={staff.staff_id}>
                      {staff.staff_name}
                    </option>
                  ))}
              </select>
            </div>

            {selected_staff_rows.length === 0 ? (
              <p className="ui-help">No productive labour selected yet.</p>
            ) : (
              <div className="ui-stack-sm">
                {selected_staff_rows.map((staff) => {
                  const staff_id = getStaffId(staff);

                  return (
                    <div key={staff_id} className="ui-readonly">
                      <div className="ui-actions">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {getStaffLabel(staff)}
                          </p>
                          {staff?.labour_type_label || staff?.staff_role ? (
                            <p className="ui-help">
                              {staff.labour_type_label || staff.staff_role}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className="ui-button-secondary"
                          onClick={() => removeStaff(staff_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Productive assets
              </p>
              <p className="ui-help">
                Select the assets used by this unit to produce revenue.
              </p>
            </div>

            <div className="ui-actions">
              <select
                className="ui-input"
                value={selected_asset_id}
                onChange={(event) => {
                  const value = event.target.value;
                  set_selected_asset_id(value);
                  addAsset(value);
                }}
              >
                <option value="">Add productive asset...</option>
                {asset_options
                  .filter((asset) => !asset_ids.includes(asset.asset_id))
                  .map((asset) => (
                    <option key={asset.asset_id} value={asset.asset_id}>
                      {asset.asset_name}
                    </option>
                  ))}
              </select>
            </div>

            {selected_asset_rows.length === 0 ? (
              <p className="ui-help">
                No productive assets selected. This is fine for labour-only
                businesses.
              </p>
            ) : (
              <div className="ui-stack-sm">
                {selected_asset_rows.map((asset) => {
                  const asset_id = getAssetId(asset);

                  return (
                    <div key={asset_id} className="ui-readonly">
                      <div className="ui-actions">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {getAssetLabel(asset)}
                          </p>
                          {asset?.asset_type ? (
                            <p className="ui-help">{asset.asset_type}</p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className="ui-button-secondary"
                          onClick={() => removeAsset(asset_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            What happens next?
          </p>
          <p className="mt-1 ui-help">
            After this unit is created, the Review section will show the running
            cost, overhead burden, and minimum recoverable rate for this working
            unit.
          </p>
        </div>

        <button
          type="button"
          className="ui-button-danger"
          onClick={handleRemoveGroup}
        >
          Delete working unit
        </button>
      </div>
    </div>
  );
}

export default function CostAllocationGroupsCard({
  groups,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
}) {
  const rows = Array.isArray(groups?.rows) ? groups.rows : [];

  const staff_options = useMemo(() => normaliseStaffOptions(groups), [groups]);
  const asset_options = useMemo(() => normaliseAssetOptions(groups), [groups]);

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Working units</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Create the crews or setups that produce revenue
          </h3>
          <p className="ui-help">
            A working unit is the real combination of productive labour and
            productive assets used to deliver work or operate the business.
          </p>
          <p className="ui-help">
            This is not a price. This defines what Cost Allocation will calculate
            a minimum recoverable rate for.
          </p>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Simple examples
          </p>
          <p className="mt-1 ui-help">
            Pump crew = operator + pump + ute if required. Gib fixing crew =
            productive staff. Coffee truck unit = operator + truck + machine +
            oven.
          </p>
        </div>

        <WorkingUnitSummary groups={groups} />

        <CreateWorkingUnitForm add_operational_group={add_operational_group} />

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="ui-stack">
            {rows.map((group) => (
              <WorkingUnitEditor
                key={getGroupId(group) || group.group_name}
                group={group}
                staff_options={staff_options}
                asset_options={asset_options}
                update_operational_group={update_operational_group}
                remove_operational_group={remove_operational_group}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}