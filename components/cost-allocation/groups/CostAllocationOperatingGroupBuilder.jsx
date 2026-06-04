"use client";

import { getGroupId } from "./costAllocationGroupHelpers";
import CostAllocationGroupHeader from "./CostAllocationGroupHeader";
import CostAllocationGroupCostSummary from "./CostAllocationGroupCostSummary";
import CostAllocationGroupLabourBuilder from "./CostAllocationGroupLabourBuilder";
import CostAllocationGroupAssetBuilder from "./CostAllocationGroupAssetBuilder";
import CostAllocationGroupOverheadBuilder from "./CostAllocationGroupOverheadBuilder";

function formatCurrency(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "$0";
  }

  return parsed.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}

function getCostValue(group_cost_row, keys) {
  for (const key of keys) {
    const value = Number(group_cost_row?.[key]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

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
  is_expanded,
  on_toggle,
}) {
  const group_id = getGroupId(group);

  const assigned_labour_cost = getCostValue(group_cost_row, [
    "assigned_labour_cost",
    "labour_cost",
  ]);

  const assigned_asset_burden = getCostValue(group_cost_row, [
    "assigned_asset_burden",
    "asset_cost",
  ]);

  const assigned_overhead_amount = getCostValue(group_cost_row, [
    "assigned_overhead_amount",
    "overhead_cost",
  ]);

  const total_group_cost = getCostValue(group_cost_row, ["total_group_cost"]);

  return (
    <div className="cost-allocation-operating-group-card">
      <div className="cost-allocation-group-compact">
        <div className="cost-allocation-group-compact-main">
          <div>
            <p className="ui-kicker">Operating group</p>
            <h4 className="cost-allocation-group-compact-title">
              {group?.group_name || "Untitled operating group"}
            </h4>
          </div>

          <div className="cost-allocation-group-compact-summary">
            <div className="ui-readonly">
              <span className="ui-label">Labour</span>
              <div className="mt-1 font-semibold text-[var(--text-primary)]">
                {formatCurrency(assigned_labour_cost)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Assets</span>
              <div className="mt-1 font-semibold text-[var(--text-primary)]">
                {formatCurrency(assigned_asset_burden)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Overhead</span>
              <div className="mt-1 font-semibold text-[var(--text-primary)]">
                {formatCurrency(assigned_overhead_amount)}
              </div>
            </div>

            <div className="ui-readonly">
              <span className="ui-label">Total</span>
              <div className="mt-1 cost-allocation-group-compact-total">
                {formatCurrency(total_group_cost)}
              </div>
            </div>
          </div>

          <div className="cost-allocation-group-compact-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_toggle}
            >
              {is_expanded ? "Done" : "Edit group"}
            </button>

            <button
              type="button"
              className="ui-button-danger"
              onClick={() => remove_operational_group(group_id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {is_expanded ? (
        <div className="mt-4 ui-stack">
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
      ) : null}
    </div>
  );
}