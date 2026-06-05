"use client";

import { useMemo, useState } from "react";

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

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLabourGroupStaffCount(row) {
  return Math.max(
    safeNumber(
      row?.staff_count ??
        row?.productive_staff_count ??
        row?.active_staff_count ??
        row?.quantity ??
        row?.qty ??
        1
    ),
    1
  );
}

function getAssignmentStaffCount(assignment) {
  return Math.max(safeNumber(assignment?.assigned_staff_count), 0);
}

function getAssignedStaffCountForLabourGroup(assignments, labour_group_id) {
  return assignments
    .filter(
      (assignment) =>
        assignment?.staff_type_id === labour_group_id ||
        assignment?.labour_type_id === labour_group_id ||
        assignment?.labour_group_id === labour_group_id
    )
    .reduce(
      (total, assignment) => total + getAssignmentStaffCount(assignment),
      0
    );
}

function getRemainingStaffCount({ labour_rows, all_assignments, labour_group_id }) {
  const selected_row = labour_rows.find(
    (row) => getLabourGroupId(row) === labour_group_id
  );

  if (!selected_row) {
    return 0;
  }

  const total_staff_count = getLabourGroupStaffCount(selected_row);
  const assigned_staff_count = getAssignedStaffCountForLabourGroup(
    all_assignments,
    labour_group_id
  );

  return Math.max(total_staff_count - assigned_staff_count, 0);
}

function getAllLabourAssignments(labour_assignment) {
  if (Array.isArray(labour_assignment?.assignments)) {
    return labour_assignment.assignments.filter(
      (assignment) => assignment?.is_active !== false
    );
  }

  if (Array.isArray(labour_assignment?.labour_group_assignments)) {
    return labour_assignment.labour_group_assignments.filter(
      (assignment) => assignment?.is_active !== false
    );
  }

  return [];
}

export default function CostAllocationGroupLabourBuilder({
  group_id,
  labour_assignment,
  add_labour_assignment,
  remove_labour_assignment,
}) {
  const [labour_group_id, set_labour_group_id] = useState("");
  const [assigned_staff_count, set_assigned_staff_count] = useState("");
  const [assignment_percent, set_assignment_percent] = useState("");

  const labour_rows = getLabourRows(labour_assignment);
  const assignments = getLabourAssignments(labour_assignment, group_id);
  const all_assignments = getAllLabourAssignments(labour_assignment);

  const selected_labour_row = useMemo(() => {
    return labour_rows.find((row) => getLabourGroupId(row) === labour_group_id);
  }, [labour_rows, labour_group_id]);

  const selected_total_staff_count = selected_labour_row
    ? getLabourGroupStaffCount(selected_labour_row)
    : 0;

  const selected_remaining_staff_count = labour_group_id
    ? getRemainingStaffCount({
        labour_rows,
        all_assignments,
        labour_group_id,
      })
    : 0;

  const selected_remaining_percent = labour_group_id
    ? getLabourGroupRemainingPercent(labour_assignment, labour_group_id)
    : 0;

  function handleStaffCountChange(value) {
    const next_count = Math.round(safeNumber(value));
    const capped_count =
      selected_remaining_staff_count > 0
        ? Math.min(next_count, selected_remaining_staff_count)
        : next_count;

    if (capped_count <= 0) {
      set_assigned_staff_count("");
      set_assignment_percent("");
      return;
    }

    const next_percent =
      selected_total_staff_count > 0
        ? Math.round((capped_count / selected_total_staff_count) * 100)
        : 100;

    const capped_percent =
      selected_remaining_percent > 0
        ? Math.min(next_percent, selected_remaining_percent)
        : next_percent;

    set_assigned_staff_count(String(capped_count));
    set_assignment_percent(String(capped_percent));
  }

  function handlePercentChange(value) {
    const next_value = Math.round(safeNumber(value));
    const capped_value =
      selected_remaining_percent > 0
        ? Math.min(next_value, selected_remaining_percent)
        : next_value;

    set_assignment_percent(capped_value > 0 ? String(capped_value) : "");
  }

  function handleAdd() {
    if (!add_labour_assignment || !group_id || !labour_group_id) {
      return;
    }

    const staff_count = Math.round(safeNumber(assigned_staff_count));
    const percent = Math.round(safeNumber(assignment_percent));

    if (
      staff_count <= 0 ||
      percent <= 0 ||
      selected_remaining_staff_count <= 0 ||
      selected_remaining_percent <= 0
    ) {
      return;
    }

    const capped_staff_count = Math.min(
      staff_count,
      selected_remaining_staff_count
    );

    const capped_percent = Math.min(percent, selected_remaining_percent);

    add_labour_assignment({
      group_id,
      staff_type_id: labour_group_id,
      assigned_staff_count: capped_staff_count,
      assignment_percent: capped_percent,
    });

    set_labour_group_id("");
    set_assigned_staff_count("");
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
            Select the labour group or crew from the Labour module, then assign
            how many staff from that group belong in this operating group.
          </p>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Crew / labour type</span>
          <select
            className="ui-input"
            value={labour_group_id}
            onChange={(event) => {
              set_labour_group_id(event.target.value);
              set_assigned_staff_count("");
              set_assignment_percent("");
            }}
          >
            <option value="">Select crew / labour type</option>
            {labour_rows.map((row) => {
              const id = getLabourGroupId(row);
              const staff_count = getLabourGroupStaffCount(row);
              const remaining_staff_count = getRemainingStaffCount({
                labour_rows,
                all_assignments,
                labour_group_id: id,
              });
              const remaining_percent = getLabourGroupRemainingPercent(
                labour_assignment,
                id
              );
              const is_fully_allocated =
                remaining_staff_count <= 0 || remaining_percent <= 0;

              return (
                <option key={id} value={id} disabled={is_fully_allocated}>
                  {getLabourGroupName(row)}
                  {is_fully_allocated
                    ? " — fully allocated"
                    : ` — ${remaining_staff_count} of ${staff_count} staff remaining`}
                </option>
              );
            })}
          </select>
        </label>

        {labour_group_id ? (
          <div className="ui-readonly">
            <span className="ui-label">Available staff</span>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {formatNumber(selected_remaining_staff_count)} of{" "}
              {formatNumber(selected_total_staff_count)} staff remaining
            </p>
            <p className="mt-1 ui-help">
              You cannot assign more staff than the remaining quantity for this
              labour group.
            </p>
          </div>
        ) : null}

        <label className="ui-stack-sm">
          <span className="ui-label">Staff quantity to assign</span>
          <input
            className="ui-input"
            type="number"
            min="1"
            max={selected_remaining_staff_count || 1}
            step="1"
            value={assigned_staff_count}
            onChange={(event) => handleStaffCountChange(event.target.value)}
            placeholder={
              selected_remaining_staff_count > 0
                ? `Max: ${selected_remaining_staff_count}`
                : "Example: 2"
            }
            disabled={!labour_group_id || selected_remaining_staff_count <= 0}
          />
          <p className="ui-help">
            Example: if Site Crew has 3 staff and this group needs 2, enter 2.
          </p>
        </label>

        <label className="ui-stack-sm">
          <span className="ui-label">Allocation percent</span>
          <input
            className="ui-input"
            type="number"
            min="1"
            max={selected_remaining_percent || 100}
            step="1"
            value={assignment_percent}
            onChange={(event) => handlePercentChange(event.target.value)}
            placeholder={
              selected_remaining_percent > 0
                ? `Max: ${selected_remaining_percent}`
                : "Example: 100"
            }
            disabled={!labour_group_id || selected_remaining_percent <= 0}
          />
          <p className="ui-help">
            This is calculated from staff quantity, but can be adjusted if the
            group only uses part of those staff.
          </p>
        </label>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleAdd}
          disabled={
            !labour_group_id ||
            selected_remaining_staff_count <= 0 ||
            selected_remaining_percent <= 0 ||
            Number(assigned_staff_count || 0) <= 0 ||
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

              const staff_count = getAssignmentStaffCount(assignment);

              return (
                <div key={id} className="cost-allocation-assignment-row">
                  <div className="ui-actions">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {resolved_assignment.display_name}
                      </p>
                      <p className="ui-help">
                        {staff_count > 0
                          ? `${formatNumber(staff_count)} staff · `
                          : ""}
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