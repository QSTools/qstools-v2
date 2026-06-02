"use client";

import { useState } from "react";

import {
  formatMoney,
  formatNumber,
  formatWholePercent,
  getAssignmentId,
  getLabourAssignments,
  getLabourGroupId,
  getLabourGroupName,
  getLabourGroupRemainingPercent,
  getLabourRows,
  getResolvedLabourAssignment,
} from "./costAllocationGroupHelpers";

export default function CostAllocationGroupLabourBuilder({
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