"use client";

import { useMemo } from "react";

import CostAllocationCreateGroupForm from "@/components/cost-allocation/groups/CostAllocationCreateGroupForm";
import CostAllocationOperatingGroupBuilder from "@/components/cost-allocation/groups/CostAllocationOperatingGroupBuilder";

import {
  formatCount,
  getGroupCostRows,
  getGroupId,
  getGroupRows,
} from "@/components/cost-allocation/groups/costAllocationGroupHelpers";

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

        <CostAllocationCreateGroupForm
          add_operational_group={add_operational_group}
        />

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="ui-stack">
            {rows.map((group) => {
              const group_id = getGroupId(group);

              return (
                <CostAllocationOperatingGroupBuilder
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