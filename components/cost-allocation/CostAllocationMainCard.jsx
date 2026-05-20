"use client";

import { useState } from "react";

import CostAllocationProfilesCard from "@/components/cost-allocation/CostAllocationProfilesCard";
import CostAllocationEvidenceBreakdown from "@/components/cost-allocation/CostAllocationEvidenceBreakdown";

function SectionButton({ section, is_active, on_click }) {
  return (
    <button
      type="button"
      onClick={on_click}
      className={`ui-panel text-left transition ${
        is_active ? "border border-[var(--accent)]" : ""
      }`}
    >
      <div className="ui-stack-sm">
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          {section.label}
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {section.meta}
        </div>
      </div>
    </button>
  );
}

export default function CostAllocationMainCard({
  profile,
  outcome,
  recovery_plan,
  allocation_tests,
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
  const [active_section, set_active_section] = useState("setup_checklist");

  const setup_count = outcome?.setup_warnings_count ?? 0;
  const structural_count = outcome?.structural_warnings_count ?? 0;
  const links_count = links?.rows?.length ?? 0;
  const groups_count = groups?.rows?.length ?? 0;
  const asset_recovery_count = Array.isArray(recovery_plan?.asset_recovery_rows)
    ? recovery_plan.asset_recovery_rows.length
    : 0;
  const operational_recovery_count = Array.isArray(
    recovery_plan?.operational_group_recovery_rows
  )
    ? recovery_plan.operational_group_recovery_rows.length
    : 0;

  const sections = [
    {
      key: "recovery_plan",
      label: "Recovery Plan",
      meta: recovery_plan?.active_recovery_model_label || "Read-only strategy",
    },
    {
      key: "setup_checklist",
      label: "Setup Checklist",
      meta: `${setup_count} item${setup_count === 1 ? "" : "s"}`,
    },
    {
      key: "structural_warnings",
      label: "Structural Warnings",
      meta: `${structural_count} warning${structural_count === 1 ? "" : "s"}`,
    },
    {
      key: "links",
      label: "Links",
      meta: `${links_count} active`,
    },
    {
      key: "groups",
      label: "Operational Groups",
      meta: `${groups_count} active`,
    },
    {
      key: "asset_recovery",
      label: "Asset Recovery",
      meta: `${asset_recovery_count} asset${asset_recovery_count === 1 ? "" : "s"}`,
    },
    {
      key: "operational_recovery",
      label: "Operational Recovery",
      meta: `${operational_recovery_count} group${operational_recovery_count === 1 ? "" : "s"}`,
    },
    {
      key: "evidence",
      label: "Evidence",
      meta: delivery_summary?.structure_valid ? "Valid" : "Review",
    },
  ];

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <section className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Overall structural result</p>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {outcome?.headline || "Cost allocation needs review."}
              </h2>
              <p className="ui-help">{outcome?.reason}</p>
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

            <div className="ui-readonly">
              <span className="ui-label">Recommended check</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {outcome?.recommended_check || "Review allocation setup."}
              </div>
            </div>
          </div>
        </section>

        <section className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Cost allocation sections</p>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Review or edit one section at a time
              </h3>
              <p className="ui-help">
                Cost Allocation tests delivery structure only. It does not
                calculate pricing, revenue, margin, or commercial viability.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => (
                <SectionButton
                  key={section.key}
                  section={section}
                  is_active={active_section === section.key}
                  on_click={() => set_active_section(section.key)}
                />
              ))}
            </div>
          </div>
        </section>

        <CostAllocationEvidenceBreakdown
          active_section={active_section}
          recovery_plan={recovery_plan}
          allocation_tests={allocation_tests}
          delivery_summary={delivery_summary}
          evidence={evidence}
          links={links}
          groups={groups}
          problems={problems}
          add_asset_labour_link={add_asset_labour_link}
          remove_asset_labour_link={remove_asset_labour_link}
          add_operational_group={add_operational_group}
          update_operational_group={update_operational_group}
          remove_operational_group={remove_operational_group}
        />

        <section className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Allocation profile</p>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Supporting setup
              </h3>
              <p className="ui-help">
                Save, load, or create allocation setups. These controls do not
                change the selected recovery strategy.
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
          </div>
        </section>
      </div>
    </section>
  );
}