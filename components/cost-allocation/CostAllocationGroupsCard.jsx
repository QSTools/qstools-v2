"use client";

import { useMemo, useState } from "react";

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

function formatWholePercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}

function getGroupId(group) {
  return group?.group_id || group?.operational_group_id || group?.id || "";
}

function getAssignmentId(assignment, fallback = "") {
  return (
    assignment?.assignment_id ||
    assignment?.labour_assignment_id ||
    assignment?.asset_assignment_id ||
    assignment?.overhead_assignment_id ||
    fallback
  );
}

function getLabourGroupId(row) {
  return (
    row?.staff_type_id ||
    row?.labour_type_id ||
    row?.labour_type_key ||
    row?.id ||
    ""
  );
}

function getLabourGroupName(row) {
  return (
    row?.staff_type_name ||
    row?.labour_type_label ||
    row?.labour_type_key ||
    row?.staff_type ||
    "Unclassified productive labour group"
  );
}

function getAssetId(row) {
  return row?.asset_id || row?.id || "";
}

function getAssetName(row) {
  return row?.asset_name || row?.name || "Productive asset";
}

function getGroupRows(groups) {
  return Array.isArray(groups?.rows)
    ? groups.rows.filter((group) => group?.is_active !== false)
    : [];
}

function getGroupCostRows(groups) {
  return Array.isArray(groups?.operational_group_cost_rows)
    ? groups.operational_group_cost_rows
    : [];
}

function getLabourRows(labour_assignment) {
  const rows =
    labour_assignment?.productive_labour_rows ||
    labour_assignment?.productive_staff_type_rates ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function getAssetRows(asset_assignment) {
  const rows =
    asset_assignment?.productive_asset_rows ||
    asset_assignment?.asset_rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function findLabourRowById(labour_assignment, labour_group_id) {
  const rows = getLabourRows(labour_assignment);

  return rows.find((row) => getLabourGroupId(row) === labour_group_id) || null;
}

function getLabourRowHours(row) {
  return Number(
    row?.total_productive_hours ??
      row?.available_hours ??
      row?.available_labour_hours ??
      row?.productive_hours ??
      row?.total_available_labour_hours ??
      0
  );
}

function getLabourRowCost(row) {
  return Number(
    row?.total_labour_cost ??
      row?.total_annual_cost ??
      row?.available_cost ??
      row?.available_labour_cost ??
      row?.total_productive_labour_cost ??
      row?.total_available_labour_cost ??
      0
  );
}

function getResolvedLabourAssignment({ assignment, labour_assignment }) {
  const staff_type_id =
    assignment?.staff_type_id ||
    assignment?.labour_type_id ||
    assignment?.labour_type_key ||
    "";

  const labour_row = findLabourRowById(labour_assignment, staff_type_id);

  const assignment_percent = Math.round(
    Number(assignment?.assignment_percent || 0)
  );

  const stored_assigned_hours = Number(
    assignment?.assigned_hours ??
      assignment?.assigned_labour_hours ??
      assignment?.productive_hours ??
      0
  );

  const stored_assigned_cost = Number(
    assignment?.assigned_cost ??
      assignment?.assigned_labour_cost ??
      assignment?.labour_cost ??
      0
  );

  const assigned_hours =
    stored_assigned_hours ||
    (labour_row
      ? getLabourRowHours(labour_row) * (assignment_percent / 100)
      : 0);

  const assigned_cost =
    stored_assigned_cost ||
    (labour_row
      ? getLabourRowCost(labour_row) * (assignment_percent / 100)
      : 0);

  const display_name = labour_row
    ? getLabourGroupName(labour_row)
    : assignment?.staff_type_name ||
      assignment?.labour_type_label ||
      "Old / unmatched labour group — remove and re-add";

  return {
    staff_type_id,
    labour_row,
    display_name,
    assignment_percent,
    assigned_hours,
    assigned_cost,
    is_unmatched: !labour_row,
  };
}

function findAssetRowById(asset_assignment, asset_id) {
  const rows = getAssetRows(asset_assignment);

  return rows.find((row) => getAssetId(row) === asset_id) || null;
}

function getAssetRowCost(row) {
  return Number(
    row?.asset_recovery_cost_annual ??
      row?.total_asset_cost_annual ??
      row?.cost_allocation_asset_cost_annual ??
      row?.available_asset_cost ??
      row?.total_available_asset_cost ??
      row?.asset_cost_annual ??
      row?.annual_asset_cost ??
      row?.total_annual_cost ??
      0
  );
}

function getResolvedAssetAssignment({ assignment, asset_assignment }) {
  const asset_id = assignment?.asset_id || "";

  const asset_row = findAssetRowById(asset_assignment, asset_id);

  const assignment_percent = Math.round(
    Number(assignment?.assignment_percent || 0)
  );

  const stored_assigned_cost = Number(
    assignment?.assigned_asset_cost ??
      assignment?.assigned_cost ??
      assignment?.asset_cost ??
      0
  );

  const assigned_asset_cost =
    stored_assigned_cost ||
    (asset_row
      ? getAssetRowCost(asset_row) * (assignment_percent / 100)
      : 0);

  const display_name = asset_row
    ? getAssetName(asset_row)
    : assignment?.asset_name || "Old / unmatched asset — remove and re-add";

  return {
    asset_id,
    asset_row,
    display_name,
    assignment_percent,
    assigned_asset_cost,
    is_unmatched: !asset_row,
  };
}

function getAllLabourAssignments(labour_assignment) {
  const rows =
    labour_assignment?.assignments ||
    labour_assignment?.labour_group_assignments ||
    [];

  return Array.isArray(rows)
    ? rows.filter((assignment) => assignment?.is_active !== false)
    : [];
}

function getLabourGroupAllocatedPercent(labour_assignment, labour_group_id) {
  return getAllLabourAssignments(labour_assignment).reduce(
    (sum, assignment) => {
      const assigned_staff_type_id =
        assignment?.staff_type_id ||
        assignment?.labour_type_id ||
        assignment?.labour_type_key ||
        "";

      if (assigned_staff_type_id !== labour_group_id) {
        return sum;
      }

      return sum + Math.round(Number(assignment?.assignment_percent || 0));
    },
    0
  );
}

function getLabourGroupRemainingPercent(labour_assignment, labour_group_id) {
  const allocated_percent = getLabourGroupAllocatedPercent(
    labour_assignment,
    labour_group_id
  );

  return Math.max(0, 100 - allocated_percent);
}

function getLabourAssignments(labour_assignment, group_id) {
  return getAllLabourAssignments(labour_assignment).filter(
    (assignment) => assignment?.group_id === group_id
  );
}

function getAllAssetAssignments(asset_assignment) {
  const rows =
    asset_assignment?.assignments ||
    asset_assignment?.asset_group_assignments ||
    [];

  return Array.isArray(rows)
    ? rows.filter((assignment) => assignment?.is_active !== false)
    : [];
}

function getAssetAllocatedPercent(asset_assignment, asset_id) {
  return getAllAssetAssignments(asset_assignment).reduce((sum, assignment) => {
    if (assignment?.asset_id !== asset_id) {
      return sum;
    }

    return sum + Math.round(Number(assignment?.assignment_percent || 0));
  }, 0);
}

function getAssetRemainingPercent(asset_assignment, asset_id) {
  const allocated_percent = getAssetAllocatedPercent(asset_assignment, asset_id);

  return Math.max(0, 100 - allocated_percent);
}

function getAssetAssignments(asset_assignment, group_id) {
  return getAllAssetAssignments(asset_assignment).filter(
    (assignment) => assignment?.group_id === group_id
  );
}

function getOverheadAssignments(overhead_assignment, group_id) {
  const rows =
    overhead_assignment?.assignments ||
    overhead_assignment?.overhead_group_assignments ||
    [];

  return Array.isArray(rows)
    ? rows.filter(
        (assignment) =>
          assignment?.is_active !== false && assignment?.group_id === group_id
      )
    : [];
}

function EmptyState() {
  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        No operating groups created yet.
      </p>
      <p className="mt-1 ui-help">
        Create the first crew, team, or working unit. Then add productive labour
        groups, assets, and overhead directly inside that group.
      </p>
    </div>
  );
}

function CreateOperatingGroupForm({ add_operational_group }) {
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

function GroupHeader({
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

function GroupCostSummary({ group_cost_row }) {
  return (
    <div className="ui-readonly cost-allocation-group-summary">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Group cost summary
          </p>
          <p className="ui-help">
            This is the cost currently assigned into this operating group.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Productive labour</div>
              <div className="ui-help">
                Assigned productive labour group cost.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.assigned_labour_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Assets</div>
              <div className="ui-help">Assigned productive asset burden.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.assigned_asset_burden)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Overhead</div>
              <div className="ui-help">Automatic overhead distribution.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.assigned_overhead_amount)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              <div>Total group cost</div>
              <div className="ui-help">
                Productive labour + assets + overhead.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(group_cost_row?.total_group_cost)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupLabourBuilder({
  group_id,
  labour_assignment,
  add_labour_assignment,
  remove_labour_assignment,
}) {
  const [labour_group_id, set_labour_group_id] = useState("");
  const [assignment_percent, set_assignment_percent] = useState("");

  const labour_rows = getLabourRows(labour_assignment);
  const assignments = getLabourAssignments(labour_assignment, group_id);

  const selected_remaining_percent = labour_group_id
    ? getLabourGroupRemainingPercent(labour_assignment, labour_group_id)
    : 0;

  function handleAdd() {
    if (!add_labour_assignment || !group_id || !labour_group_id) {
      return;
    }

    const percent = Math.round(Number(assignment_percent || 0));
    const remaining_percent = getLabourGroupRemainingPercent(
      labour_assignment,
      labour_group_id
    );

    if (percent <= 0 || remaining_percent <= 0) {
      return;
    }

    const capped_percent = Math.min(percent, remaining_percent);

    add_labour_assignment({
      group_id,
      staff_type_id: labour_group_id,
      assignment_percent: capped_percent,
    });

    set_labour_group_id("");
    set_assignment_percent("");
  }

  return (
    <div className="cost-allocation-assignment-block">
      <div className="ui-stack-sm">
        <div>
          <p className="cost-allocation-assignment-title">
            Productive labour group / crew
          </p>
          <p className="cost-allocation-assignment-help">
            Select the labour group or crew from the Labour module. Each labour
            group can only be allocated up to 100% across all operating groups.
          </p>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Crew / labour type</span>
          <select
            className="ui-input"
            value={labour_group_id}
            onChange={(event) => {
              set_labour_group_id(event.target.value);
              set_assignment_percent("");
            }}
          >
            <option value="">Select crew / labour type</option>
            {labour_rows.map((row) => {
              const id = getLabourGroupId(row);
              const remaining_percent = getLabourGroupRemainingPercent(
                labour_assignment,
                id
              );
              const is_fully_allocated = remaining_percent <= 0;

              return (
                <option key={id} value={id} disabled={is_fully_allocated}>
                  {getLabourGroupName(row)}
                  {is_fully_allocated
                    ? " — fully allocated"
                    : ` — ${remaining_percent}% remaining`}
                </option>
              );
            })}
          </select>
        </label>

        {labour_group_id ? (
          <div className="ui-readonly">
            <span className="ui-label">Available allocation</span>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {selected_remaining_percent}% remaining
            </p>
            <p className="mt-1 ui-help">
              You cannot assign more than the remaining percentage for this
              labour group.
            </p>
          </div>
        ) : null}

        <label className="ui-stack-sm">
          <span className="ui-label">Allocation percent</span>
          <input
            className="ui-input"
            type="number"
            min="1"
            max={selected_remaining_percent || 100}
            step="1"
            value={assignment_percent}
            onChange={(event) => {
              const next_value = Math.round(Number(event.target.value || 0));
              const capped_value =
                selected_remaining_percent > 0
                  ? Math.min(next_value, selected_remaining_percent)
                  : next_value;

              set_assignment_percent(
                capped_value > 0 ? String(capped_value) : ""
              );
            }}
            placeholder={
              selected_remaining_percent > 0
                ? `Max: ${selected_remaining_percent}`
                : "Example: 100"
            }
            disabled={!labour_group_id || selected_remaining_percent <= 0}
          />
          <p className="ui-help">
            Use whole numbers only. Example: 100 means this operating group uses
            all remaining capacity for this labour group.
          </p>
        </label>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleAdd}
          disabled={
            !labour_group_id ||
            selected_remaining_percent <= 0 ||
            Number(assignment_percent || 0) <= 0
          }
        >
          Add labour group
        </button>

        {assignments.length === 0 ? (
          <p className="ui-help">
            No productive labour group assigned to this operating group yet.
          </p>
        ) : (
          <div className="ui-stack-sm">
            {assignments.map((assignment) => {
              const resolved_assignment = getResolvedLabourAssignment({
                assignment,
                labour_assignment,
              });

              const id = getAssignmentId(
                assignment,
                `${group_id}-${resolved_assignment.staff_type_id}`
              );

              return (
                <div key={id} className="cost-allocation-assignment-row">
                  <div className="ui-actions">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {resolved_assignment.display_name}
                      </p>
                      <p className="ui-help">
                        {formatWholePercent(
                          resolved_assignment.assignment_percent
                        )}{" "}
                        · {formatNumber(resolved_assignment.assigned_hours)}{" "}
                        productive hrs ·{" "}
                        {formatMoney(resolved_assignment.assigned_cost)}
                      </p>

                      {resolved_assignment.is_unmatched ? (
                        <p className="ui-help">
                          This saved assignment no longer matches a current
                          Labour staff type. Remove and re-add it.
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="ui-button-danger"
                      onClick={() => remove_labour_assignment?.(id)}
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
  );
}

function GroupAssetBuilder({
  group_id,
  asset_assignment,
  add_asset_assignment,
  remove_asset_assignment,
}) {
  const [asset_id, set_asset_id] = useState("");
  const [assignment_percent, set_assignment_percent] = useState("");

  const asset_rows = getAssetRows(asset_assignment);
  const assignments = getAssetAssignments(asset_assignment, group_id);

  const selected_remaining_percent = asset_id
    ? getAssetRemainingPercent(asset_assignment, asset_id)
    : 0;

  function handleAdd() {
    if (!add_asset_assignment || !group_id || !asset_id) {
      return;
    }

    const percent = Math.round(Number(assignment_percent || 0));
    const remaining_percent = getAssetRemainingPercent(
      asset_assignment,
      asset_id
    );

    if (percent <= 0 || remaining_percent <= 0) {
      return;
    }

    const capped_percent = Math.min(percent, remaining_percent);

    add_asset_assignment({
      group_id,
      asset_id,
      assignment_percent: capped_percent,
    });

    set_asset_id("");
    set_assignment_percent("");
  }

  return (
    <div className="cost-allocation-assignment-block">
      <div className="ui-stack-sm">
        <div>
          <p className="cost-allocation-assignment-title">
            Productive assets
          </p>
          <p className="cost-allocation-assignment-help">
            Add productive asset allocation into this group. Each asset can only
            be allocated up to 100% across all operating groups.
          </p>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Productive asset</span>
          <select
            className="ui-input"
            value={asset_id}
            onChange={(event) => {
              set_asset_id(event.target.value);
              set_assignment_percent("");
            }}
          >
            <option value="">Select asset</option>
            {asset_rows.map((row) => {
              const id = getAssetId(row);
              const remaining_percent = getAssetRemainingPercent(
                asset_assignment,
                id
              );
              const is_fully_allocated = remaining_percent <= 0;

              return (
                <option key={id} value={id} disabled={is_fully_allocated}>
                  {getAssetName(row)}
                  {is_fully_allocated
                    ? " — fully allocated"
                    : ` — ${remaining_percent}% remaining`}
                </option>
              );
            })}
          </select>
        </label>

        {asset_id ? (
          <div className="ui-readonly">
            <span className="ui-label">Available allocation</span>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {selected_remaining_percent}% remaining
            </p>
            <p className="mt-1 ui-help">
              You cannot assign more than the remaining percentage for this
              asset.
            </p>
          </div>
        ) : null}

        <label className="ui-stack-sm">
          <span className="ui-label">Assignment percent</span>
          <input
            className="ui-input"
            type="number"
            min="1"
            max={selected_remaining_percent || 100}
            step="1"
            value={assignment_percent}
            onChange={(event) => {
              const next_value = Math.round(Number(event.target.value || 0));
              const capped_value =
                selected_remaining_percent > 0
                  ? Math.min(next_value, selected_remaining_percent)
                  : next_value;

              set_assignment_percent(
                capped_value > 0 ? String(capped_value) : ""
              );
            }}
            placeholder={
              selected_remaining_percent > 0
                ? `Max: ${selected_remaining_percent}`
                : "Example: 100"
            }
            disabled={!asset_id || selected_remaining_percent <= 0}
          />
          <p className="ui-help">
            Use whole numbers only. Example: 100 means this operating group uses
            all remaining allocation for this asset.
          </p>
        </label>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleAdd}
          disabled={
            !asset_id ||
            selected_remaining_percent <= 0 ||
            Number(assignment_percent || 0) <= 0
          }
        >
          Add asset
        </button>

        {assignments.length === 0 ? (
          <p className="ui-help">No assets assigned to this group yet.</p>
        ) : (
          <div className="ui-stack-sm">
            {assignments.map((assignment) => {
              const resolved_assignment = getResolvedAssetAssignment({
                assignment,
                asset_assignment,
              });

              const id = getAssignmentId(
                assignment,
                `${group_id}-${resolved_assignment.asset_id}`
              );

              return (
                <div key={id} className="cost-allocation-assignment-row">
                  <div className="ui-actions">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {resolved_assignment.display_name}
                      </p>
                      <p className="ui-help">
                        {formatWholePercent(
                          resolved_assignment.assignment_percent
                        )}{" "}
                        · {formatMoney(resolved_assignment.assigned_asset_cost)}
                      </p>

                      {resolved_assignment.is_unmatched ? (
                        <p className="ui-help">
                          This saved assignment no longer matches a current
                          Asset row. Remove and re-add it.
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="ui-button-danger"
                      onClick={() => remove_asset_assignment?.(id)}
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
  );
}

function GroupOverheadBuilder({ group_id, overhead_assignment }) {
  const assignments = getOverheadAssignments(overhead_assignment, group_id);
  const assignment = assignments[0] || null;

  return (
    <div className="cost-allocation-assignment-block">
      <div className="ui-stack-sm">
        <div>
          <p className="cost-allocation-assignment-title">Overhead</p>
          <p className="cost-allocation-assignment-help">
            Overhead is distributed automatically from the operating structure.
            It is not manually assigned here.
          </p>
        </div>

        {!assignment ? (
          <p className="ui-help">
            No overhead has been distributed to this group yet. Add labour or
            assets first, then the system will calculate the split.
          </p>
        ) : (
          <div className="cost-allocation-assignment-row">
            <div className="ui-stack-sm">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Automatic overhead distribution
                </p>
                <p className="ui-help">
                  {formatWholePercent(assignment.assignment_percent)} ·{" "}
                  {formatMoney(assignment.assigned_overhead_amount)}
                </p>
              </div>

              <p className="ui-help">
                Method:{" "}
                {assignment.allocation_method === "labour_cost_weighted"
                  ? "Labour cost weighted"
                  : assignment.allocation_method === "asset_burden_weighted"
                    ? "Asset burden weighted"
                    : "Equal split"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OperatingGroupBuilder({
  group,
  group_cost_row,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
  update_operational_group,
  remove_operational_group,
  add_labour_assignment,
  remove_labour_assignment,
  add_asset_assignment,
  remove_asset_assignment,
}) {
  const group_id = getGroupId(group);

  return (
    <div className="cost-allocation-operating-group-card">
      <div className="ui-stack">
        <GroupHeader
          group={group}
          update_operational_group={update_operational_group}
          remove_operational_group={remove_operational_group}
        />

        <GroupCostSummary group_cost_row={group_cost_row} />

        <GroupLabourBuilder
          group_id={group_id}
          labour_assignment={labour_assignment}
          add_labour_assignment={add_labour_assignment}
          remove_labour_assignment={remove_labour_assignment}
        />

        <GroupAssetBuilder
          group_id={group_id}
          asset_assignment={asset_assignment}
          add_asset_assignment={add_asset_assignment}
          remove_asset_assignment={remove_asset_assignment}
        />

        <GroupOverheadBuilder
          group_id={group_id}
          overhead_assignment={overhead_assignment}
        />
      </div>
    </div>
  );
}

export default function CostAllocationGroupsCard({
  groups,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
  add_labour_assignment,
  remove_labour_assignment,
  add_asset_assignment,
  remove_asset_assignment,
}) {
  const rows = getGroupRows(groups);

  const group_cost_rows = useMemo(() => getGroupCostRows(groups), [groups]);

  function getGroupCostRow(group_id) {
    return (
      group_cost_rows.find((row) => row?.group_id === group_id) || {
        group_id,
        assigned_labour_cost: 0,
        assigned_asset_burden: 0,
        assigned_overhead_amount: 0,
        total_group_cost: 0,
      }
    );
  }

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Operating groups</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Build each operating group in one place
          </h3>
          <p className="ui-help">
            Create a group, then add its productive labour groups, assets, and
            overhead directly inside the same card.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="ui-readonly">
            <span className="ui-label">Active operating groups</span>
            <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatCount(rows.length)}
            </div>
            <p className="mt-1 ui-help">
              Each group should represent a real crew, team, machine setup, or
              working unit.
            </p>
          </div>
        </div>

        <CreateOperatingGroupForm
          add_operational_group={add_operational_group}
        />

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="ui-stack">
            {rows.map((group) => {
              const group_id = getGroupId(group);

              return (
                <OperatingGroupBuilder
                  key={group_id}
                  group={group}
                  group_cost_row={getGroupCostRow(group_id)}
                  labour_assignment={labour_assignment}
                  asset_assignment={asset_assignment}
                  overhead_assignment={overhead_assignment}
                  update_operational_group={update_operational_group}
                  remove_operational_group={remove_operational_group}
                  add_labour_assignment={add_labour_assignment}
                  remove_labour_assignment={remove_labour_assignment}
                  add_asset_assignment={add_asset_assignment}
                  remove_asset_assignment={remove_asset_assignment}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}