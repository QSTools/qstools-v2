"use client";

import { useMemo, useState } from "react";

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

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getGroupId(group) {
  return group?.group_id || group?.operational_group_id || group?.id;
}

function getGroupName(group) {
  return group?.group_name || group?.operational_group_name || "Unnamed group";
}

function getAssetId(row) {
  return row?.asset_id || row?.id || "";
}

function getAssetName(row) {
  return row?.asset_name || row?.name || "Productive asset";
}

function getAvailableAssetCost(row) {
  return Number(
    row?.remaining_asset_cost ??
      row?.available_asset_cost ??
      row?.asset_recovery_cost_annual ??
      row?.total_asset_cost_annual ??
      row?.cost_allocation_asset_cost_annual ??
      0
  );
}

function getAvailableAssetHours(row) {
  return Number(
    row?.remaining_asset_hours ??
      row?.available_asset_hours ??
      row?.asset_recovery_hours_used ??
      row?.utilisation_hours_annual ??
      row?.utilisation_hours ??
      0
  );
}

function normaliseAssetRows(asset_assignment) {
  const rows =
    asset_assignment?.productive_asset_rows ||
    asset_assignment?.asset_rows ||
    asset_assignment?.rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function normaliseGroupRows(groups) {
  const rows = groups?.rows || groups?.operational_groups || [];
  return Array.isArray(rows) ? rows : [];
}

function AssetPoolSummary({ asset_assignment }) {
  const available_cost = Number(
    asset_assignment?.available_asset_cost ??
      asset_assignment?.productive_asset_pool?.available_asset_cost ??
      asset_assignment?.total_available_asset_cost ??
      0
  );

  const assigned_cost = Number(
    asset_assignment?.assigned_asset_cost ??
      asset_assignment?.productive_asset_pool?.assigned_asset_cost ??
      asset_assignment?.total_assigned_asset_cost ??
      0
  );

  const remaining_cost = Number(
    asset_assignment?.remaining_asset_cost ??
      asset_assignment?.productive_asset_pool?.remaining_asset_cost ??
      asset_assignment?.total_remaining_asset_cost ??
      available_cost - assigned_cost
  );

  const over_allocated_cost = Number(
    asset_assignment?.over_allocated_asset_cost ??
      asset_assignment?.productive_asset_pool?.over_allocated_asset_cost ??
      asset_assignment?.total_over_allocated_asset_cost ??
      Math.max(0, assigned_cost - available_cost)
  );

  const allocation_status =
    asset_assignment?.allocation_status ||
    asset_assignment?.productive_asset_pool?.allocation_status ||
    "review_required";

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Productive Asset Pool
          </p>
          <p className="ui-help">
            This pool comes from Assets. Cost Allocation only assigns it into
            operating groups.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Available asset cost</div>
              <div className="ui-help">Source pool from Assets.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(available_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Assigned asset cost</div>
              <div className="ui-help">Moved into operating groups.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(assigned_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Remaining asset cost</div>
              <div className="ui-help">Still in the default holding pool.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(remaining_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              <div>Over-assigned asset cost</div>
              <div className="ui-help">
                Must be zero before downstream trust.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(over_allocated_cost)}
            </div>
          </div>
        </div>

        <div className="ui-readonly">
          <span className="ui-label">Asset pool status</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {allocation_status}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssetRow({ row }) {
  const available_cost = getAvailableAssetCost(row);
  const available_hours = getAvailableAssetHours(row);

  return (
    <div className="ui-readonly">
      <div className="ui-actions">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {getAssetName(row)}
          </p>
          <p className="ui-help">
            Available {formatMoney(available_cost)}
            {available_hours > 0 ? ` · ${formatNumber(available_hours)} hrs` : ""}
          </p>
        </div>

        <span className="ui-pill">
          {row?.asset_type || "productive"}
        </span>
      </div>
    </div>
  );
}

function AssignmentForm({
  asset_rows,
  group_rows,
  add_asset_assignment,
}) {
  const [selected_asset_id, set_selected_asset_id] = useState("");
  const [selected_group_id, set_selected_group_id] = useState("");
  const [assignment_percent, set_assignment_percent] = useState("");

  const selected_asset = asset_rows.find(
    (row) => getAssetId(row) === selected_asset_id
  );

  const selected_group = group_rows.find(
    (group) => getGroupId(group) === selected_group_id
  );

  const preview_percent = Number(assignment_percent || 0);
  const preview_cost =
    getAvailableAssetCost(selected_asset) * (preview_percent / 100);

  function handleAddAssignment() {
    if (
      !add_asset_assignment ||
      !selected_asset_id ||
      !selected_group_id ||
      Number(assignment_percent || 0) <= 0
    ) {
      return;
    }

    add_asset_assignment({
      group_id: selected_group_id,
      asset_id: selected_asset_id,
      assignment_percent: Number(assignment_percent || 0),
    });

    set_selected_asset_id("");
    set_selected_group_id("");
    set_assignment_percent("");
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Add asset assignment
          </p>
          <p className="ui-help">
            Assign a percentage of a productive asset into an operating group.
            Shared assets can be split across groups, but total assignment must
            not exceed 100%.
          </p>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Productive asset</span>
          <select
            className="ui-input"
            value={selected_asset_id}
            onChange={(event) => set_selected_asset_id(event.target.value)}
          >
            <option value="">Select productive asset</option>
            {asset_rows.map((row) => {
              const asset_id = getAssetId(row);

              return (
                <option key={asset_id} value={asset_id}>
                  {getAssetName(row)}
                </option>
              );
            })}
          </select>
        </label>

        <label className="ui-stack-sm">
          <span className="ui-label">Operating group</span>
          <select
            className="ui-input"
            value={selected_group_id}
            onChange={(event) => set_selected_group_id(event.target.value)}
          >
            <option value="">Select operating group</option>
            {group_rows.map((group) => {
              const group_id = getGroupId(group);

              return (
                <option key={group_id} value={group_id}>
                  {getGroupName(group)}
                </option>
              );
            })}
          </select>
        </label>

        <label className="ui-stack-sm">
          <span className="ui-label">Assignment percent</span>
          <input
            className="ui-input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={assignment_percent}
            onChange={(event) => set_assignment_percent(event.target.value)}
            placeholder="Example: 50"
          />
        </label>

        <div className="ui-readonly">
          <span className="ui-label">Preview only</span>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {selected_asset && selected_group ? (
              <>
                {getAssetName(selected_asset)} → {getGroupName(selected_group)}
              </>
            ) : (
              "Select asset and group to preview assignment."
            )}
          </p>
          <p className="mt-1 ui-help">
            Estimated assigned cost: {formatMoney(preview_cost)} at{" "}
            {formatPercent(preview_percent)}. Final assigned cost must come from
            the calculation layer.
          </p>
        </div>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleAddAssignment}
          disabled={
            !selected_asset_id ||
            !selected_group_id ||
            Number(assignment_percent || 0) <= 0
          }
        >
          Add asset assignment
        </button>
      </div>
    </div>
  );
}

function ExistingAssignments({
  asset_assignment,
  group_rows,
  asset_rows,
  remove_asset_assignment,
}) {
  const assignments =
    asset_assignment?.assignments ||
    asset_assignment?.asset_group_assignments ||
    [];

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return (
      <div className="ui-readonly">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          No asset assignments yet.
        </p>
        <p className="mt-1 ui-help">
          Assigned assets will appear here once productive assets are moved from
          the default holding pool into operating groups.
        </p>
      </div>
    );
  }

  return (
    <div className="ui-stack-sm">
      {assignments.map((assignment) => {
        const group = group_rows.find(
          (item) => getGroupId(item) === assignment.group_id
        );

        const asset = asset_rows.find(
          (item) => getAssetId(item) === assignment.asset_id
        );

        const assignment_id =
          assignment.assignment_id ||
          assignment.asset_assignment_id ||
          `${assignment.group_id}-${assignment.asset_id}`;

        return (
          <div key={assignment_id} className="ui-readonly">
            <div className="ui-actions">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {getAssetName(asset || assignment)} →{" "}
                  {getGroupName(group || assignment)}
                </p>
                <p className="ui-help">
                  {formatPercent(assignment.assignment_percent)} ·{" "}
                  {formatMoney(assignment.assigned_asset_cost)}
                </p>
              </div>

              {remove_asset_assignment ? (
                <button
                  type="button"
                  className="ui-button-danger"
                  onClick={() => remove_asset_assignment(assignment_id)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CostAllocationAssetAssignmentCard({
  asset_assignment,
  groups,
  add_asset_assignment,
  remove_asset_assignment,
}) {
  const asset_rows = useMemo(
    () => normaliseAssetRows(asset_assignment),
    [asset_assignment]
  );

  const group_rows = useMemo(() => normaliseGroupRows(groups), [groups]);

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Productive asset assignment</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Assign productive assets into operating groups
          </h3>
          <p className="ui-help">
            Productive assets come from the Assets module. Cost Allocation moves
            them into operating groups but does not create asset cost or rebuild
            asset calculations.
          </p>
        </div>

        <AssetPoolSummary asset_assignment={asset_assignment} />

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Available productive assets
              </p>
              <p className="ui-help">
                These rows should come from Assets-owned productive asset values.
              </p>
            </div>

            {asset_rows.length === 0 ? (
              <p className="ui-help">
                No productive asset rows are available yet.
              </p>
            ) : (
              <div className="ui-stack-sm">
                {asset_rows.map((row) => (
                  <AssetRow key={getAssetId(row)} row={row} />
                ))}
              </div>
            )}
          </div>
        </div>

        <AssignmentForm
          asset_rows={asset_rows}
          group_rows={group_rows}
          add_asset_assignment={add_asset_assignment}
        />

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Existing asset assignments
              </p>
              <p className="ui-help">
                Assignments should reconcile against the Productive Asset Pool.
              </p>
            </div>

            <ExistingAssignments
              asset_assignment={asset_assignment}
              group_rows={group_rows}
              asset_rows={asset_rows}
              remove_asset_assignment={remove_asset_assignment}
            />
          </div>
        </div>

        <p className="ui-help">
          Over-assigned productive assets must block downstream trust. Remaining
          assets must stay visible in the default holding pool.
        </p>
      </div>
    </section>
  );
}