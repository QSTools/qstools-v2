"use client";

import { useState } from "react";

import {
  TableRow,
  TableSectionHeading,
  formatMoney,
  formatNumber,
} from "@/components/cost-allocation/evidence/evidenceHelpers";

export default function GroupCostStacksSection({ recovery_plan }) {
  const rows = Array.isArray(recovery_plan?.operational_group_cost_rows)
    ? recovery_plan.operational_group_cost_rows
    : [];

  const [expanded_group_ids, set_expanded_group_ids] = useState(() => new Set());

  function toggle_group(group_id) {
    set_expanded_group_ids((current) => {
      const next = new Set(current);

      if (next.has(group_id)) {
        next.delete(group_id);
      } else {
        next.add(group_id);
      }

      return next;
    });
  }

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Group cost stacks</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Review assigned operating group cost stacks
          </h3>
          <p className="ui-help">
            This shows the selected recovery basis, component recovery rates,
            and total assigned operating cost for each operating group.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No group cost stacks yet.
            </p>
            <p className="mt-1 ui-help">
              Create an operating group and assign labour or assets before this
              section has values.
            </p>
          </div>
        ) : (
          <div className="ui-stack-sm">
            {rows.map((row, index) => {
              const group_id = row.group_id || `group-cost-stack-${index}`;
              const is_expanded = expanded_group_ids.has(group_id);

              return (
                <div key={group_id} className="ui-readonly">
                  <div className="ui-stack-sm">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => toggle_group(group_id)}
                      aria-expanded={is_expanded}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {row.group_name || "Unnamed operating group"}
                          </p>
                          <p className="ui-help">
                            {row.allocation_status || "review_required"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-primary)]">
                          <span>{`${formatMoney(row.group_cost_per_hour)}/hr`}</span>
                          <span aria-hidden="true">
                            {is_expanded ? "-" : "+"}
                          </span>
                        </div>
                      </div>
                    </button>

                    {is_expanded ? (
                      <div className="labour-summary-table">
                    <TableSectionHeading label="Recovery basis" />
                    <TableRow
                      label="Basis selected"
                      value={
                        row.group_recovery_hour_source === "asset_hours"
                          ? "Asset hours"
                          : row.group_recovery_hour_source === "manual_hours"
                            ? "Manual hours"
                            : "Labour hours"
                      }
                    />
                    <TableRow
                      label="Active recovery hours"
                      value={formatNumber(row.group_recovery_hours)}
                    />
                    <TableRow
                      label="Group recovery rate"
                      value={`${formatMoney(row.group_cost_per_hour)}/hr`}
                      highlight
                    />

                    <TableSectionHeading label="Labour recovery" />
                    <TableRow
                      label="Labour recovery cost"
                      value={formatMoney(row.labour_recovery_cost ?? row.assigned_labour_cost)}
                    />
                    <TableRow
                      label="Labour recovery hours"
                      value={formatNumber(row.group_recovery_hours)}
                    />
                    <TableRow
                      label="Labour recovery rate"
                      value={`${formatMoney(row.labour_recovery_rate)}/hr`}
                      highlight
                    />

                    <TableSectionHeading label="Asset recovery" />
                    <TableRow
                      label="Asset cost"
                      value={formatMoney(row.asset_recovery_cost ?? row.assigned_asset_burden)}
                    />
                    <TableRow
                      label="Asset recovery hours"
                      value={formatNumber(row.group_recovery_hours)}
                    />
                    <TableRow
                      label="Asset recovery rate"
                      value={`${formatMoney(row.asset_recovery_rate)}/hr`}
                      highlight
                    />

                    <TableSectionHeading label="Overhead recovery" />
                    <TableRow
                      label="Overhead cost"
                      value={formatMoney(row.overhead_recovery_cost ?? row.assigned_overhead_amount)}
                    />
                    <TableRow
                      label="Overhead recovery hours"
                      value={formatNumber(row.group_recovery_hours)}
                    />
                    <TableRow
                      label="Overhead recovery rate"
                      value={`${formatMoney(row.overhead_recovery_rate)}/hr`}
                      highlight
                    />

                    <TableSectionHeading label="Total cost summary" />
                    <TableRow
                      label="Productive labour"
                      value={formatMoney(row.labour_recovery_cost ?? row.assigned_labour_cost)}
                    />
                    <TableRow
                      label="Productive assets"
                      value={formatMoney(row.asset_recovery_cost ?? row.assigned_asset_burden)}
                    />
                    <TableRow
                      label="Overhead"
                      value={formatMoney(row.overhead_recovery_cost ?? row.assigned_overhead_amount)}
                    />
                    <TableRow
                      label="Non-productive labour"
                      help="Cost only - never charged, never part of recovery hours (e.g. Owner/Director, Management)."
                      value={formatMoney(row.assigned_non_productive_labour_cost)}
                    />
                    <TableRow
                      label="Non-productive assets"
                      help="Cost only - never charged, never part of recovery hours (e.g. a support vehicle)."
                      value={formatMoney(row.assigned_non_productive_asset_cost)}
                    />
                    <TableRow
                      label="Total group cost"
                      value={formatMoney(row.total_group_cost)}
                      total
                      highlight
                    />
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
