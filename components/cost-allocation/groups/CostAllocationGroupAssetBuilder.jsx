"use client";

import { useState } from "react";

import {
  formatMoney,
  formatWholePercent,
  getAssetAssignments,
  getAssetId,
  getAssetName,
  getAssetRemainingPercent,
  getAssetRows,
  getAssignmentId,
  getResolvedAssetAssignment,
} from "./costAllocationGroupHelpers";

export default function CostAllocationGroupAssetBuilder({
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