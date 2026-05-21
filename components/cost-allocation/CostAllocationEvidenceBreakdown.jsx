"use client";

import CostAllocationGroupsCard from "@/components/cost-allocation/CostAllocationGroupsCard";
import CostAllocationLinkTable from "@/components/cost-allocation/CostAllocationLinkTable";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function formatRate(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}/hr`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function getGroupRows(recovery_plan) {
  return Array.isArray(recovery_plan?.operational_group_recovery_rows)
    ? recovery_plan.operational_group_recovery_rows
    : [];
}

function getLabourRows(recovery_plan) {
  return Array.isArray(recovery_plan?.productive_labour_type_rows)
    ? recovery_plan.productive_labour_type_rows
    : [];
}

function getAssetRows(recovery_plan) {
  return Array.isArray(recovery_plan?.asset_recovery_rows)
    ? recovery_plan.asset_recovery_rows
    : [];
}

function getRunningRate(row) {
  return (
    Number(row?.running_cost_rate_per_hour || 0) ||
    Number(row?.labour_recovery_rate_per_hour || 0) +
      Number(row?.asset_recovery_rate_per_hour || 0)
  );
}

function getOverheadBurdenRate(row) {
  const explicit_value =
    row?.overhead_burden_rate_per_hour ??
    row?.business_overhead_rate_per_hour ??
    row?.allocated_overhead_rate_per_hour ??
    row?.remaining_overhead_rate_per_hour;

  if (explicit_value !== undefined && explicit_value !== null) {
    return Number(explicit_value || 0);
  }

  const minimum_rate = Number(row?.minimum_recoverable_rate_per_hour || 0);
  const running_rate = getRunningRate(row);

  if (minimum_rate > running_rate) {
    return minimum_rate - running_rate;
  }

  return 0;
}

function getMinimumRecoverableRate(row) {
  const explicit_value = Number(row?.minimum_recoverable_rate_per_hour || 0);

  if (explicit_value > 0) {
    return explicit_value;
  }

  return getRunningRate(row) + getOverheadBurdenRate(row);
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
            {warning?.title || warning?.label || warning?.key || "Warning"}
          </div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {warning?.message || warning?.description || warning}
          </div>
        </div>
      ))}
    </div>
  );
}

function RateReadinessLabel({ group }) {
  if (group?.is_rate_ready) {
    return <span className="ui-pill">Ready</span>;
  }

  if (!group?.has_labour_rate && group?.has_asset_rate) {
    return <span className="ui-pill">Labour missing</span>;
  }

  if (group?.has_labour_rate && !group?.has_asset_rate) {
    return <span className="ui-pill">Asset missing</span>;
  }

  return <span className="ui-pill">Incomplete</span>;
}

function ProductiveLabourTypeTable({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="ui-readonly">
        <p className="ui-help">
          No productive labour type rows are currently available from Labour.
        </p>
      </div>
    );
  }

  return (
    <div className="ui-readonly">
      <div className="ui-stack-sm">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Labour rates from Labour
          </p>
          <p className="ui-help">
            Cost Allocation uses Labour’s productive type weighted rate. It does
            not rebuild wages or labour cost here.
          </p>
        </div>

        <div className="labour-summary-table">
          {rows.map((row) => (
            <div
              key={row.labour_type_key || row.labour_type_label}
              className="labour-summary-table-row"
            >
              <div className="labour-summary-table-label">
                <div>{row.labour_type_label || "Productive labour"}</div>
                <div className="ui-help">
                  Staff {row.staff_count || 0} · Hours{" "}
                  {formatNumber(row.total_productive_hours)}
                </div>
              </div>

              <div className="labour-summary-table-value">
                <div>{formatRate(row.weighted_recovery_rate)}</div>
                <div className="ui-help">
                  Highest {formatRate(row.highest_recovery_rate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RunningCostSection({ recovery_plan }) {
  const rows = getGroupRows(recovery_plan);
  const labour_rows = getLabourRows(recovery_plan);

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Running cost</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost to run each working unit
          </h3>
          <p className="ui-help">
            This is the direct productive cost inside the working unit: labour
            doing the work plus productive assets used to do the work.
          </p>
        </div>

        <ProductiveLabourTypeTable rows={labour_rows} />

        {rows.length === 0 ? (
          <div className="ui-readonly">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No working unit rates available yet
            </p>
            <p className="mt-1 ui-help">
              Create a working unit first. Running cost will appear once the
              group has productive labour or productive assets selected.
            </p>
          </div>
        ) : (
          <div className="ui-stack">
            {rows.map((group) => {
              const labour_rate = Number(
                group.labour_recovery_rate_per_hour || 0
              );
              const asset_rate = Number(group.asset_recovery_rate_per_hour || 0);
              const running_rate = getRunningRate(group);

              return (
                <div
                  key={group.group_id || group.group_name}
                  className="ui-readonly"
                >
                  <div className="ui-stack-sm">
                    <div className="ui-actions">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {group.group_name || "Unnamed working unit"}
                        </p>
                        <p className="ui-help">
                          Staff {group.selected_staff_count || 0} · Assets{" "}
                          {group.selected_asset_count || 0}
                        </p>
                      </div>
                      <RateReadinessLabel group={group} />
                    </div>

                    <div className="labour-summary-table">
                      <TableRow
                        label="Labour running cost"
                        value={formatRate(labour_rate)}
                        help="Productive labour rate from Labour."
                      />
                      <TableRow
                        label="Asset running cost"
                        value={formatRate(asset_rate)}
                        help="Productive asset recovery rate from Assets / Recovery Summary."
                      />
                      <TableRow
                        label="Running cost total"
                        value={formatRate(running_rate)}
                        help="Cost to physically run this working unit."
                        total
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="ui-help">
          Running cost is not the final number. The unit still has to carry
          overhead burden before it becomes a true minimum recoverable rate.
        </p>
      </div>
    </section>
  );
}

function OverheadBurdenSection({ recovery_plan }) {
  const rows = getGroupRows(recovery_plan);

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Overhead burden</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost each working unit must carry
          </h3>
          <p className="ui-help">
            This is the working-unit recovery share left after direct labour and
            productive asset running cost. Materials / products recovery stays
            outside Cost Allocation.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="ui-readonly">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No working units available yet
            </p>
            <p className="mt-1 ui-help">
              Create a working unit first. Overhead burden will be shown against
              each working unit once the recovery layer is wired.
            </p>
          </div>
        ) : (
          <div className="ui-stack">
            {rows.map((group) => {
              const overhead_rate = getOverheadBurdenRate(group);

              return (
                <div
                  key={group.group_id || group.group_name}
                  className="ui-readonly"
                >
                  <div className="ui-stack-sm">
                    <div className="ui-actions">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {group.group_name || "Unnamed working unit"}
                        </p>
                        <p className="ui-help">
                          This is the business cost this unit must carry, not
                          extra labour inside the group.
                        </p>
                      </div>
                      <span className="ui-pill">
                        {group?.is_rate_ready ? "Wired" : "Pending wiring"}
                      </span>
                    </div>

                    <div className="labour-summary-table">
                      <TableRow
                        label="Overhead burden"
                        value={formatRate(overhead_rate)}
                        help="This comes from labour, asset, and intentionally unassigned recovery only."
                        total
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="ui-help">
          Do not put owner, admin, office, or other non-productive support inside
          the working unit unless they are actually doing productive work. The
          working unit carries those costs through overhead burden.
        </p>
      </div>
    </section>
  );
}

function MinimumRecoverableRateSection({ recovery_plan }) {
  const rows = getGroupRows(recovery_plan);
  const labour_rows = getLabourRows(recovery_plan);

  if (rows.length === 0) {
    return (
      <section className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Minimum recoverable rate</p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              No working unit rate build-up yet
            </h3>
            <p className="ui-help">
              Create working units first. Once they have productive labour or
              productive assets, Cost Allocation can show the minimum
              recoverable hourly benchmark.
            </p>
          </div>

          <ProductiveLabourTypeTable rows={labour_rows} />

          <p className="ui-help">
            Minimum recoverable rate is a recovery benchmark, not a sale price.
          </p>
        </div>
      </section>
    );
  }

  const ready_groups = rows.filter((group) => group?.is_rate_ready).length;
  const incomplete_groups = rows.length - ready_groups;
  const highest_rate = rows.reduce((highest, group) => {
    return Math.max(highest, getMinimumRecoverableRate(group));
  }, 0);

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Minimum recoverable rate</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Running cost + overhead burden
          </h3>
          <p className="ui-help">
            This is the true hourly recovery benchmark for each working unit. It
            is not a sale price, quote rate, or recommended charge-out.
          </p>
        </div>

        <TableBlock
          title="Working unit recovery summary"
          help_text="This shows how many working units are ready for revenue testing."
        >
          <TableRow label="Working units" value={formatNumber(rows.length)} />
          <TableRow label="Ready units" value={formatNumber(ready_groups)} />
          <TableRow
            label="Units needing review"
            value={formatNumber(incomplete_groups)}
          />
          <TableRow
            label="Highest minimum recoverable rate"
            value={formatRate(highest_rate)}
            total
          />
        </TableBlock>

        <div className="ui-stack">
          {rows.map((group) => {
            const labour_rate = Number(group.labour_recovery_rate_per_hour || 0);
            const asset_rate = Number(group.asset_recovery_rate_per_hour || 0);
            const running_rate = getRunningRate(group);
            const overhead_rate = getOverheadBurdenRate(group);
            const minimum_rate = getMinimumRecoverableRate(group);

            return (
              <div
                key={group.group_id || group.group_name}
                className="ui-readonly"
              >
                <div className="ui-stack-sm">
                  <div className="ui-actions">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {group.group_name || "Unnamed working unit"}
                      </p>
                      <p className="ui-help">
                        Staff {group.selected_staff_count || 0} · Assets{" "}
                        {group.selected_asset_count || 0}
                      </p>
                    </div>

                    <RateReadinessLabel group={group} />
                  </div>

                  <div className="labour-summary-table">
                    <TableRow
                      label="Labour running cost"
                      value={formatRate(labour_rate)}
                    />
                    <TableRow
                      label="Asset running cost"
                      value={formatRate(asset_rate)}
                    />
                    <TableRow
                      label="Running cost total"
                      value={formatRate(running_rate)}
                      help="Cost to physically run this working unit."
                    />
                    <TableRow
                      label="Overhead burden"
                      value={formatRate(overhead_rate)}
                      help="Business cost this working unit still has to carry."
                    />
                    <TableRow
                      label="Minimum recoverable rate"
                      value={formatRate(minimum_rate)}
                      help="Running cost plus working-unit overhead burden."
                      total
                    />
                  </div>

                  {!group.has_labour_rate ? (
                    <p className="ui-help">
                      Labour rate is missing for this working unit. Check
                      selected productive labour.
                    </p>
                  ) : null}

                  {!group.has_asset_rate ? (
                    <p className="ui-help">
                      Asset rate is missing for this working unit. This is fine
                      for labour-only businesses, but asset-driven units should
                      have productive assets selected.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <p className="ui-help">
          This benchmark goes to the next layer, where it can be compared
          against charge-out rate, product margin, sales volume, or revenue unit.
        </p>
      </div>
    </section>
  );
}

function AssetRecoverySection({ recovery_plan }) {
  const rows = getAssetRows(recovery_plan);

  if (rows.length === 0) {
    return (
      <section className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Asset recovery detail</p>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No asset recovery rows available
            </h3>
            <p className="ui-help">
              Asset recovery rows will appear once Assets provides active asset
              recovery values.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const productive_rows = rows.filter(
    (asset) => asset.asset_type === "productive"
  );
  const support_rows = rows.filter((asset) => asset.asset_type === "support");

  const total_base_cost = rows.reduce(
    (sum, asset) => sum + Number(asset.base_asset_cost_annual || 0),
    0
  );
  const total_pool_cost = rows.reduce(
    (sum, asset) =>
      sum + Number(asset.allocated_asset_overhead_cost_annual || 0),
    0
  );
  const total_recovery_cost = rows.reduce(
    (sum, asset) => sum + Number(asset.asset_recovery_cost_annual || 0),
    0
  );

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Asset recovery detail</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Asset values used in working units
          </h3>
          <p className="ui-help">
            Productive asset recovery can feed working-unit running cost.
            Support assets remain visible but should be carried through overhead
            burden unless they directly produce work.
          </p>
        </div>

        <TableBlock
          title="Asset recovery summary"
          help_text="This is review-only. Cost Allocation does not push these values back into Cost Summary."
        >
          <TableRow
            label="Productive assets"
            value={`${productive_rows.length}`}
          />
          <TableRow label="Support assets" value={`${support_rows.length}`} />
          <TableRow
            label="Base asset cost"
            value={formatMoney(total_base_cost)}
          />
          <TableRow
            label="Assigned asset overhead pools"
            value={formatMoney(total_pool_cost)}
          />
          <TableRow
            label="Total asset recovery cost"
            value={formatMoney(total_recovery_cost)}
            total
          />
        </TableBlock>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Per-asset hourly recovery
            </p>

            <div className="labour-summary-table">
              {rows.map((asset) => (
                <div
                  key={asset.asset_id || asset.asset_name}
                  className="labour-summary-table-row"
                >
                  <div className="labour-summary-table-label">
                    <div>{asset.asset_name || "Unnamed asset"}</div>
                    <div className="ui-help">
                      {asset.asset_type === "support" ? "Support" : "Productive"}
                      {" · "}
                      Annual {formatMoney(asset.asset_recovery_cost_annual)}
                      {" · "}
                      Hours {formatNumber(asset.asset_recovery_hours_used)}
                    </div>
                  </div>

                  <div className="labour-summary-table-value">
                    {formatRate(asset.asset_recovery_rate_per_hour)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="ui-help">
          Asset recovery is a modelling value for Cost Allocation. It must not be
          treated as a sale price or pushed back into Cost Summary.
        </p>
      </div>
    </section>
  );
}

function RecoveryPlanSection({ recovery_plan }) {
  const recovery_split = recovery_plan?.recovery_plan_split ?? {};
  const component_required_recovery =
    recovery_plan?.component_required_recovery ?? {};

  const labour = component_required_recovery?.labour;
  const asset = component_required_recovery?.asset;
  const material = component_required_recovery?.material;
  const overhead = component_required_recovery?.overhead;

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Recovery plan being tested</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {recovery_plan?.active_recovery_model_label ||
              "Read-only strategy from Recovery Summary"}
          </h3>
          <p className="ui-help">
            This plan comes from Recovery Summary. Cost Allocation only shows
            what each working unit must carry.
          </p>
        </div>

        <TableBlock
          title="Recovery basis"
          help_text="This is the recovery strategy being tested against the working units."
        >
          <TableRow
            label="Recovery plan"
            value={
              recovery_plan?.active_recovery_model_label ||
              recovery_plan?.active_recovery_model ||
              "Labour-led recovery"
            }
          />
          <TableRow
            label="Business type"
            value={recovery_plan?.business_type || "labour_based"}
          />
          <TableRow
            label="Target per driver"
            value={`${formatMoney(
              recovery_plan?.recovery_plan_target_per_driver
            )} per ${recovery_plan?.activity_driver_label || "driver"}`}
          />
          <TableRow
            label="Recovery hours used"
            value={formatNumber(recovery_plan?.recovery_hours_used)}
            total
          />
        </TableBlock>

        <TableBlock
          title="Recovery split"
          help_text="This shows the recovery strategy before it is expressed at working-unit level."
        >
          <TableRow
            label="Labour recovery"
            value={
              labour
                ? `${formatMoney(labour.recovery_cost)} at ${Number(
                    labour.share_percent || 0
                  ).toFixed(1)}%`
                : `${Number(recovery_split.labour_share_percent || 0).toFixed(
                    1
                  )}%`
            }
          />
          <TableRow
            label="Asset recovery"
            value={
              asset
                ? `${formatMoney(asset.recovery_cost)} at ${Number(
                    asset.share_percent || 0
                  ).toFixed(1)}%`
                : `${Number(recovery_split.asset_share_percent || 0).toFixed(
                    1
                  )}%`
            }
          />
          <TableRow
            label="Material recovery"
            value={
              material
                ? `${formatMoney(material.recovery_cost)} at ${Number(
                    material.share_percent || 0
                  ).toFixed(1)}%`
                : `${Number(recovery_split.material_share_percent || 0).toFixed(
                    1
                  )}%`
            }
          />
          <TableRow
            label="Unassigned / overhead recovery"
            value={
              overhead
                ? `${formatMoney(overhead.recovery_cost)} at ${Number(
                    overhead.share_percent || 0
                  ).toFixed(1)}%`
                : `${Number(
                    recovery_split.overhead_absorbed_percent ??
                      recovery_split.overhead_share_percent ??
                      0
                  ).toFixed(1)}%`
            }
            total
          />
        </TableBlock>
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
            Working-unit readiness
          </h3>
          <p className="ui-help">
            These checks explain whether the working-unit setup is ready to move
            to revenue testing.
          </p>
        </div>

        <TableBlock
          title="Structure coverage"
          help_text="Coverage shows whether productive labour, productive assets, and working units are properly assigned."
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
          help_text="These counts show which people, assets, and working units still need review."
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
            label="Ready / incomplete working units"
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

export default function CostAllocationEvidenceBreakdown({
  active_section,
  recovery_plan,
  allocation_tests,
  delivery_summary,
  evidence,
  links,
  groups,
  problems,
  add_asset_labour_link,
  remove_asset_labour_link,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
}) {
  if (active_section === "recovery_plan") {
    return (
      <RecoveryPlanSection
        recovery_plan={recovery_plan}
        allocation_tests={allocation_tests}
      />
    );
  }

  if (active_section === "running_cost") {
    return <RunningCostSection recovery_plan={recovery_plan} />;
  }

  if (active_section === "overhead_burden") {
    return <OverheadBurdenSection recovery_plan={recovery_plan} />;
  }

  if (active_section === "operational_recovery") {
    return <MinimumRecoverableRateSection recovery_plan={recovery_plan} />;
  }

  if (active_section === "asset_recovery") {
    return <AssetRecoverySection recovery_plan={recovery_plan} />;
  }

  if (active_section === "setup_checklist") {
    return (
      <ChecklistSection
        kicker="Setup checklist"
        title="Setup items needing review"
        help_text="Complete these items to make the working-unit setup reliable."
        warnings={evidence?.setup_warnings}
        empty_message="No setup checklist items are currently active."
      />
    );
  }

  if (active_section === "structural_warnings") {
    return (
      <ChecklistSection
        kicker="Capacity and dependency"
        title="Capacity and dependency warnings"
        help_text="These are structure, capacity, or dependency issues that may prevent the recovery plan from being fully supported."
        warnings={evidence?.structural_warnings}
        empty_message="No structural warnings are currently active."
      />
    );
  }

  if (active_section === "groups") {
    return (
      <CostAllocationGroupsCard
        groups={groups}
        add_operational_group={add_operational_group}
        update_operational_group={update_operational_group}
        remove_operational_group={remove_operational_group}
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

  if (active_section === "evidence") {
    return (
      <WhatNeedsAttentionSection
        delivery_summary={delivery_summary}
        problems={problems}
      />
    );
  }

  return null;
}
