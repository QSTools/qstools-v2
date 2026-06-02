"use client";

import { useMemo, useState } from "react";

const METHOD_LABELS = {
  manual_amount: "Manual amount",
  manual_percent: "Manual percent",
  labour_cost_weighted: "Labour cost weighted",
  labour_hours_weighted: "Labour hours weighted",
  asset_burden_weighted: "Asset burden weighted",
  equal_split: "Equal split",
};

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
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

function normaliseGroupRows(groups) {
  const rows = groups?.rows || groups?.operational_groups || [];
  return Array.isArray(rows) ? rows : [];
}

function OverheadPoolSummary({ overhead_assignment }) {
  const available_overhead_cost = Number(
    overhead_assignment?.available_overhead_cost ??
      overhead_assignment?.overhead_pool?.available_overhead_cost ??
      0
  );

  const assigned_overhead_cost = Number(
    overhead_assignment?.assigned_overhead_cost ??
      overhead_assignment?.overhead_pool?.assigned_overhead_cost ??
      0
  );

  const remaining_overhead_cost = Number(
    overhead_assignment?.remaining_overhead_cost ??
      overhead_assignment?.overhead_pool?.remaining_overhead_cost ??
      available_overhead_cost - assigned_overhead_cost
  );

  const over_allocated_overhead_cost = Number(
    overhead_assignment?.over_allocated_overhead_cost ??
      overhead_assignment?.overhead_pool?.over_allocated_overhead_cost ??
      Math.max(0, assigned_overhead_cost - available_overhead_cost)
  );

  const allocation_status =
    overhead_assignment?.allocation_status ||
    overhead_assignment?.overhead_pool?.allocation_status ||
    "review_required";

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Overhead Pool
          </p>
          <p className="ui-help">
            This pool comes from the remaining overhead burden. Cost Allocation
            only distributes it into operating groups.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Available overhead</div>
              <div className="ui-help">Source overhead pool.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(available_overhead_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Assigned overhead</div>
              <div className="ui-help">Distributed into operating groups.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(assigned_overhead_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              <div>Remaining overhead</div>
              <div className="ui-help">Still in the default holding pool.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(remaining_overhead_cost)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              <div>Over-allocated overhead</div>
              <div className="ui-help">
                Must be zero before downstream trust.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatMoney(over_allocated_overhead_cost)}
            </div>
          </div>
        </div>

        <div className="ui-readonly">
          <span className="ui-label">Overhead pool status</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {allocation_status}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssignmentForm({ group_rows, add_overhead_assignment }) {
  const [selected_group_id, set_selected_group_id] = useState("");
  const [allocation_method, set_allocation_method] = useState("manual_amount");
  const [assigned_amount, set_assigned_amount] = useState("");
  const [assignment_percent, set_assignment_percent] = useState("");

  const selected_group = group_rows.find(
    (group) => getGroupId(group) === selected_group_id
  );

  const is_manual_amount = allocation_method === "manual_amount";
  const is_manual_percent = allocation_method === "manual_percent";

  function handleAddAssignment() {
    if (!add_overhead_assignment || !selected_group_id) {
      return;
    }

    if (is_manual_amount && Number(assigned_amount || 0) <= 0) {
      return;
    }

    if (is_manual_percent && Number(assignment_percent || 0) <= 0) {
      return;
    }

    add_overhead_assignment({
      group_id: selected_group_id,
      allocation_method,
      assigned_amount: Number(assigned_amount || 0),
      assignment_percent: Number(assignment_percent || 0),
    });

    set_selected_group_id("");
    set_allocation_method("manual_amount");
    set_assigned_amount("");
    set_assignment_percent("");
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Add overhead assignment
          </p>
          <p className="ui-help">
            Distribute remaining overhead into an operating group. Weighted
            methods can be calculated by the calculation layer.
          </p>
        </div>

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
          <span className="ui-label">Allocation method</span>
          <select
            className="ui-input"
            value={allocation_method}
            onChange={(event) => set_allocation_method(event.target.value)}
          >
            <option value="manual_amount">Manual amount</option>
            <option value="manual_percent">Manual percent</option>
            <option value="labour_cost_weighted">Labour cost weighted</option>
            <option value="labour_hours_weighted">Labour hours weighted</option>
            <option value="asset_burden_weighted">Asset burden weighted</option>
            <option value="equal_split">Equal split</option>
          </select>
        </label>

        {is_manual_amount ? (
          <label className="ui-stack-sm">
            <span className="ui-label">Assigned amount</span>
            <input
              className="ui-input"
              type="number"
              min="0"
              step="0.01"
              value={assigned_amount}
              onChange={(event) => set_assigned_amount(event.target.value)}
              placeholder="Example: 25000"
            />
          </label>
        ) : null}

        {is_manual_percent ? (
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
              placeholder="Example: 25"
            />
          </label>
        ) : null}

        <div className="ui-readonly">
          <span className="ui-label">Preview only</span>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {selected_group
              ? `${getGroupName(selected_group)} · ${
                  METHOD_LABELS[allocation_method] || allocation_method
                }`
              : "Select a group to preview assignment."}
          </p>
          <p className="mt-1 ui-help">
            Weighted method amounts are calculated in the calculation layer.
          </p>
        </div>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleAddAssignment}
          disabled={
            !selected_group_id ||
            (is_manual_amount && Number(assigned_amount || 0) <= 0) ||
            (is_manual_percent && Number(assignment_percent || 0) <= 0)
          }
        >
          Add overhead assignment
        </button>
      </div>
    </div>
  );
}

function ExistingAssignments({
  overhead_assignment,
  group_rows,
  remove_overhead_assignment,
}) {
  const assignments =
    overhead_assignment?.assignments ||
    overhead_assignment?.overhead_group_assignments ||
    [];

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return (
      <div className="ui-readonly">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          No overhead assignments yet.
        </p>
        <p className="mt-1 ui-help">
          Assigned overhead will appear here once overhead is moved from the
          default holding pool into operating groups.
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

        const assignment_id =
          assignment.assignment_id ||
          assignment.overhead_assignment_id ||
          `${assignment.group_id}-${assignment.allocation_method}`;

        return (
          <div key={assignment_id} className="ui-readonly">
            <div className="ui-actions">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {getGroupName(group || assignment)}
                </p>
                <p className="ui-help">
                  {METHOD_LABELS[assignment.allocation_method] ||
                    assignment.allocation_method ||
                    "Manual amount"}{" "}
                  · {formatMoney(assignment.assigned_overhead_amount)}
                  {assignment.assignment_percent !== undefined
                    ? ` · ${formatPercent(assignment.assignment_percent)}`
                    : ""}
                </p>
              </div>

              {remove_overhead_assignment ? (
                <button
                  type="button"
                  className="ui-button-danger"
                  onClick={() => remove_overhead_assignment(assignment_id)}
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

export default function CostAllocationOverheadAssignmentCard({
  overhead_assignment,
  groups,
  add_overhead_assignment,
  remove_overhead_assignment,
}) {
  const group_rows = useMemo(() => normaliseGroupRows(groups), [groups]);

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Overhead distribution</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Distribute remaining overheads into operating groups
          </h3>
          <p className="ui-help">
            Overheads come from the upstream overhead pathway. Cost Allocation
            only distributes the remaining overhead pool; it does not create new
            overhead cost.
          </p>
        </div>

        <OverheadPoolSummary overhead_assignment={overhead_assignment} />

        <AssignmentForm
          group_rows={group_rows}
          add_overhead_assignment={add_overhead_assignment}
        />

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Existing overhead assignments
              </p>
              <p className="ui-help">
                Assignments should reconcile against the Overhead Pool.
              </p>
            </div>

            <ExistingAssignments
              overhead_assignment={overhead_assignment}
              group_rows={group_rows}
              remove_overhead_assignment={remove_overhead_assignment}
            />
          </div>
        </div>

        <p className="ui-help">
          Over-allocated overhead must block downstream trust. Remaining
          overhead must stay visible in the default holding pool.
        </p>
      </div>
    </section>
  );
}