"use client";

import { useMemo, useState } from "react";

import CostAllocationEvidenceBreakdown from "@/components/cost-allocation/CostAllocationEvidenceBreakdown";
import CostAllocationProfilesCard from "@/components/cost-allocation/CostAllocationProfilesCard";

const STATUS_LABELS = {
  ready: "Supported internally",
  ready_with_dependency: "Supported with dependency",
  strained: "Structurally strained",
  not_supported: "Not currently supported",
  incomplete: "Incomplete",
  review: "Review required",
};

const STATUS_HELP = {
  ready: "The current working units appear to support the selected recovery plan.",
  ready_with_dependency:
    "The plan may work, but it depends on external or scalable delivery capacity.",
  strained:
    "The plan may be possible, but the current working units are under pressure.",
  not_supported:
    "The current working units do not yet support the selected recovery plan.",
  incomplete:
    "More setup is required before this recovery plan can be properly tested.",
  review: "Review the working units and minimum recoverable rate.",
};

const DEPENDENCY_LABELS = {
  none: "No major dependency",
  internal_capacity: "Internal capacity",
  external_delivery: "External delivery",
  asset_structure: "Asset structure",
  operational_groups: "Working units",
  mixed: "Mixed dependency",
  unknown: "Unknown dependency",
};

const INPUT_SECTION_KEYS = ["recovery_plan", "profile", "groups"];

const REVIEW_SECTION_KEYS = [
  "running_cost",
  "overhead_burden",
  "operational_recovery",
  "evidence",
  "setup_checklist",
];

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getStatusLabel(value, fallback) {
  return STATUS_LABELS[value] || fallback || value || "Review required";
}

function getStatusHelp(value) {
  return STATUS_HELP[value] || "Review the working units and supporting structure.";
}

function getDependencyLabel(value) {
  return DEPENDENCY_LABELS[value] || value || "Not classified";
}

function MetricCard({ label, value, help }) {
  return (
    <div className="ui-readonly">
      <span className="ui-label">{label}</span>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
        {value ?? "Not available"}
      </div>
      {help ? <p className="mt-1 ui-help">{help}</p> : null}
    </div>
  );
}

function SectionTile({ section, is_active, on_click }) {
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

        <div className="text-xs font-medium text-[var(--text-secondary)]">
          {section.meta}
        </div>

        <div className="text-xs text-[var(--text-secondary)]">
          {section.help}
        </div>
      </div>
    </button>
  );
}

function SectionGroup({
  title,
  description,
  sections,
  active_section,
  on_select,
}) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">{title}</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="ui-help">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {sections.map((section) => (
            <SectionTile
              key={section.key}
              section={section}
              is_active={active_section === section.key}
              on_click={() => on_select(section.key)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileSection({
  profile,
  set_field,
  save_profile,
  load_profile,
  delete_profile,
  new_profile,
}) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Allocation profile</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Save or select this delivery setup
          </h3>
          <p className="ui-help">
            This profile is the macro container for the working units you are
            testing. Start with one simple profile called Current setup.
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
  );
}

function ReadinessRail({
  outcome,
  delivery_summary,
  recovery_plan,
  evidence,
  groups,
  problems,
  on_select_section,
}) {
  const allocation_status = outcome?.allocation_status || outcome?.status;
  const allocation_dependency_type =
    outcome?.allocation_dependency_type || outcome?.dependency_type;

  const staff_coverage =
    delivery_summary?.staff_coverage_percent ??
    outcome?.staff_coverage_percent ??
    0;

  const asset_coverage =
    delivery_summary?.asset_coverage_percent ??
    outcome?.asset_coverage_percent ??
    0;

  const group_coverage =
    delivery_summary?.group_coverage_percent ??
    outcome?.group_coverage_percent ??
    0;

  const setup_warnings = Array.isArray(evidence?.setup_warnings)
    ? evidence.setup_warnings.length
    : Number(outcome?.setup_warnings_count || 0);

  const structural_warnings = Array.isArray(evidence?.structural_warnings)
    ? evidence.structural_warnings.length
    : Number(outcome?.structural_warnings_count || 0);

  const allocation_warnings = Number(outcome?.allocation_warnings_count || 0);

  const warning_count =
    setup_warnings + structural_warnings + allocation_warnings;

  const active_groups = groups?.rows?.length ?? 0;

  const ready_groups =
    delivery_summary?.ready_working_units_count ??
    delivery_summary?.valid_operational_groups ??
    groups?.ready_working_units_count ??
    groups?.valid_operational_groups ??
    0;

  const staff_in_working_units =
    delivery_summary?.staff_in_working_units_count ??
    delivery_summary?.linked_staff_count ??
    0;

  const assets_in_working_units =
    delivery_summary?.assets_in_working_units_count ??
    delivery_summary?.linked_asset_count ??
    0;

  const next_action =
    problems?.recommended_action ||
    problems?.next_action ||
    outcome?.recommended_check ||
    "Create working units, then review running cost, overhead burden, and minimum recoverable rate.";

  return (
    <aside className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Allocation readiness</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Current support check
          </h3>
          <p className="ui-help">
            This is a working-unit recovery check. Business Outcome owns the
            final decision.
          </p>
        </div>

        <MetricCard
          label="Allocation status"
          value={getStatusLabel(allocation_status, outcome?.status_label)}
          help={getStatusHelp(allocation_status)}
        />

        <MetricCard
          label="Dependency type"
          value={getDependencyLabel(allocation_dependency_type)}
          help="Shortfall is shown as dependency, not automatic failure."
        />

        <div className="grid grid-cols-1 gap-2">
          <MetricCard
            label="Staff coverage"
            value={formatPercent(staff_coverage)}
            help={`${formatCount(staff_in_working_units)} staff in working units`}
          />

          <MetricCard
            label="Asset coverage"
            value={formatPercent(asset_coverage)}
            help={`${formatCount(assets_in_working_units)} assets in working units`}
          />

          <MetricCard
            label="Working unit coverage"
            value={formatPercent(group_coverage)}
            help={`${formatCount(ready_groups)} of ${formatCount(
              active_groups
            )} working units ready`}
          />
        </div>

        <MetricCard
          label="Warnings"
          value={`${formatCount(warning_count)} warning${
            warning_count === 1 ? "" : "s"
          }`}
        />

        <MetricCard
          label="Recovery plan"
          value={
            recovery_plan?.active_recovery_model_label ||
            recovery_plan?.active_recovery_model ||
            "Not available"
          }
          help="Change recovery strategy in Recovery Summary, not here."
        />

        <div className="ui-readonly">
          <span className="ui-label">Next action</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {next_action}
          </p>
        </div>

        <div className="ui-stack-sm">
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => on_select_section("profile")}
          >
            Review profile
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => on_select_section("groups")}
          >
            Review working units
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => on_select_section("running_cost")}
          >
            Review running cost
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => on_select_section("overhead_burden")}
          >
            Review overhead burden
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => on_select_section("operational_recovery")}
          >
            Review minimum recoverable rate
          </button>
        </div>

        <p className="ui-help">
          Minimum recoverable rate is a recovery benchmark, not a sale price.
        </p>
      </div>
    </aside>
  );
}

function SelectedSection({
  active_section,
  profile,
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
  if (active_section === "profile") {
    return (
      <ProfileSection
        profile={profile}
        set_field={set_field}
        save_profile={save_profile}
        load_profile={load_profile}
        delete_profile={delete_profile}
        new_profile={new_profile}
      />
    );
  }

  return (
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
  const [active_section, set_active_section] = useState("recovery_plan");

  const allocation_status = outcome?.allocation_status || outcome?.status;
  const allocation_dependency_type =
    outcome?.allocation_dependency_type || outcome?.dependency_type;

  const setup_warnings = Array.isArray(evidence?.setup_warnings)
    ? evidence.setup_warnings.length
    : Number(outcome?.setup_warnings_count || 0);

  const groups_count = groups?.rows?.length ?? 0;

  const ready_groups =
    delivery_summary?.ready_working_units_count ??
    delivery_summary?.valid_operational_groups ??
    groups?.ready_working_units_count ??
    groups?.valid_operational_groups ??
    0;

  const operational_recovery_count = Array.isArray(
    recovery_plan?.operational_group_recovery_rows
  )
    ? recovery_plan.operational_group_recovery_rows.length
    : 0;

  const input_sections = useMemo(
    () => [
      {
        key: "recovery_plan",
        label: "Recovery plan",
        meta:
          recovery_plan?.active_recovery_model_label ||
          recovery_plan?.active_recovery_model ||
          "Read-only",
        help: "Confirm the plan being tested. Edit it in Recovery Summary.",
      },
      {
        key: "profile",
        label: "Allocation profile",
        meta: profile?.allocation_profile_name || "Current setup",
        help: "Name and save this delivery structure.",
      },
      {
        key: "groups",
        label: "Working units",
        meta: `${formatCount(groups_count)} active`,
        help: "Create the real crews or setups that produce revenue.",
      },
    ],
    [recovery_plan, profile, groups_count]
  );

  const review_sections = useMemo(
    () => [
      {
        key: "running_cost",
        label: "Running cost",
        meta: "Cost to run",
        help: "Direct productive labour and asset cost inside the unit.",
      },
      {
        key: "overhead_burden",
        label: "Overhead burden",
        meta: "Cost to carry",
        help: "Non-productive and general business costs the unit must recover.",
      },
      {
        key: "operational_recovery",
        label: "Minimum recoverable rate",
        meta: `${formatCount(operational_recovery_count)} unit${
          operational_recovery_count === 1 ? "" : "s"
        }`,
        help: "Running cost + overhead burden. Not a sale price.",
      },
      {
        key: "evidence",
        label: "What needs attention",
        meta: "Review",
        help: "Plain-English checks before moving to revenue.",
      },
      {
        key: "setup_checklist",
        label: "Setup checklist",
        meta: `${formatCount(setup_warnings)} item${
          setup_warnings === 1 ? "" : "s"
        }`,
        help: "Review missing setup items.",
      },
    ],
    [operational_recovery_count, setup_warnings]
  );

  const active_is_input = INPUT_SECTION_KEYS.includes(active_section);
  const active_is_review = REVIEW_SECTION_KEYS.includes(active_section);

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <section className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Cost allocation builder</p>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                Build working units and show what each one must recover
              </h2>
              <p className="ui-help">
                Cost Allocation takes the cost truth already built upstream and
                shows what each real working unit has to carry.
              </p>
              <p className="ui-help">
                Create the working unit first, then review running cost,
                overhead burden, and minimum recoverable rate before moving to
                revenue or pricing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <MetricCard
                label="Allocation status"
                value={getStatusLabel(allocation_status, outcome?.status_label)}
                help={getStatusHelp(allocation_status)}
              />

              <MetricCard
                label="Dependency type"
                value={getDependencyLabel(allocation_dependency_type)}
                help="Shortfall is shown as dependency, not automatic failure."
              />

              <MetricCard
                label="Working units"
                value={`${formatCount(ready_groups)} / ${formatCount(
                  groups_count
                )}`}
                help="Ready units compared with total units created."
              />
            </div>
          </div>
        </section>

        <div className="ui-split">
          <div className="ui-stack">
            <SectionGroup
              title="Inputs"
              description="Set up the delivery structure in this order: confirm the recovery plan, save the profile, then create working units."
              sections={input_sections}
              active_section={active_section}
              on_select={set_active_section}
            />

            {active_is_input ? (
              <SelectedSection
                active_section={active_section}
                profile={profile}
                recovery_plan={recovery_plan}
                allocation_tests={allocation_tests}
                delivery_summary={delivery_summary}
                evidence={evidence}
                links={links}
                groups={groups}
                problems={problems}
                set_field={set_field}
                add_asset_labour_link={add_asset_labour_link}
                remove_asset_labour_link={remove_asset_labour_link}
                add_operational_group={add_operational_group}
                update_operational_group={update_operational_group}
                remove_operational_group={remove_operational_group}
                save_profile={save_profile}
                load_profile={load_profile}
                delete_profile={delete_profile}
                new_profile={new_profile}
              />
            ) : null}

            <SectionGroup
              title="Review"
              description="Review what each working unit costs to run, what business burden it must carry, and the minimum recoverable rate before pricing."
              sections={review_sections}
              active_section={active_section}
              on_select={set_active_section}
            />

            {active_is_review ? (
              <SelectedSection
                active_section={active_section}
                profile={profile}
                recovery_plan={recovery_plan}
                allocation_tests={allocation_tests}
                delivery_summary={delivery_summary}
                evidence={evidence}
                links={links}
                groups={groups}
                problems={problems}
                set_field={set_field}
                add_asset_labour_link={add_asset_labour_link}
                remove_asset_labour_link={remove_asset_labour_link}
                add_operational_group={add_operational_group}
                update_operational_group={update_operational_group}
                remove_operational_group={remove_operational_group}
                save_profile={save_profile}
                load_profile={load_profile}
                delete_profile={delete_profile}
                new_profile={new_profile}
              />
            ) : null}
          </div>

          <ReadinessRail
            outcome={outcome}
            delivery_summary={delivery_summary}
            recovery_plan={recovery_plan}
            evidence={evidence}
            groups={groups}
            problems={problems}
            on_select_section={set_active_section}
          />
        </div>
      </div>
    </section>
  );
}