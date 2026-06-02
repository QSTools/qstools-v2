"use client";

import { getGroupId } from "./costAllocationGroupHelpers";
import CostAllocationGroupHeader from "./CostAllocationGroupHeader";
import CostAllocationGroupCostSummary from "./CostAllocationGroupCostSummary";
import CostAllocationGroupLabourBuilder from "./CostAllocationGroupLabourBuilder";
import CostAllocationGroupAssetBuilder from "./CostAllocationGroupAssetBuilder";
import CostAllocationGroupOverheadBuilder from "./CostAllocationGroupOverheadBuilder";

export default function CostAllocationOperatingGroupBuilder({
  group,
  group_cost_row,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
  update_operational_group,
  remove_operational_group,
  add_labour_assignment,
  remove_labour_assignment,
  add_asset_assignment,
  remove_asset_assignment,
}) {
  const group_id = getGroupId(group);

  return (
    <div className="cost-allocation-operating-group-card">
      <div className="ui-stack">
        <CostAllocationGroupHeader
          group={group}
          update_operational_group={update_operational_group}
          remove_operational_group={remove_operational_group}
        />

        <CostAllocationGroupCostSummary group_cost_row={group_cost_row} />

        <CostAllocationGroupLabourBuilder
          group_id={group_id}
          labour_assignment={labour_assignment}
          add_labour_assignment={add_labour_assignment}
          remove_labour_assignment={remove_labour_assignment}
        />

        <CostAllocationGroupAssetBuilder
          group_id={group_id}
          asset_assignment={asset_assignment}
          add_asset_assignment={add_asset_assignment}
          remove_asset_assignment={remove_asset_assignment}
        />

        <CostAllocationGroupOverheadBuilder
          group_id={group_id}
          overhead_assignment={overhead_assignment}
        />
      </div>
    </div>
  );
}