"use client";

import CostAllocationProfilesCard from "@/components/cost-allocation/CostAllocationProfilesCard";
import CostAllocationLinkTable from "@/components/cost-allocation/CostAllocationLinkTable";
import CostAllocationGroupsCard from "@/components/cost-allocation/CostAllocationGroupsCard";

export default function CostAllocationMainCard({
  profile,
  recovery_context,
  structural_readiness,
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
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Cost Allocation v2.1
            </h2>
            <p className="ui-help">
              Structural + operational validation only. No cost logic. No recovery
              maths. No pricing packages.
            </p>
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

          <div className="ui-stack">
            <section className="ui-panel">
              <div className="ui-stack">
                <div>
                  <p className="ui-kicker">A. Recovery context</p>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    Read-only recovery settings
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="ui-readonly">
                    <span className="ui-label">Active recovery model</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {recovery_context?.active_recovery_model}
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Labour share</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {recovery_context?.labour_share_percent}%
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Asset share</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {recovery_context?.asset_share_percent}%
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Overhead share</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {recovery_context?.overhead_share_percent}%
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="ui-panel">
              <div className="ui-stack">
                <div>
                  <p className="ui-kicker">B. Structural readiness</p>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    Coverage and completeness
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="ui-readonly">
                    <span className="ui-label">Linked staff</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {structural_readiness?.linked_staff_count} /{" "}
                      {structural_readiness?.total_active_staff}
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Linked assets</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {structural_readiness?.linked_asset_count} /{" "}
                      {structural_readiness?.total_active_assets}
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Staff coverage</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {structural_readiness?.staff_coverage_label}
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Asset coverage</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {structural_readiness?.asset_coverage_label}
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Group coverage</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {structural_readiness?.group_coverage_label}
                    </div>
                  </div>

                  <div className="ui-readonly">
                    <span className="ui-label">Structure valid</span>
                    <div className="mt-1 text-sm text-[var(--text-primary)]">
                      {structural_readiness?.structure_valid ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>
            </section>

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
                  <p className="ui-kicker">E. Problem highlights</p>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    Structural gaps
                  </h3>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Unlinked staff</span>
                  <div className="mt-1 text-sm text-[var(--text-primary)]">
                    {problems?.unlinked_staff_count}
                  </div>
                </div>

                <div className="ui-readonly">
                  <span className="ui-label">Unlinked assets</span>
                  <div className="mt-1 text-sm text-[var(--text-primary)]">
                    {problems?.unlinked_asset_count}
                  </div>
                </div>

                <div className="ui-stack">
                  {(problems?.warnings ?? []).length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      No structural warnings yet.
                    </p>
                  ) : (
                    (problems?.warnings ?? []).map((warning, index) => (
                      <div key={`${warning}-${index}`} className="ui-readonly">
                        <div className="text-sm text-[var(--text-primary)]">
                          {warning}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}