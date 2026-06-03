"use client";

import { useMemo, useState } from "react";

import CostAllocationCreateGroupForm from "@/components/cost-allocation/groups/CostAllocationCreateGroupForm";
import CostAllocationOperatingGroupBuilder from "@/components/cost-allocation/groups/CostAllocationOperatingGroupBuilder";

import CostAllocationDivisionCostSummary from "@/components/cost-allocation/divisions/CostAllocationDivisionCostSummary";
import CostAllocationDivisionHeader from "@/components/cost-allocation/divisions/CostAllocationDivisionHeader";

import {
  getGroupId,
} from "@/components/cost-allocation/groups/costAllocationGroupHelpers";

function DivisionEmptyState() {
  return (
    <div className="ui-readonly">
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        No operating groups in this division yet.
      </p>
      <p className="mt-1 ui-help">
        Create a crew, team, machine setup, or working unit inside this
        division.
      </p>
    </div>
  );
}

export default function CostAllocationDivisionCard({
  division,
  division_cost_row,
  groups,
  group_cost_rows,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
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
  const [expanded_group_ids, set_expanded_group_ids] = useState([]);

  const division_id = division?.division_id || "main_operations";

  const division_groups = useMemo(() => {
    return groups.filter((group) => {
      return (group?.division_id || "main_operations") === division_id;
    });
  }, [groups, division_id]);

  function toggle_group_expanded(group_id) {
    set_expanded_group_ids((current) =>
      current.includes(group_id)
        ? current.filter((current_group_id) => current_group_id !== group_id)
        : [...current, group_id]
    );
  }

  function getGroupCostRow(group_id) {
    return (
      group_cost_rows.find((row) => row?.group_id === group_id) || {
        group_id,
        division_id,
        assigned_labour_cost: 0,
        assigned_asset_burden: 0,
        assigned_overhead_amount: 0,
        total_group_cost: 0,
      }
    );
  }

  function handle_add_group(group_input) {
    if (typeof add_operational_group !== "function") {
      return;
    }

    const group =
      typeof group_input === "string"
        ? {
            group_name: group_input,
          }
        : group_input || {};

    add_operational_group({
      ...group,
      division_id,
    });
  }

  return (
    <div className="cost-allocation-operating-group-card">
      <div className="ui-stack">
        <CostAllocationDivisionHeader
          division={division}
          update_division={update_division}
          remove_division={remove_division}
        />

        <CostAllocationDivisionCostSummary
          division_cost_row={division_cost_row}
        />

        <CostAllocationCreateGroupForm
          add_operational_group={handle_add_group}
          button_label="Add operating group to this division"
        />

        {division_groups.length === 0 ? (
          <DivisionEmptyState />
        ) : (
          <div className="ui-stack">
            {division_groups.map((group) => {
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
                  is_expanded={expanded_group_ids.includes(group_id)}
                  on_toggle={() => toggle_group_expanded(group_id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}