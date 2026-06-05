"use client";

import { useState } from "react";

import CostAllocationEvidenceBreakdown from "@/components/cost-allocation/CostAllocationEvidenceBreakdown";
import CostAllocationStepBuilder from "@/components/cost-allocation/CostAllocationStepBuilder";

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function PoolSummaryRow({ title, available, assigned, remaining }) {
  return (
    <div className="cost-allocation-pool-table-row">
      <div className="cost-allocation-pool-table-label">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </p>
      </div>

      <p className="cost-allocation-pool-table-value">
        {formatMoney(available)}
      </p>

      <p className="cost-allocation-pool-table-value">
        {formatMoney(assigned)}
      </p>

      <p className="cost-allocation-pool-table-value">
        {formatMoney(remaining)}
      </p>
    </div>
  );
}

function PoolPositionCard({
  labour_assignment,
  asset_assignment,
  overhead_assignment,
  recovery_plan,
}) {
  const labour_available =
    labour_assignment?.available_labour_cost ??
    recovery_plan?.total_available_labour_cost ??
    0;

  const labour_assigned =
    labour_assignment?.assigned_labour_cost ??
    recovery_plan?.total_assigned_labour_cost ??
    0;

  const labour_remaining =
    labour_assignment?.remaining_labour_cost ??
    recovery_plan?.total_remaining_labour_cost ??
    0;

  const asset_available =
    asset_assignment?.available_asset_cost ??
    recovery_plan?.total_available_asset_cost ??
    0;

  const asset_assigned =
    asset_assignment?.assigned_asset_cost ??
    recovery_plan?.total_assigned_asset_cost ??
    0;

  const asset_remaining =
    asset_assignment?.remaining_asset_cost ??
    recovery_plan?.total_remaining_asset_cost ??
    0;

  const overhead_available =
    overhead_assignment?.available_overhead_cost ??
    recovery_plan?.total_available_overhead_cost ??
    0;

  const overhead_assigned =
    overhead_assignment?.assigned_overhead_cost ??
    recovery_plan?.total_assigned_overhead_cost ??
    0;

  const overhead_remaining =
    overhead_assignment?.remaining_overhead_cost ??
    recovery_plan?.total_remaining_overhead_cost ??
    0;

  return (
    <section className="ui-panel cost-allocation-pool-position-card">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Cost to allocate</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Pool position
          </h3>
          <p className="ui-help">
            Cost available, assigned, and left to assign.
          </p>
        </div>

        <div className="cost-allocation-pool-table">
          <div className="cost-allocation-pool-table-header">
            <span></span>
            <span>Available</span>
            <span>Assigned</span>
            <span>Remaining</span>
          </div>

          <PoolSummaryRow
            title="Labour"
            available={labour_available}
            assigned={labour_assigned}
            remaining={labour_remaining}
          />

          <PoolSummaryRow
            title="Assets"
            available={asset_available}
            assigned={asset_assigned}
            remaining={asset_remaining}
          />

          <PoolSummaryRow
            title="Overhead"
            available={overhead_available}
            assigned={overhead_assigned}
            remaining={overhead_remaining}
          />
        </div>
      </div>
    </section>
  );
}

function CollapsedChecks({
  recovery_plan,
  delivery_summary,
  evidence,
  problems,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
}) {
  const [is_open, set_is_open] = useState(false);
  const [active_check, set_active_check] = useState("pool_reconciliation");

  const setup_count = Array.isArray(evidence?.setup_warnings)
    ? evidence.setup_warnings.length
    : 0;

  const structural_count = Array.isArray(evidence?.structural_warnings)
    ? evidence.structural_warnings.length
    : 0;

  const warning_count = setup_count + structural_count;

  if (!is_open) {
    return (
      <section className="ui-panel">
        <div className="ui-actions">
          <div>
            <p className="ui-kicker">Allocation checks</p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Checks hidden
            </h3>
            <p className="ui-help">
              Open only when you need to review reconciliation, group cost
              stacks, or warning details.
            </p>
          </div>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => set_is_open(true)}
          >
            Show checks ({formatCount(warning_count)})
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div className="ui-actions">
          <div>
            <p className="ui-kicker">Allocation checks</p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Review allocation checks
            </h3>
            <p className="ui-help">
              These are secondary checks. The main page remains an input and
              assignment builder.
            </p>
          </div>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => set_is_open(false)}
          >
            Hide checks
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <button
            type="button"
            className={
              active_check === "pool_reconciliation"
                ? "ui-button cost-allocation-check-tab is-active"
                : "ui-button-secondary cost-allocation-check-tab"
            }
            onClick={() => set_active_check("pool_reconciliation")}
          >
            Reconciliation
          </button>

          <button
            type="button"
            className={
              active_check === "group_cost_stacks"
                ? "ui-button cost-allocation-check-tab is-active"
                : "ui-button-secondary cost-allocation-check-tab"
            }
            onClick={() => set_active_check("group_cost_stacks")}
          >
            Group costs
          </button>

          <button
            type="button"
            className={
              active_check === "structural_warnings"
                ? "ui-button cost-allocation-check-tab is-active"
                : "ui-button-secondary cost-allocation-check-tab"
            }
            onClick={() => set_active_check("structural_warnings")}
          >
            Warnings
          </button>

          <button
            type="button"
            className={
              active_check === "setup_checklist"
                ? "ui-button cost-allocation-check-tab is-active"
                : "ui-button-secondary cost-allocation-check-tab"
            }
            onClick={() => set_active_check("setup_checklist")}
          >
            Setup
          </button>
        </div>

        <CostAllocationEvidenceBreakdown
          active_section={active_check}
          recovery_plan={recovery_plan}
          delivery_summary={delivery_summary}
          evidence={evidence}
          problems={problems}
          labour_assignment={labour_assignment}
          asset_assignment={asset_assignment}
          overhead_assignment={overhead_assignment}
        />
      </div>
    </section>
  );
}

export default function CostAllocationMainCard({
  recovery_plan,
  allocation_tests,
  delivery_summary,
  evidence,
  links,
  divisions,
  groups,
  problems,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
  add_division,
  update_division,
  remove_division,
  add_asset_labour_link,
  remove_asset_labour_link,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
  add_labour_assignment,
  remove_labour_assignment,
  add_asset_assignment,
  remove_asset_assignment,
  add_overhead_assignment,
  remove_overhead_assignment,
  reset_state,
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <section className="ui-panel cost-allocation-hero-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Cost allocation</p>
              <h2 className="ui-display">Cost allocation builder</h2>
              <p className="ui-help">
                Assign labour, asset, and overhead pools into divisions and
                operating groups.
              </p>
              <p className="ui-help">
                This is an input page. Recovery testing, rates, business
                outcome, and quote checking happen downstream.
              </p>

              <div className="mt-4 ui-actions">
                <button
                  type="button"
                  className="ui-button-secondary"
                  onClick={() => {
                    if (typeof reset_state === "function") {
                      reset_state();
                    }
                  }}
                >
                  Clear cost allocation inputs
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="cost-allocation-layout">
          <div className="ui-stack">
            <CostAllocationStepBuilder
              recovery_plan={recovery_plan}
              allocation_tests={allocation_tests}
              delivery_summary={delivery_summary}
              evidence={evidence}
              links={links}
              divisions={divisions}
              groups={groups}
              problems={problems}
              labour_assignment={labour_assignment}
              asset_assignment={asset_assignment}
              overhead_assignment={overhead_assignment}
              add_division={add_division}
              update_division={update_division}
              remove_division={remove_division}
              add_asset_labour_link={add_asset_labour_link}
              remove_asset_labour_link={remove_asset_labour_link}
              add_operational_group={add_operational_group}
              update_operational_group={update_operational_group}
              remove_operational_group={remove_operational_group}
              add_labour_assignment={add_labour_assignment}
              remove_labour_assignment={remove_labour_assignment}
              add_asset_assignment={add_asset_assignment}
              remove_asset_assignment={remove_asset_assignment}
              add_overhead_assignment={add_overhead_assignment}
              remove_overhead_assignment={remove_overhead_assignment}
            />

            <CollapsedChecks
              recovery_plan={recovery_plan}
              delivery_summary={delivery_summary}
              evidence={evidence}
              problems={problems}
              labour_assignment={labour_assignment}
              asset_assignment={asset_assignment}
              overhead_assignment={overhead_assignment}
            />
          </div>

          <div className="ui-stack">
            <PoolPositionCard
              labour_assignment={labour_assignment}
              asset_assignment={asset_assignment}
              overhead_assignment={overhead_assignment}
              recovery_plan={recovery_plan}
            />
          </div>
        </div>
      </div>
    </section>
  );
}