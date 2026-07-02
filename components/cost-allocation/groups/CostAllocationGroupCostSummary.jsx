"use client";

import { formatMoney } from "./costAllocationGroupHelpers";

function formatNumber(value, maximumFractionDigits = 2) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "0";
  }

  return parsed.toLocaleString("en-NZ", {
    maximumFractionDigits,
  });
}

function getRate(cost, hours) {
  const safe_cost = Number(cost);
  const safe_hours = Number(hours);

  if (!Number.isFinite(safe_cost) || !Number.isFinite(safe_hours) || safe_hours <= 0) {
    return 0;
  }

  return safe_cost / safe_hours;
}

function AssignmentDetailRow({ label, children }) {
  return (
    <div className="labour-summary-table-row">
      <div className="labour-summary-table-label">
        <div>{label}</div>
      </div>

      <div className="labour-summary-table-value">{children}</div>
    </div>
  );
}

function LabourAssignmentDetail({ assignments }) {
  if (!assignments.length) {
    return (
      <p className="ui-help">
        No labour assignments are currently attached to this group.
      </p>
    );
  }

  return (
    <div className="ui-stack-sm">
      {assignments.map((assignment, index) => {
        const assigned_cost = Number(
          assignment.assigned_cost ?? assignment.assigned_labour_cost ?? 0
        );
        const assigned_hours = Number(
          assignment.assigned_hours ?? assignment.assigned_labour_hours ?? 0
        );

        return (
          <div
            key={`${assignment.staff_type_id || assignment.labour_type_id || "labour"}-${index}`}
            className="ui-readonly"
          >
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {assignment.staff_type_name ||
                assignment.labour_type_name ||
                assignment.staff_type_id ||
                assignment.labour_type_id ||
                "Labour assignment"}
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p className="ui-help">
                Assignment: {formatNumber(assignment.assignment_percent, 2)}%
              </p>
              <p className="ui-help">Hours: {formatNumber(assigned_hours, 2)}</p>
              <p className="ui-help">Cost: {formatMoney(assigned_cost)}</p>
              <p className="ui-help">
                Cost rate: {formatMoney(getRate(assigned_cost, assigned_hours))}/hr
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetAssignmentDetail({ assignments }) {
  if (!assignments.length) {
    return (
      <p className="ui-help">
        No asset assignments are currently attached to this group.
      </p>
    );
  }

  return (
    <div className="ui-stack-sm">
      {assignments.map((assignment, index) => {
        const assigned_cost = Number(
          assignment.assigned_asset_cost ?? assignment.assigned_cost ?? 0
        );
        const assigned_hours = Number(
          assignment.assigned_asset_hours ?? assignment.assigned_hours ?? 0
        );

        return (
          <div
            key={`${assignment.asset_id || "asset"}-${index}`}
            className="ui-readonly"
          >
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {assignment.asset_name || assignment.asset_id || "Asset assignment"}
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p className="ui-help">
                Assignment: {formatNumber(assignment.assignment_percent, 2)}%
              </p>
              <p className="ui-help">Hours: {formatNumber(assigned_hours, 2)}</p>
              <p className="ui-help">Cost: {formatMoney(assigned_cost)}</p>
              <p className="ui-help">
                Cost rate: {formatMoney(getRate(assigned_cost, assigned_hours))}/hr
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OverheadAssignmentDetail({ assignments }) {
  if (!assignments.length) {
    return (
      <p className="ui-help">
        No overhead assignments are currently attached to this group.
      </p>
    );
  }

  return (
    <div className="ui-stack-sm">
      {assignments.map((assignment, index) => (
        <div
          key={`${assignment.allocation_method || "overhead"}-${index}`}
          className="ui-readonly"
        >
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            {assignment.allocation_method ||
              assignment.overhead_source ||
              "Overhead assignment"}
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <p className="ui-help">
              Assigned overhead:{" "}
              {formatMoney(assignment.assigned_overhead_amount || 0)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CostAllocationGroupCostSummary({ group_cost_row }) {
  const labour_assignments = Array.isArray(
    group_cost_row?.labour_group_assignments
  )
    ? group_cost_row.labour_group_assignments
    : [];

  const asset_assignments = Array.isArray(group_cost_row?.asset_group_assignments)
    ? group_cost_row.asset_group_assignments
    : [];

  const overhead_assignments = Array.isArray(
    group_cost_row?.overhead_group_assignments
  )
    ? group_cost_row.overhead_group_assignments
    : [];

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
              <div>Productive labour hours</div>
              <div className="ui-help">
                Assigned productive labour hours.
              </div>
            </div>
            <div className="labour-summary-table-value">
              {formatNumber(group_cost_row?.assigned_labour_hours, 2)}
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
              <div>Asset hours</div>
              <div className="ui-help">Assigned asset recovery hours.</div>
            </div>
            <div className="labour-summary-table-value">
              {formatNumber(group_cost_row?.assigned_asset_hours, 2)}
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

        <div className="ui-stack-sm">
          <AssignmentDetailRow label="Labour assignment detail">
            <LabourAssignmentDetail assignments={labour_assignments} />
          </AssignmentDetailRow>

          <AssignmentDetailRow label="Asset assignment detail">
            <AssetAssignmentDetail assignments={asset_assignments} />
          </AssignmentDetailRow>

          <AssignmentDetailRow label="Overhead assignment detail">
            <OverheadAssignmentDetail assignments={overhead_assignments} />
          </AssignmentDetailRow>
        </div>
      </div>
    </div>
  );
}
