"use client";

import { useMemo } from "react";

import CostAllocationCreateDivisionForm from "@/components/cost-allocation/divisions/CostAllocationCreateDivisionForm";
import CostAllocationDivisionCard from "@/components/cost-allocation/divisions/CostAllocationDivisionCard";

import {
  formatCount,
  getGroupCostRows,
  getGroupRows,
} from "@/components/cost-allocation/groups/costAllocationGroupHelpers";

function getDivisionRows(divisions) {
  if (Array.isArray(divisions?.rows)) {
    return divisions.rows.filter((division) => division?.is_active !== false);
  }

  if (Array.isArray(divisions)) {
    return divisions.filter((division) => division?.is_active !== false);
  }

  return [];
}

function getDivisionCostRows(divisions) {
  if (Array.isArray(divisions?.division_cost_rows)) {
    return divisions.division_cost_rows;
  }

  if (Array.isArray(divisions?.cost_rows)) {
    return divisions.cost_rows;
  }

  return [];
}

function EmptyState() {
  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        No divisions created yet.
      </p>
      <p className="mt-1 ui-help">
        Create the first division, then add operating groups inside that
        division.
      </p>
    </div>
  );
}

export default function CostAllocationGroupsCard({
  divisions,
  groups,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
  add_division,
  update_division,
  remove_division,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
  add_labour_assignment,
  remove_labour_assignment,
  add_asset_assignment,
  remove_asset_assignment,
}) {
  const division_rows = getDivisionRows(divisions);
  const division_cost_rows = getDivisionCostRows(divisions);

  const group_rows = getGroupRows(groups);

  const group_cost_rows = useMemo(() => getGroupCostRows(groups), [groups]);

  function getDivisionCostRow(division_id) {
    return (
      division_cost_rows.find((row) => row?.division_id === division_id) || {
        division_id,
        operating_group_count: group_rows.filter(
          (group) => (group?.division_id || "main_operations") === division_id
        ).length,
        assigned_labour_cost: 0,
        assigned_labour_hours: 0,
        assigned_asset_burden: 0,
        assigned_asset_hours: 0,
        assigned_overhead_amount: 0,
        total_division_cost: 0,
        allocation_status: "review_required",
      }
    );
  }

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Divisions and operating groups</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Build each division and operating group in one place
          </h3>
          <p className="ui-help">
            Create divisions, then add real crews, teams, machine setups, or
            working units inside each division.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="ui-readonly">
            <span className="ui-label">Active divisions</span>
            <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatCount(division_rows.length)}
            </div>
            <p className="mt-1 ui-help">
              Each division should represent a major operating area.
            </p>
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Active operating groups</span>
            <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {formatCount(group_rows.length)}
            </div>
            <p className="mt-1 ui-help">
              Each group should represent a real crew, team, machine setup, or
              working unit.
            </p>
          </div>
        </div>

        <CostAllocationCreateDivisionForm
          add_division={add_division}
          add_operational_group={add_operational_group}
        />
        {division_rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="ui-stack">
            {division_rows.map((division) => {
              const division_id = division?.division_id || "main_operations";

              return (
                <CostAllocationDivisionCard
                  key={division_id}
                  division={division}
                  division_cost_row={getDivisionCostRow(division_id)}
                  groups={group_rows}
                  group_cost_rows={group_cost_rows}
                  labour_assignment={labour_assignment}
                  asset_assignment={asset_assignment}
                  overhead_assignment={overhead_assignment}
                  update_division={update_division}
                  remove_division={remove_division}
                  add_operational_group={add_operational_group}
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