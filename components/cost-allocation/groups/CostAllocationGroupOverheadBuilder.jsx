"use client";

import {
  formatMoney,
  formatWholePercent,
  getOverheadAssignments,
} from "./costAllocationGroupHelpers";

export default function CostAllocationGroupOverheadBuilder({
  group_id,
  overhead_assignment,
}) {
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