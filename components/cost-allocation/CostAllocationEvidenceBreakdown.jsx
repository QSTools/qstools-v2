"use client";

import CostAllocationLinkTable from "@/components/cost-allocation/CostAllocationLinkTable";
import CostAllocationGroupsCard from "@/components/cost-allocation/CostAllocationGroupsCard";

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

function formatStatusLabel(value) {
  const label_map = {
    pending_live_feedback: "Pending live job feedback",
    estimated: "Estimated until verified",
    not_selected: "Not selected",
  };

  return label_map[value] || value || "Not available";
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row ${total ? "total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
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

function AssetRecoveryTable({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="ui-readonly">
        <p className="ui-help">
          No asset recovery rows are currently available from Assets.
        </p>
      </div>
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
          <p className="ui-kicker">Asset Recovery</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Asset recovery build-up used by Cost Allocation
          </h3>
          <p className="ui-help">
            This table comes from Assets. It converts annual asset recovery cost
            into an hourly rate using the Labour recovery hours from Recovery
            Summary.
          </p>
        </div>

        <TableBlock
          title="Asset recovery summary"
          help_text="Productive assets can support asset recovery. Support assets remain visible as cost context but do not create productive recovery capacity."
        >
          <TableRow
            label="Productive assets"
            value={`${productive_rows.length}`}
          />
          <TableRow label="Support assets" value={`${support_rows.length}`} />
          <TableRow label="Base asset cost" value={formatMoney(total_base_cost)} />
          <TableRow
            label="Assigned overhead pools"
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
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Per-asset recovery build-up
              </p>
              <p className="ui-help">
                Hourly rate is annual asset recovery cost divided by recovery
                hours used.
              </p>
            </div>

            <div className="labour-summary-table">
              {rows.map((asset) => (
                <div
                  key={asset.asset_id || asset.asset_name}
                  className="labour-summary-table-row"
                >
                  <div className="labour-summary-table-label">
                    <div>{asset.asset_name || "Unnamed Asset"}</div>
                    <div className="ui-help">
                      {asset.asset_type === "support" ? "Support" : "Productive"}
                      {" · "}
                      Base {formatMoney(asset.base_asset_cost_annual)}
                      {" · "}
                      Pools{" "}
                      {formatMoney(asset.allocated_asset_overhead_cost_annual)}
                      {" · "}
                      Hours {formatNumber(asset.asset_recovery_hours_used)}
                    </div>
                  </div>

                  <div className="labour-summary-table-value">
                    <div>{formatMoney(asset.asset_recovery_cost_annual)}</div>
                    <div className="ui-help">
                      {formatRate(asset.asset_recovery_rate_per_hour)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
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
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Labour Recovery</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Productive labour type rates
          </h3>
          <p className="ui-help">
            Cost Allocation uses the weighted recovery rate from Labour when
            building operational group recovery rates.
          </p>
        </div>

        <div className="labour-summary-table">
          {rows.map((row) => (
            <div
              key={row.labour_type_key || row.labour_type_label}
              className="labour-summary-table-row"
            >
              <div className="labour-summary-table-label">
                <div>{row.labour_type_label}</div>
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
    </section>
  );
}

function OperationalRecoveryTable({ rows = [], labour_rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <section className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Operational Recovery</p>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No operational recovery groups yet
            </h3>
            <p className="ui-help">
              Create operational groups first. Once groups have a productive
              labour type and asset assignment, Cost Allocation can calculate a
              combined hourly recovery rate.
            </p>
          </div>

          <ProductiveLabourTypeTable rows={labour_rows} />
        </div>
      </section>
    );
  }

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Operational Recovery</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Operational group recovery rate build-up
          </h3>
          <p className="ui-help">
            This combines the productive labour type weighted recovery rate with
            the asset hourly recovery rate.
          </p>
        </div>

        <ProductiveLabourTypeTable rows={labour_rows} />

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Group rate build-up
              </p>
              <p className="ui-help">
                Labour rate + asset hourly recovery rate = operational group
                recovery rate.
              </p>
            </div>

            <div className="labour-summary-table">
              {rows.map((group) => (
                <div
                  key={group.group_id || group.group_name}
                  className="labour-summary-table-row"
                >
                  <div className="labour-summary-table-label">
                    <div>{group.group_name}</div>
                    <div className="ui-help">
                      {group.labour_type_label}
                      {" · "}
                      Assets {group.asset_count || 0}
                      {Array.isArray(group.asset_names) &&
                      group.asset_names.length > 0
                        ? ` · ${group.asset_names.join(", ")}`
                        : ""}
                    </div>
                    {!group.has_labour_rate ? (
                      <div className="ui-help">
                        Labour rate missing for this group.
                      </div>
                    ) : null}
                  </div>

                  <div className="labour-summary-table-value">
                    <div>
                      {formatRate(group.operational_group_recovery_rate_per_hour)}
                    </div>
                    <div className="ui-help">
                      Labour {formatRate(group.labour_recovery_rate_per_hour)}
                      {" + "}
                      Asset {formatRate(group.asset_recovery_rate_per_hour)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
          <p className="ui-kicker">Recovery Plan</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {recovery_plan?.active_recovery_model_label ||
              "Read-only strategy from Recovery Summary"}
          </h3>
          <p className="ui-help">
            Cost Allocation consumes this plan from Recovery Summary and tests
            whether the delivery structure can support it.
          </p>
        </div>

        <TableBlock
          title="Recovery basis"
          help_text="This is the selected recovery strategy being tested against your delivery structure."
        >
          <TableRow
            label="Active recovery model"
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
          />
        </TableBlock>

        <TableBlock
          title="Recovery split"
          help_text="This shows how the selected recovery plan spreads recovery pressure across labour, assets, materials, and unassigned recovery."
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
            label="Unassigned recovery"
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

        <TableBlock
          title="Asset context"
          help_text="This shows whether asset recovery has a visible productive asset base to test."
        >
          <TableRow
            label="Productive asset recovery base"
            value={
              recovery_plan?.has_productive_asset_recovery_base
                ? `${recovery_plan?.productive_asset_count ?? 0} productive asset(s)`
                : "No productive asset recovery base"
            }
          />
          <TableRow
            label="Support assets"
            value={`${recovery_plan?.support_asset_count ?? 0} support asset(s) remain in cost burden`}
          />
          <TableRow
            label="Asset utilisation"
            value={formatStatusLabel(recovery_plan?.asset_utilisation_status)}
            total
          />
        </TableBlock>
      </div>
    </section>
  );
}

function ChecklistSection({ title, help_text, warnings, empty_message }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">{title}</p>
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

function EvidenceSection({ delivery_summary, problems }) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Evidence</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Structural coverage and dependency evidence
          </h3>
          <p className="ui-help">
            These values show the current structure and dependency signals used
            by Cost Allocation.
          </p>
        </div>

        <TableBlock
          title="Coverage"
          help_text="Coverage shows how much of the visible staff, asset, and group structure has been assigned."
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
          help_text="These counts show what is currently linked and grouped."
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
            label="Valid / invalid groups"
            value={`${delivery_summary?.valid_operational_groups ?? 0} / ${
              delivery_summary?.invalid_operational_groups ?? 0
            }`}
            total
          />
        </TableBlock>

        <TableBlock
          title="Dependency signals"
          help_text="These show whether the structure depends on extra capacity or external delivery."
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

  if (active_section === "setup_checklist") {
    return (
      <ChecklistSection
        title="Setup checklist"
        help_text="Complete these items to finish defining how the business delivers work."
        warnings={evidence?.setup_warnings}
        empty_message="No setup checklist items are currently active."
      />
    );
  }

  if (active_section === "structural_warnings") {
    return (
      <ChecklistSection
        title="Structural warnings"
        help_text="These are structural issues that may prevent this recovery strategy from being supported."
        warnings={evidence?.structural_warnings}
        empty_message="No structural warnings are currently active."
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

  if (active_section === "asset_recovery") {
    return <AssetRecoveryTable rows={recovery_plan?.asset_recovery_rows} />;
  }

  if (active_section === "operational_recovery") {
    return (
      <OperationalRecoveryTable
        rows={recovery_plan?.operational_group_recovery_rows}
        labour_rows={recovery_plan?.productive_labour_type_rows}
      />
    );
  }

  if (active_section === "evidence") {
    return (
      <EvidenceSection
        delivery_summary={delivery_summary}
        problems={problems}
      />
    );
  }

  return null;
}