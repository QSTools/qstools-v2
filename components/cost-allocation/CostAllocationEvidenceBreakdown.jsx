"use client";

import CostAllocationGroupsCard from "@/components/cost-allocation/CostAllocationGroupsCard";
import CostAllocationLinkTable from "@/components/cost-allocation/CostAllocationLinkTable";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function TableRow({ label, value, help, total = false }) {
  return (
    <div className={`labour-summary-table-row ${total ? "total" : ""}`}>
      <div className="labour-summary-table-label">
        <div>{label}</div>
        {help ? <div className="ui-help">{help}</div> : null}
      </div>

      <div className="labour-summary-table-value">
        {value ?? "Not available"}
      </div>
    </div>
  );
}

function TableBlock({ title, help_text, children }) {
  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </p>
          {help_text ? <p className="ui-help">{help_text}</p> : null}
        </div>

        <div className="labour-summary-table">{children}</div>
      </div>
    </div>
  );
}

function WarningList({ warnings = [], empty_message }) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return (
      <div className="ui-readonly">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {empty_message}
        </p>
      </div>
    );
  }

  return (
    <div className="ui-stack-sm">
      {warnings.map((warning, index) => (
        <div key={`warning-${index}`} className="ui-readonly">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {warning?.title ||
              warning?.label ||
              warning?.warning_key ||
              warning?.key ||
              "Warning"}
          </div>

          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {warning?.message || warning?.description || String(warning)}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderSection({ kicker, title, help_text }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">{kicker}</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="ui-help">{help_text}</p>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Component route is ready.
          </p>
          <p className="mt-1 ui-help">
            This section is now separated from the old assignment tabs. The
            group-first builder is the main place to assign labour, assets, and
            overhead.
          </p>
        </div>
      </div>
    </section>
  );
}

function ChecklistSection({ kicker, title, help_text, warnings, empty_message }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">{kicker || title}</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="ui-help">{help_text}</p>
        </div>

        <WarningList warnings={warnings} empty_message={empty_message} />
      </div>
    </section>
  );
}

function WhatNeedsAttentionSection({ delivery_summary, problems }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">What needs attention</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Operating structure readiness
          </h3>
          <p className="ui-help">
            These checks explain whether the operating structure is ready for
            downstream recovery testing.
          </p>
        </div>

        <TableBlock
          title="Structure coverage"
          help_text="Coverage shows whether productive labour, productive assets, and operating groups are properly assigned."
        >
          <TableRow
            label="Staff coverage"
            value={formatPercent(delivery_summary?.staff_coverage_percent)}
          />
          <TableRow
            label="Asset coverage"
            value={formatPercent(delivery_summary?.asset_coverage_percent)}
          />
          <TableRow
            label="Group coverage"
            value={formatPercent(delivery_summary?.group_coverage_percent)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Linked structure"
          help_text="These counts show which people, assets, and operating groups still need review."
        >
          <TableRow
            label="Linked / unlinked staff"
            value={`${delivery_summary?.linked_staff_count ?? 0} / ${
              delivery_summary?.unlinked_staff_count ??
              problems?.unlinked_staff_count ??
              0
            }`}
          />
          <TableRow
            label="Linked / unlinked assets"
            value={`${delivery_summary?.linked_asset_count ?? 0} / ${
              delivery_summary?.unlinked_asset_count ??
              problems?.unlinked_asset_count ??
              0
            }`}
          />
          <TableRow
            label="Ready / incomplete operating groups"
            value={`${delivery_summary?.valid_operational_groups ?? 0} / ${
              delivery_summary?.invalid_operational_groups ?? 0
            }`}
            total
          />
        </TableBlock>

        <TableBlock
          title="Capacity and dependency"
          help_text="Internal shortfall is a dependency signal. It is not automatically a final business failure."
        >
          <TableRow
            label="Internal capacity shortfall"
            value={yesNo(delivery_summary?.internal_capacity_shortfall)}
          />
          <TableRow
            label="External delivery required"
            value={yesNo(delivery_summary?.external_delivery_required)}
          />
          <TableRow
            label="External delivery confirmed"
            value={yesNo(delivery_summary?.external_delivery_enabled)}
            total
          />
        </TableBlock>
      </div>
    </section>
  );
}

function GroupCostStacksSection({ recovery_plan }) {
  const rows = Array.isArray(recovery_plan?.operational_group_cost_rows)
    ? recovery_plan.operational_group_cost_rows
    : [];

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Group cost stacks</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Review assigned operating group cost stacks
          </h3>
          <p className="ui-help">
            This shows the labour, asset, overhead, and total cost currently
            assigned to each operating group.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No group cost stacks yet.
            </p>
            <p className="mt-1 ui-help">
              Create an operating group and assign labour, assets, or overhead
              before this section has values.
            </p>
          </div>
        ) : (
          <div className="ui-stack-sm">
            {rows.map((row) => (
              <div key={row.group_id} className="ui-readonly">
                <div className="ui-stack-sm">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {row.group_name || "Unnamed operating group"}
                    </p>
                    <p className="ui-help">
                      {row.allocation_status || "review_required"}
                    </p>
                  </div>

                  <div className="labour-summary-table">
                    <TableRow
                      label="Productive labour"
                      value={formatMoney(row.assigned_labour_cost)}
                    />
                    <TableRow
                      label="Productive labour hours"
                      value={formatNumber(row.assigned_labour_hours)}
                    />
                    <TableRow
                      label="Productive assets"
                      value={formatMoney(row.assigned_asset_burden)}
                    />
                    <TableRow
                      label="Overhead"
                      value={formatMoney(row.assigned_overhead_amount)}
                    />
                    <TableRow
                      label="Total group cost"
                      value={formatMoney(row.total_group_cost)}
                      total
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PoolReconciliationSection({ recovery_plan }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Pool reconciliation</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Check assigned, remaining, and over-allocated source pools
          </h3>
          <p className="ui-help">
            This confirms that Cost Allocation is distributing existing source
            pools rather than creating new cost.
          </p>
        </div>

        <TableBlock
          title="Productive labour pool"
          help_text="Labour module owns the source hours and cost. Cost Allocation only allocates percentages into operating groups."
        >
          <TableRow
            label="Available labour cost"
            value={formatMoney(recovery_plan?.total_available_labour_cost)}
          />
          <TableRow
            label="Assigned labour cost"
            value={formatMoney(recovery_plan?.total_assigned_labour_cost)}
          />
          <TableRow
            label="Remaining labour cost"
            value={formatMoney(recovery_plan?.total_remaining_labour_cost)}
          />
          <TableRow
            label="Over-allocated labour cost"
            value={formatMoney(recovery_plan?.total_over_allocated_labour_cost)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Productive asset pool"
          help_text="Assets are assigned into groups by allocation percentage."
        >
          <TableRow
            label="Available asset cost"
            value={formatMoney(recovery_plan?.total_available_asset_cost)}
          />
          <TableRow
            label="Assigned asset cost"
            value={formatMoney(recovery_plan?.total_assigned_asset_cost)}
          />
          <TableRow
            label="Remaining asset cost"
            value={formatMoney(recovery_plan?.total_remaining_asset_cost)}
          />
          <TableRow
            label="Over-allocated asset cost"
            value={formatMoney(recovery_plan?.total_over_allocated_asset_cost)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Overhead pool"
          help_text="Overhead is distributed into operating groups after labour and asset assignments are known."
        >
          <TableRow
            label="Available overhead"
            value={formatMoney(recovery_plan?.total_available_overhead_cost)}
          />
          <TableRow
            label="Assigned overhead"
            value={formatMoney(recovery_plan?.total_assigned_overhead_cost)}
          />
          <TableRow
            label="Remaining overhead"
            value={formatMoney(recovery_plan?.total_remaining_overhead_cost)}
          />
          <TableRow
            label="Over-allocated overhead"
            value={formatMoney(
              recovery_plan?.total_over_allocated_overhead_cost
            )}
            total
          />
        </TableBlock>

        <TableBlock
          title="Total assigned / remaining"
          help_text="This is the combined operating cost currently inside and outside operating groups."
        >
          <TableRow
            label="Grouped operating cost"
            value={formatMoney(recovery_plan?.total_grouped_operating_cost)}
          />
          <TableRow
            label="Unassigned operating cost"
            value={formatMoney(recovery_plan?.total_unassigned_cost)}
            total
          />
        </TableBlock>
      </div>
    </section>
  );
}

export default function CostAllocationEvidenceBreakdown({
  active_section,
  recovery_plan,
  delivery_summary,
  evidence,
  links,
  groups,
  problems,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
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
}) {
  if (active_section === "groups") {
    return (
      <CostAllocationGroupsCard
        groups={groups}
        labour_assignment={labour_assignment}
        asset_assignment={asset_assignment}
        overhead_assignment={overhead_assignment}
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
    );
  }

  if (active_section === "links") {
    return (
      <CostAllocationLinkTable
        links={links}
        add_asset_labour_link={add_asset_labour_link}
        remove_asset_labour_link={remove_asset_labour_link}
      />
    );
  }

  if (active_section === "group_cost_stacks") {
    return <GroupCostStacksSection recovery_plan={recovery_plan} />;
  }

  if (active_section === "pool_reconciliation") {
    return <PoolReconciliationSection recovery_plan={recovery_plan} />;
  }

  if (active_section === "setup_checklist") {
    return (
      <ChecklistSection
        kicker="Setup checklist"
        title="Setup items needing review"
        help_text="Complete these items to make the operating structure reliable."
        warnings={evidence?.setup_warnings}
        empty_message="No setup checklist items are currently active."
      />
    );
  }

  if (active_section === "structural_warnings") {
    return (
      <ChecklistSection
        kicker="Structure warnings"
        title="Structure, capacity, and dependency warnings"
        help_text="These are structure, capacity, or dependency issues that may prevent the operating structure from being relied on downstream."
        warnings={evidence?.structural_warnings}
        empty_message="No structural warnings are currently active."
      />
    );
  }

  if (active_section === "evidence") {
    return (
      <WhatNeedsAttentionSection
        delivery_summary={delivery_summary}
        problems={problems}
      />
    );
  }

  return (
    <PlaceholderSection
      kicker="Section not connected"
      title="This section is not wired yet"
      help_text={`No component is currently connected for active_section: ${active_section}`}
    />
  );
}