"use client";

import CostAllocationProfilesCard from "@/components/cost-allocation/CostAllocationProfilesCard";
import CostAllocationLinkTable from "@/components/cost-allocation/CostAllocationLinkTable";
import CostAllocationGroupsCard from "@/components/cost-allocation/CostAllocationGroupsCard";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function DetailRow({ label, value }) {
  return (
    <div className="ui-readonly">
      <span className="ui-label">{label}</span>
      <div className="mt-1 text-sm text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function WarningList({ title, warnings = [] }) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return null;
  }

  return (
    <div className="ui-stack-sm">
      <span className="ui-label">{title}</span>
      {warnings.map((warning, index) => (
        <div key={`${title}-${index}`} className="ui-readonly">
          <div className="text-sm text-[var(--text-primary)]">
            {warning?.message || warning?.label || warning}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactEvidence({ delivery_summary }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <DetailRow
        label="Staff coverage"
        value={formatPercent(delivery_summary?.staff_coverage_percent)}
      />
      <DetailRow
        label="Asset coverage"
        value={formatPercent(delivery_summary?.asset_coverage_percent)}
      />
      <DetailRow
        label="Group coverage"
        value={formatPercent(delivery_summary?.group_coverage_percent)}
      />
      <DetailRow
        label="Linked / unlinked staff"
        value={`${delivery_summary?.linked_staff_count ?? 0} / ${
          delivery_summary?.unlinked_staff_count ?? 0
        }`}
      />
      <DetailRow
        label="Linked / unlinked assets"
        value={`${delivery_summary?.linked_asset_count ?? 0} / ${
          delivery_summary?.unlinked_asset_count ?? 0
        }`}
      />
      <DetailRow
        label="Valid / invalid groups"
        value={`${delivery_summary?.valid_operational_groups ?? 0} / ${
          delivery_summary?.invalid_operational_groups ?? 0
        }`}
      />
    </div>
  );
}

function RecoveryComponentRows({ component_required_recovery }) {
  const labour = component_required_recovery?.labour;
  const asset = component_required_recovery?.asset;
  const overhead = component_required_recovery?.overhead;

  if (!labour && !asset && !overhead) {
    return (
      <p className="ui-help">
        Component recovery detail is not available from Recovery Summary.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {labour ? (
        <DetailRow
          label="Labour recovery"
          value={`${formatMoney(labour.recovery_cost)} at ${Number(
            labour.share_percent || 0,
          ).toFixed(1)}%`}
        />
      ) : null}

      {asset ? (
        <DetailRow
          label="Asset recovery"
          value={`${formatMoney(asset.recovery_cost)} at ${Number(
            asset.share_percent || 0,
          ).toFixed(1)}%`}
        />
      ) : null}

      {overhead ? (
        <DetailRow
          label="Overhead recovery"
          value={`${formatMoney(overhead.recovery_cost)} at ${Number(
            overhead.share_percent || 0,
          ).toFixed(1)}%`}
        />
      ) : null}
    </div>
  );
}

export default function CostAllocationMainCard({
  profile,
  outcome,
  recovery_plan,
  delivery_summary,
  evidence,
  links,
  groups,
  problems,
  set_field,
  add_asset_labour_link,
  remove_asset_labour_link,
  add_operational_group,
  update_operational_group,
  remove_operational_group,
  save_profile,
  load_profile,
  delete_profile,
  new_profile,
}) {
  const recovery_split = recovery_plan?.recovery_plan_split ?? {};

  return (
    <section className="ui-section">
      <div className="ui-stack">
          <section className="ui-panel">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Allocation outcome</p>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  {outcome?.headline || "This recovery plan needs review."}
                </h2>
                <p className="ui-help">{outcome?.reason}</p>
              </div>

              <div className="ui-readonly">
                <span className="ui-label">Recommended check</span>
                <div className="mt-1 text-sm text-[var(--text-primary)]">
                  {outcome?.recommended_check}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <DetailRow
                  label="Dependency"
                  value={outcome?.allocation_dependency_label || "Unknown"}
                />
                <DetailRow
                  label="Structure valid"
                  value={yesNo(outcome?.structure_valid)}
                />
                <DetailRow
                  label="Internal shortfall"
                  value={yesNo(outcome?.internal_capacity_shortfall)}
                />
                <DetailRow
                  label="External delivery required"
                  value={yesNo(outcome?.external_delivery_required)}
                />
                <DetailRow
                  label="External delivery confirmed"
                  value={yesNo(outcome?.external_delivery_enabled)}
                />
                <DetailRow
                  label="Warnings"
                  value={outcome?.warning_count ?? 0}
                />
              </div>
            </div>
          </section>

          <section className="ui-panel">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Recovery plan being tested</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Read-only strategy from Recovery Summary
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <DetailRow
                  label="Active recovery model"
                  value={recovery_plan?.active_recovery_model || "labour_only"}
                />
                <DetailRow
                  label="Target per driver"
                  value={`${formatMoney(
                    recovery_plan?.recovery_plan_target_per_driver,
                  )} per ${recovery_plan?.activity_driver_label || "driver"}`}
                />
                <DetailRow
                  label="Business type"
                  value={recovery_plan?.business_type || "labour_based"}
                />
                <DetailRow
                  label="Labour / asset / overhead split"
                  value={`${Number(recovery_split.labour_share_percent || 0).toFixed(
                    1,
                  )}% / ${Number(recovery_split.asset_share_percent || 0).toFixed(
                    1,
                  )}% / ${Number(
                    recovery_split.overhead_share_percent || 0,
                  ).toFixed(1)}%`}
                />
              </div>

              <RecoveryComponentRows
                component_required_recovery={
                  recovery_plan?.component_required_recovery
                }
              />
            </div>
          </section>

          <section className="ui-panel">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Delivery and dependency summary</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  What the visible structure supports
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <DetailRow
                  label="Allocation status"
                  value={
                    delivery_summary?.allocation_status_label ||
                    "Not currently supported"
                  }
                />
                <DetailRow
                  label="Dependency type"
                  value={delivery_summary?.allocation_dependency_label || "Unknown"}
                />
                <DetailRow
                  label="Structure valid"
                  value={yesNo(delivery_summary?.structure_valid)}
                />
                <DetailRow
                  label="Internal capacity shortfall"
                  value={yesNo(delivery_summary?.internal_capacity_shortfall)}
                />
                <DetailRow
                  label="External delivery required"
                  value={yesNo(delivery_summary?.external_delivery_required)}
                />
                <DetailRow
                  label="External delivery confirmed"
                  value={yesNo(delivery_summary?.external_delivery_enabled)}
                />
              </div>
            </div>
          </section>

          <section className="ui-panel">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Evidence summary</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Coverage and structural evidence
                </h3>
              </div>

              <CompactEvidence delivery_summary={delivery_summary} />
            </div>
          </section>

          <section className="ui-panel">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Warnings and evidence</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  What needs attention
                </h3>
              </div>

              {evidence?.main_issue ? (
                <div className="ui-readonly">
                  <span className="ui-label">Main issue</span>
                  <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                    {evidence.main_issue.title}
                  </div>
                  <div className="mt-1 text-sm text-[var(--text-secondary)]">
                    {evidence.main_issue.message}
                  </div>
                </div>
              ) : null}

              <div className="ui-stack-sm">
                <span className="ui-label">Structure evidence</span>
                <CompactEvidence delivery_summary={delivery_summary} />
              </div>

              {(evidence?.supporting_warnings ?? []).length === 0 ? (
                <p className="ui-help">No allocation warnings are currently active.</p>
              ) : null}

              <WarningList
                title="Supporting warnings"
                warnings={evidence?.supporting_warnings}
              />
              {(evidence?.additional_warnings ?? []).length > 0 ? (
                <details className="ui-readonly">
                  <summary className="text-sm font-medium text-[var(--text-primary)]">
                    Show additional warnings
                  </summary>
                  <div className="mt-3">
                    <WarningList
                      title="Additional warnings"
                      warnings={evidence?.additional_warnings}
                    />
                  </div>
                </details>
              ) : null}
            </div>
          </section>

          <div className="ui-panel">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Allocation profile</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Supporting setup
                </h3>
                <p className="ui-help">
                  These controls support the allocation evidence above. They do not
                  change the recovery strategy.
                </p>
              </div>
            </div>
          </div>

          <CostAllocationProfilesCard
            allocation_profile_name={profile?.allocation_profile_name}
            effective_from={profile?.effective_from}
            set_field={set_field}
            on_save_profile={save_profile}
            on_new_profile={new_profile}
            profiles={profile?.profiles}
            active_profile_id={profile?.active_profile_id}
            on_load_profile={load_profile}
            on_delete_profile={delete_profile}
          />

          <CostAllocationLinkTable
            links={links}
            add_asset_labour_link={add_asset_labour_link}
            remove_asset_labour_link={remove_asset_labour_link}
          />

          <CostAllocationGroupsCard
            groups={groups}
            add_operational_group={add_operational_group}
            update_operational_group={update_operational_group}
            remove_operational_group={remove_operational_group}
          />

          <section className="ui-panel">
            <div className="ui-stack">
              <div>
                <p className="ui-kicker">Structural gaps</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Editor support details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <DetailRow
                  label="Unlinked staff"
                  value={problems?.unlinked_staff_count ?? 0}
                />
                <DetailRow
                  label="Unlinked assets"
                  value={problems?.unlinked_asset_count ?? 0}
                />
              </div>
            </div>
          </section>
      </div>
    </section>
  );
}
