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

function TableSectionHeading({ label }) {
  return (
    <div className="labour-summary-table-row total">
      <div className="labour-summary-table-label">
        <div>{label}</div>
      </div>
      <div className="labour-summary-table-value" />
    </div>
  );
}

function TableRow({ label, value, help, total = false, highlight = false }) {
  return (
    <div
      className={`labour-summary-table-row ${total ? "total" : ""} ${
        highlight ? "highlight" : ""
      }`}
    >
      <div className="labour-summary-table-label">
        <div>{label}</div>
        {help ? <div className="ui-help">{help}</div> : null}
      </div>

      <div
        className={`labour-summary-table-value ${
          highlight ? "text-cyan-300 font-semibold" : ""
        }`}
      >
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
            division and group builder is the main place to assign labour,
            assets, and overhead.
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
          help_text="Coverage shows whether divisions, productive labour, productive assets, and operating groups are properly assigned."
        >
          <TableRow
            label="Division coverage"
            value={formatPercent(delivery_summary?.division_coverage_percent)}
          />
          <TableRow
            label="Productive labour coverage"
            value={formatPercent(delivery_summary?.staff_coverage_percent)}
          />
          <TableRow
            label="Productive asset coverage"
            value={formatPercent(delivery_summary?.asset_coverage_percent)}
          />
          <TableRow
            label="Operating group coverage"
            value={formatPercent(delivery_summary?.group_coverage_percent)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Division and group structure"
          help_text="These counts show whether the active divisions and operating groups are ready."
        >
          <TableRow
            label="Ready / incomplete divisions"
            value={`${delivery_summary?.valid_divisions ?? 0} / ${
              delivery_summary?.invalid_divisions ?? 0
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
                      label="Total group cost"
                      value={formatMoney(row.total_group_cost)}
                      total
                      highlight
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

function PoolReconciliationSection({
  recovery_plan,
  labour_assignment,
  asset_assignment,
  overhead_assignment,
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
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Pool reconciliation</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Check assigned and remaining source pools
          </h3>
          <p className="ui-help">
            This confirms that Cost Allocation is distributing existing source
            pools rather than creating new cost.
          </p>
        </div>

        <TableBlock
          title="Labour pool"
          help_text="Labour includes productive and support / non-productive labour. Support labour adds cost only and does not add productive recovery hours."
        >
          <TableRow
            label="Available labour cost"
            value={formatMoney(labour_available)}
          />
          <TableRow
            label="Assigned labour cost"
            value={formatMoney(labour_assigned)}
          />
          <TableRow
            label="Remaining labour cost"
            value={formatMoney(labour_remaining)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Productive asset pool"
          help_text="Assets are assigned into operating groups by allocation percentage."
        >
          <TableRow
            label="Available asset cost"
            value={formatMoney(asset_available)}
          />
          <TableRow
            label="Assigned asset cost"
            value={formatMoney(asset_assigned)}
          />
          <TableRow
            label="Remaining asset cost"
            value={formatMoney(asset_remaining)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Overhead pool"
          help_text="Overhead is distributed automatically from the operating structure after labour and asset assignments are known."
        >
          <TableRow
            label="Available overhead"
            value={formatMoney(overhead_available)}
          />
          <TableRow
            label="Assigned overhead"
            value={formatMoney(overhead_assigned)}
          />
          <TableRow
            label="Remaining overhead"
            value={formatMoney(overhead_remaining)}
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
}) {
  const current_section = active_section || "groups";

  if (current_section === "groups") {
    return (
      <CostAllocationGroupsCard
        divisions={divisions}
        groups={groups}
        labour_assignment={labour_assignment}
        asset_assignment={asset_assignment}
        overhead_assignment={overhead_assignment}
        add_division={add_division}
        update_division={update_division}
        remove_division={remove_division}
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

  if (current_section === "links") {
    return (
      <CostAllocationLinkTable
        links={links}
        add_asset_labour_link={add_asset_labour_link}
        remove_asset_labour_link={remove_asset_labour_link}
      />
    );
  }

  if (current_section === "group_cost_stacks") {
    return <GroupCostStacksSection recovery_plan={recovery_plan} />;
  }

  if (current_section === "pool_reconciliation") {
    return (
      <PoolReconciliationSection
        recovery_plan={recovery_plan}
        labour_assignment={labour_assignment}
        asset_assignment={asset_assignment}
        overhead_assignment={overhead_assignment}
      />
    );
  }

  if (current_section === "setup_checklist") {
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

  if (current_section === "structural_warnings") {
    return (
      <ChecklistSection
        kicker="Structure warnings"
        title="Operating group and source-pool warnings"
        help_text="These are operating group, productive source-pool, or recovery dependency issues that may prevent the structure from being relied on downstream."
        warnings={evidence?.structural_warnings}
        empty_message="No structural warnings are currently active."
      />
    );
  }

  if (current_section === "evidence") {
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
      help_text={`No component is currently connected for active_section: ${current_section}`}
    />
  );
}






