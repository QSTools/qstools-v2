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

function getStaffTypeId(row) {
  return (
    row?.staff_type_id ||
    row?.labour_type_id ||
    row?.labour_type_key ||
    row?.staff_id ||
    row?.id
  );
}

function getStaffTypeName(row) {
  return (
    row?.staff_type_name ||
    row?.labour_type_label ||
    row?.staff_name ||
    row?.name ||
    "Productive labour"
  );
}

function getAvailableHours(row) {
  return Number(
    row?.remaining_hours ??
      row?.available_hours ??
      row?.total_productive_hours ??
      row?.productive_hours ??
      0
  );
}

function getAvailableCost(row) {
  return Number(
    row?.remaining_cost ??
      row?.available_cost ??
      row?.total_annual_cost ??
      row?.total_productive_labour_cost ??
      row?.annual_labour_cost ??
      0
  );
}

function getWeightedRate(row) {
  return Number(
    row?.weighted_productive_hourly_rate ??
      row?.weighted_hourly_cost_rate ??
      row?.weighted_recovery_rate ??
      row?.productive_labour_cost_rate ??
      0
  );
}

function normaliseLabourRows(labour_assignment) {
  const rows =
    labour_assignment?.productive_staff_type_rates ||
    labour_assignment?.productive_labour_rows ||
    labour_assignment?.rows ||
    labour_assignment?.labour_rows ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function normaliseGroupRows(groups) {
  const rows = groups?.rows || groups?.operational_groups || [];
  return Array.isArray(rows) ? rows : [];
}

function LabourPoolSummary({ labour_assignment }) {
  const available_cost = Number(
    labour_assignment?.available_labour_cost ??
      labour_assignment?.productive_labour_pool?.available_labour_cost ??
      labour_assignment?.total_available_labour_cost ??
      0
  );

  const assigned_cost = Number(
    labour_assignment?.assigned_labour_cost ??
      labour_assignment?.productive_labour_pool?.assigned_labour_cost ??
      labour_assignment?.total_assigned_labour_cost ??
      0
  );

  const remaining_cost = Number(
    labour_assignment?.remaining_labour_cost ??
      labour_assignment?.productive_labour_pool?.remaining_labour_cost ??
      labour_assignment?.total_remaining_labour_cost ??
      available_cost - assigned_cost
  );

  const over_allocated_cost = Number(
    labour_assignment?.over_allocated_labour_cost ??
      labour_assignment?.productive_labour_pool?.over_allocated_labour_cost ??
      labour_assignment?.total_over_allocated_labour_cost ??
      Math.max(0, assigned_cost - available_cost)
  );

  const available_hours = Number(
    labour_assignment?.available_labour_hours ??
      labour_assignment?.productive_labour_pool?.available_labour_hours ??
      labour_assignment?.total_available_labour_hours ??
      0
  );

  const assigned_hours = Number(
    labour_assignment?.assigned_labour_hours ??
      labour_assignment?.productive_labour_pool?.assigned_labour_hours ??
      labour_assignment?.total_assigned_labour_hours ??
      0
  );

  const remaining_hours = Number(
    labour_assignment?.remaining_labour_hours ??
      labour_assignment?.productive_labour_pool?.remaining_labour_hours ??
      labour_assignment?.total_remaining_labour_hours ??
      available_hours - assigned_hours
  );

  const allocation_status =
    labour_assignment?.allocation_status ||
    labour_assignment?.productive_labour_pool?.allocation_status ||
    "review_required";

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Productive Labour Pool
          </p>
          <p className="ui-help">
            This pool comes from Labour. Cost Allocation only assigns it into
            operating groups.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Available labour cost</div>
              <div className="ui-help">Source pool from Labour.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(available_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Assigned labour cost</div>
              <div className="ui-help">Moved into operating groups.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(assigned_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Remaining labour cost</div>
              <div className="ui-help">Still in the default holding pool.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(remaining_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              <div>Over-assigned labour cost</div>
              <div className="ui-help">
                Must be zero before downstream trust.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(over_allocated_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Available / assigned hours</div>
              <div className="ui-help">Productive labour hours only.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatNumber(assigned_hours)} / {formatNumber(available_hours)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Remaining hours</div>
              <div className="ui-help">Unassigned productive labour hours.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatNumber(remaining_hours)}
            </div>
          </div>
        </div>

        <div className="ui-readonly">
          <span className="ui-label">Labour pool status</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {allocation_status}
          </p>
        </div>
      </div>
    </div>
  );
}

function LabourTypeRow({ row }) {
  const available_hours = getAvailableHours(row);
  const available_cost = getAvailableCost(row);
  const weighted_rate = getWeightedRate(row);

  return (
    <div className="ui-readonly">
      <div className="ui-actions">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {getStaffTypeName(row)}
          </p>
          <p className="ui-help">
            Available {formatNumber(available_hours)} hrs ·{" "}
            {formatMoney(available_cost)}
          </p>
        </div>

        <span className="ui-pill">{formatMoney(weighted_rate)}/hr</span>
      </div>
    </div>
  );
}

function AssignmentForm({
  labour_rows,
  group_rows,
  add_labour_assignment,
}) {
  const [selected_staff_type_id, set_selected_staff_type_id] = useState("");
  const [selected_group_id, set_selected_group_id] = useState("");
  const [assigned_hours, set_assigned_hours] = useState("");

  const selected_labour_row = labour_rows.find(
    (row) => getStaffTypeId(row) === selected_staff_type_id
  );

  const selected_group = group_rows.find(
    (group) => getGroupId(group) === selected_group_id
  );

  const weighted_rate = getWeightedRate(selected_labour_row);
  const calculated_cost = Number(assigned_hours || 0) * weighted_rate;

  function handleAddAssignment() {
    if (
      !add_labour_assignment ||
      !selected_staff_type_id ||
      !selected_group_id ||
      Number(assigned_hours || 0) <= 0
    ) {
      return;
    }

    add_labour_assignment({
      group_id: selected_group_id,
      staff_type_id: selected_staff_type_id,
      assigned_hours: Number(assigned_hours || 0),
    });

    set_selected_staff_type_id("");
    set_selected_group_id("");
    set_assigned_hours("");
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Add labour assignment
          </p>
          <p className="ui-help">
            Assign productive labour hours into an operating group. The cost
            should be calculated from the Labour-owned weighted rate in the
            calculation layer.
          </p>
        </div>

        <label className="ui-stack-sm">
          <span className="ui-label">Productive labour type</span>
          <select
            className="ui-input"
            value={selected_staff_type_id}
            onChange={(event) => set_selected_staff_type_id(event.target.value)}
          >
            <option value="">Select productive labour</option>
            {labour_rows.map((row) => {
              const staff_type_id = getStaffTypeId(row);

              return (
                <option key={staff_type_id} value={staff_type_id}>
                  {getStaffTypeName(row)}
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
          <span className="ui-label">Assigned hours</span>
          <input
            className="ui-input"
            type="number"
            min="0"
            step="0.01"
            value={assigned_hours}
            onChange={(event) => set_assigned_hours(event.target.value)}
            placeholder="Example: 1200"
          />
        </label>

        <div className="ui-readonly">
          <span className="ui-label">Preview only</span>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {selected_labour_row && selected_group ? (
              <>
                {getStaffTypeName(selected_labour_row)} →{" "}
                {getGroupName(selected_group)}
              </>
            ) : (
              "Select labour and group to preview assignment."
            )}
          </p>
          <p className="mt-1 ui-help">
            Estimated cost: {formatMoney(calculated_cost)}. Final assigned cost
            must come from the calculation layer.
          </p>
        </div>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleAddAssignment}
          disabled={
            !selected_staff_type_id ||
            !selected_group_id ||
            Number(assigned_hours || 0) <= 0
          }
        >
          Add labour assignment
        </button>
      </div>
    </div>
  );
}

function ExistingAssignments({
  labour_assignment,
  group_rows,
  labour_rows,
  remove_labour_assignment,
}) {
  const assignments =
    labour_assignment?.assignments ||
    labour_assignment?.labour_group_assignments ||
    [];

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return (
      <div className="ui-readonly">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          No labour assignments yet.
        </p>
        <p className="mt-1 ui-help">
          Assigned labour will appear here once productive labour is moved from
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

        const labour_row = labour_rows.find(
          (item) =>
            getStaffTypeId(item) ===
            (assignment.staff_type_id || assignment.labour_type_id)
        );

        const assignment_id =
          assignment.assignment_id ||
          assignment.labour_assignment_id ||
          `${assignment.group_id}-${assignment.staff_type_id}`;

        return (
          <div key={assignment_id} className="ui-readonly">
            <div className="ui-actions">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {getStaffTypeName(labour_row || assignment)} →{" "}
                  {getGroupName(group || assignment)}
                </p>
                <p className="ui-help">
                  {formatNumber(assignment.assigned_hours)} hrs ·{" "}
                  {formatMoney(assignment.assigned_cost)}
                  {assignment.assignment_percent !== undefined
                    ? ` · ${formatPercent(assignment.assignment_percent)}`
                    : ""}
                </p>
              </div>

              {remove_labour_assignment ? (
                <button
                  type="button"
                  className="ui-button-danger"
                  onClick={() => remove_labour_assignment(assignment_id)}
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

export default function CostAllocationLabourAssignmentCard({
  labour_assignment,
  groups,
  add_labour_assignment,
  remove_labour_assignment,
}) {
  const labour_rows = useMemo(
    () => normaliseLabourRows(labour_assignment),
    [labour_assignment]
  );

  const group_rows = useMemo(() => normaliseGroupRows(groups), [groups]);

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Productive labour assignment</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Assign productive labour into operating groups
          </h3>
          <p className="ui-help">
            Productive labour comes from the Labour module. Cost Allocation moves
            it into operating groups but does not create labour cost or rebuild
            labour rates.
          </p>
        </div>

        <LabourPoolSummary labour_assignment={labour_assignment} />

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Available productive labour
              </p>
              <p className="ui-help">
                These rows should come from Labour-owned productive staff type
                rates.
              </p>
            </div>

            {labour_rows.length === 0 ? (
              <p className="ui-help">
                No productive labour rows are available yet.
              </p>
            ) : (
              <div className="ui-stack-sm">
                {labour_rows.map((row) => (
                  <LabourTypeRow key={getStaffTypeId(row)} row={row} />
                ))}
              </div>
            )}
          </div>
        </div>

        <AssignmentForm
          labour_rows={labour_rows}
          group_rows={group_rows}
          add_labour_assignment={add_labour_assignment}
        />

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Existing labour assignments
              </p>
              <p className="ui-help">
                Assignments should reconcile against the Productive Labour Pool.
              </p>
            </div>

            <ExistingAssignments
              labour_assignment={labour_assignment}
              group_rows={group_rows}
              labour_rows={labour_rows}
              remove_labour_assignment={remove_labour_assignment}
            />
          </div>
        </div>

        <p className="ui-help">
          Over-assigned productive labour must block downstream trust. Remaining
          labour must stay visible in the default holding pool.
        </p>
      </div>
    </section>
  );
}