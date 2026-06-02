"use client";

import { useMemo, useState } from "react";

import CostAllocationEvidenceBreakdown from "@/components/cost-allocation/CostAllocationEvidenceBreakdown";

const STATUS_LABELS = {
  ready: "Supported internally",
  ready_with_dependency: "Supported with dependency",
  strained: "Structurally strained",
  not_supported: "Not currently supported",
  blocked: "Blocked",
  incomplete: "Incomplete",
  review: "Review required",
};

const STATUS_HELP = {
  ready: "The current operating structure appears ready for downstream recovery testing.",
  ready_with_dependency:
    "The structure may work, but it depends on external or scalable delivery capacity.",
  strained:
    "The structure may be possible, but current operating groups are under pressure.",
  not_supported:
    "The current operating groups do not yet support the selected structure.",
  blocked:
    "One or more source pools is over-allocated or structurally invalid.",
  incomplete:
    "More setup is required before this structure can be relied on downstream.",
  review: "Review the operating groups, assignments, and reconciliation checks.",
};

const DEPENDENCY_LABELS = {
  none: "No major dependency",
  internal_capacity: "Internal capacity",
  external_delivery: "External delivery",
  asset_structure: "Asset structure",
  operational_groups: "Operating groups",
  mixed: "Mixed dependency",
  unknown: "Unknown dependency",
};

const BUILD_SECTION_KEYS = ["groups", "links"];

const CHECK_SECTION_KEYS = [
  "group_cost_stacks",
  "pool_reconciliation",
  "structural_warnings",
  "setup_checklist",
];

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getStatusLabel(value, fallback) {
  return STATUS_LABELS[value] || fallback || value || "Review required";
}

function getStatusHelp(value) {
  return (
    STATUS_HELP[value] || "Review the operating groups and supporting structure."
  );
}

function getDependencyLabel(value) {
  return DEPENDENCY_LABELS[value] || value || "Not classified";
}

function getBusinessModeLabel(value) {
  return value === "product_based"
    ? "Product / unit-based"
    : "Hours-based";
}

function getBusinessModeHelp(value) {
  if (value === "product_based") {
    return "Cost Allocation builds the operating structure. Recovery Summary tests whether unit margin can carry this structure.";
  }

  return "Cost Allocation builds labour, asset, and overhead operating groups. Recovery testing happens downstream.";
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

        <div className="grid grid-cols-1 gap-2">
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

  const staff_in_operating_groups =
    delivery_summary?.staff_in_working_units_count ??
    delivery_summary?.linked_staff_count ??
    0;

  const assets_in_operating_groups =
    delivery_summary?.assets_in_working_units_count ??
    delivery_summary?.linked_asset_count ??
    0;

  const next_action =
    problems?.recommended_action ||
    problems?.next_action ||
    outcome?.recommended_check ||
    "Create operating groups, assign source pools, then review reconciliation.";

  return (
    <aside className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Allocation readiness</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Current structure check
          </h3>
          <p className="ui-help">
            This is an operating-structure check. Recovery Summary tests
            recovery, and Business Outcome owns the final decision.
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
            help={`${formatCount(
              staff_in_operating_groups
            )} staff assigned to operating groups`}
          />

          <MetricCard
            label="Asset coverage"
            value={formatPercent(asset_coverage)}
            help={`${formatCount(
              assets_in_operating_groups
            )} assets assigned to operating groups`}
          />

          <MetricCard
            label="Operating group coverage"
            value={formatPercent(group_coverage)}
            help={`${formatCount(ready_groups)} of ${formatCount(
              active_groups
            )} operating groups ready`}
          />
        </div>

        <MetricCard
          label="Warnings"
          value={`${formatCount(warning_count)} warning${
            warning_count === 1 ? "" : "s"
          }`}
        />

        <MetricCard
          label="Recovery context"
          value={
            recovery_plan?.active_recovery_model_label ||
            recovery_plan?.active_recovery_model ||
            "Not available"
          }
          help="Recovery Summary owns the recovery model. Cost Allocation consumes it as read-only context."
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
            onClick={() => on_select_section("groups")}
          >
            Build operating groups
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => on_select_section("pool_reconciliation")}
          >
            Review reconciliation
          </button>

          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => on_select_section("structural_warnings")}
          >
            Review warnings
          </button>
        </div>

        <p className="ui-help">
          Cost Allocation does not set prices or produce sell rates.
        </p>
      </div>
    </aside>
  );
}

function SelectedSection({
  active_section,
  recovery_plan,
  allocation_tests,
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
      labour_assignment={labour_assignment}
      asset_assignment={asset_assignment}
      overhead_assignment={overhead_assignment}
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
  );
}

export default function CostAllocationMainCard({
  outcome,
  recovery_plan,
  allocation_tests,
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
  const [active_section, set_active_section] = useState("groups");

  const allocation_status = outcome?.allocation_status || outcome?.status;
  const allocation_dependency_type =
    outcome?.allocation_dependency_type || outcome?.dependency_type;

  const setup_warnings = Array.isArray(evidence?.setup_warnings)
    ? evidence.setup_warnings.length
    : Number(outcome?.setup_warnings_count || 0);

  const structural_warnings = Array.isArray(evidence?.structural_warnings)
    ? evidence.structural_warnings.length
    : Number(outcome?.structural_warnings_count || 0);

  const groups_count = groups?.rows?.length ?? 0;
  const links_count = links?.rows?.filter((row) => row?.is_active)?.length ?? 0;
  const business_type = recovery_plan?.business_type || "labour_based";

  const ready_groups =
    delivery_summary?.ready_working_units_count ??
    delivery_summary?.valid_operational_groups ??
    groups?.ready_working_units_count ??
    groups?.valid_operational_groups ??
    0;

  const build_sections = useMemo(
    () => [
      {
        key: "groups",
        label: "Operating groups",
        meta: `${formatCount(groups_count)} active`,
        help: "Create each crew, team, or working unit, then add labour, assets, and overhead inside it.",
      },
      {
        key: "links",
        label: "Capability links",
        meta: `${formatCount(links_count)} active`,
        help: "Optional: link assets to staff where capability matters.",
      },
    ],
    [groups_count, links_count]
  );

  const check_sections = useMemo(
    () => [
      {
        key: "group_cost_stacks",
        label: "Group cost stacks",
        meta: "Assigned cost stacks",
        help: "Review assigned labour, asset, and overhead cost by operating group.",
      },
      {
        key: "pool_reconciliation",
        label: "Pool reconciliation",
        meta: "No-leak checks",
        help: "Check assigned, remaining, and over-assigned source pools.",
      },
      {
        key: "structural_warnings",
        label: "Structural warnings",
        meta: `${formatCount(structural_warnings)} item${
          structural_warnings === 1 ? "" : "s"
        }`,
        help: "Review structure, capacity, or dependency warnings.",
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
    [setup_warnings, structural_warnings]
  );

  const active_is_build = BUILD_SECTION_KEYS.includes(active_section);
  const active_is_check = CHECK_SECTION_KEYS.includes(active_section);

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <section className="ui-panel">
          <div className="ui-stack">
            <div>
              <p className="ui-kicker">Cost allocation builder</p>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                Build each operating group in one place
              </h2>
              <p className="ui-help">
                Create a working unit, then assign its labour, productive
                assets, and overhead inside the same group card.
              </p>
              <p className="ui-help">
                Recovery testing, rate building, pricing, and business outcome
                decisions happen downstream.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <MetricCard
                label="Business mode"
                value={getBusinessModeLabel(business_type)}
                help={getBusinessModeHelp(business_type)}
              />

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
            </div>

            <div className="grid grid-cols-1 gap-3">
              <MetricCard
                label="Operating groups"
                value={`${formatCount(ready_groups)} / ${formatCount(
                  groups_count
                )}`}
                help="Ready groups compared with total groups created."
              />

              <MetricCard
                label="Assigned source pools"
                value={formatMoney(recovery_plan?.total_grouped_operating_cost)}
                help="Current assigned labour, productive asset, and overhead cost."
              />

              <MetricCard
                label="Remaining source pools"
                value={formatMoney(recovery_plan?.total_unassigned_cost)}
                help="Cost still outside operating groups."
              />
            </div>
          </div>
        </section>

        <div className="ui-split">
          <div className="ui-stack">
            <SectionGroup
              title="Build"
              description="Create each operating group, then build that group in one place."
              sections={build_sections}
              active_section={active_section}
              on_select={set_active_section}
            />

            {active_is_build ? (
              <SelectedSection
                active_section={active_section}
                recovery_plan={recovery_plan}
                allocation_tests={allocation_tests}
                delivery_summary={delivery_summary}
                evidence={evidence}
                links={links}
                groups={groups}
                problems={problems}
                labour_assignment={labour_assignment}
                asset_assignment={asset_assignment}
                overhead_assignment={overhead_assignment}
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
            ) : null}

            <SectionGroup
              title="Checks"
              description="Review reconciliation and warnings after building the groups."
              sections={check_sections}
              active_section={active_section}
              on_select={set_active_section}
            />

            {active_is_check ? (
              <SelectedSection
                active_section={active_section}
                recovery_plan={recovery_plan}
                allocation_tests={allocation_tests}
                delivery_summary={delivery_summary}
                evidence={evidence}
                links={links}
                groups={groups}
                problems={problems}
                labour_assignment={labour_assignment}
                asset_assignment={asset_assignment}
                overhead_assignment={overhead_assignment}
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