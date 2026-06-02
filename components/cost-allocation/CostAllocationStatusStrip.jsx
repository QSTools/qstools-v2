"use client";

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  })}`;
}

function getStatusLabel(value) {
  const label_map = {
    ready: "Ready",
    ready_with_dependency: "Ready with dependency",
    strained: "Structure strained",
    not_supported: "Not supported",
    incomplete: "Incomplete",
    review: "Review required",
    blocked: "Blocked",
    leak_detected: "Leak detected",
  };

  return label_map[value] || value || "Review required";
}

function getDependencyLabel(value) {
  const label_map = {
    none: "No major dependency",
    internal_capacity: "Internal capacity",
    external_delivery: "External delivery",
    asset_structure: "Asset structure",
    operational_groups: "Operating groups",
    mixed: "Mixed dependency",
    unknown: "Unknown dependency",
  };

  return label_map[value] || value || "Not classified";
}

function StatusMetric({ label, value, help }) {
  return (
    <div className="ui-readonly">
      <span className="ui-label">{label}</span>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
        {value}
      </div>
      {help ? <p className="mt-1 ui-help">{help}</p> : null}
    </div>
  );
}

export default function CostAllocationStatusStrip({
  allocation_status: flat_allocation_status,
  allocation_dependency_type: flat_allocation_dependency_type,
  operating_groups_count: flat_operating_groups_count,
  working_units_count: flat_working_units_count,
  warnings_count: flat_warnings_count,
  total_grouped_operating_cost = 0,
  total_unassigned_cost = 0,
  total_assigned_source_pool = 0,
  total_remaining_source_pool = 0,
  status,
  outcome,
  delivery_summary,
  groups,
  recovery_plan,
}) {
  const allocation_status =
    flat_allocation_status ||
    status?.allocation_status ||
    outcome?.allocation_status ||
    delivery_summary?.allocation_status ||
    "review";

  const allocation_dependency_type =
    flat_allocation_dependency_type ||
    status?.allocation_dependency_type ||
    outcome?.allocation_dependency_type ||
    delivery_summary?.allocation_dependency_type ||
    "unknown";

  const operating_groups_count =
    flat_operating_groups_count ||
    flat_working_units_count ||
    status?.operating_groups_count ||
    status?.working_units_count ||
    delivery_summary?.operating_groups_count ||
    delivery_summary?.working_units_count ||
    groups?.operating_groups_count ||
    groups?.working_units_count ||
    groups?.total_operational_groups ||
    groups?.rows?.length ||
    0;

  const ready_operating_groups_count =
    delivery_summary?.ready_operating_groups_count ||
    delivery_summary?.ready_working_units_count ||
    groups?.ready_operating_groups_count ||
    groups?.ready_working_units_count ||
    groups?.valid_operational_groups ||
    0;

  const staff_in_operating_groups_count =
    status?.staff_in_operating_groups_count ||
    status?.staff_in_working_units_count ||
    delivery_summary?.staff_in_operating_groups_count ||
    delivery_summary?.staff_in_working_units_count ||
    delivery_summary?.linked_staff_count ||
    0;

  const assets_in_operating_groups_count =
    status?.assets_in_operating_groups_count ||
    status?.assets_in_working_units_count ||
    delivery_summary?.assets_in_operating_groups_count ||
    delivery_summary?.assets_in_working_units_count ||
    delivery_summary?.linked_asset_count ||
    0;

  const warning_count =
    flat_warnings_count ||
    status?.warnings_count ||
    outcome?.warning_count ||
    outcome?.warnings_count ||
    0;

  const assigned_source_pool =
    total_assigned_source_pool ||
    status?.total_assigned_source_pool ||
    recovery_plan?.total_assigned_source_pool ||
    recovery_plan?.total_grouped_operating_cost ||
    total_grouped_operating_cost ||
    0;

  const remaining_source_pool =
    total_remaining_source_pool ||
    status?.total_remaining_source_pool ||
    recovery_plan?.total_remaining_source_pool ||
    recovery_plan?.total_unassigned_cost ||
    total_unassigned_cost ||
    0;

  const recovery_context_label =
    status?.active_recovery_model_label ||
    recovery_plan?.active_recovery_model_label ||
    recovery_plan?.active_recovery_model ||
    "Recovery context not available";

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Cost allocation status</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Operating structure and source-pool check
          </h2>
          <p className="ui-help">
            This page assigns productive labour, productive assets, and remaining
            overheads into operating groups. It does not test recovery, build
            rates, or set prices.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <StatusMetric
            label="Allocation status"
            value={getStatusLabel(allocation_status)}
            help="Whether the current operating structure is ready for downstream use."
          />

          <StatusMetric
            label="Dependency type"
            value={getDependencyLabel(allocation_dependency_type)}
            help="Dependency is a review signal, not an automatic failure."
          />

          <StatusMetric
            label="Operating groups"
            value={`${formatCount(ready_operating_groups_count)} / ${formatCount(
              operating_groups_count
            )}`}
            help="Ready groups compared with total groups created."
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <StatusMetric
            label="Staff assigned"
            value={formatCount(staff_in_operating_groups_count)}
            help="Productive staff assigned to operating groups."
          />

          <StatusMetric
            label="Assets assigned"
            value={formatCount(assets_in_operating_groups_count)}
            help="Productive assets assigned to operating groups."
          />

          <StatusMetric
            label="Warnings"
            value={formatCount(warning_count)}
            help="Items to review before relying on this structure."
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <StatusMetric
            label="Assigned source pools"
            value={formatMoney(assigned_source_pool)}
            help="Labour, productive asset, and overhead source values currently assigned."
          />

          <StatusMetric
            label="Remaining source pools"
            value={formatMoney(remaining_source_pool)}
            help="Source values still outside operating groups."
          />
        </div>

        <div className="ui-readonly">
          <span className="ui-label">Recovery context</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {recovery_context_label}
          </p>
          <p className="mt-1 ui-help">
            Recovery Summary owns the recovery model. Cost Allocation consumes
            it as read-only context only.
          </p>
        </div>
      </div>
    </section>
  );
}