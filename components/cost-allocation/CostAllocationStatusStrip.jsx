"use client";

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-NZ");
}

function getStatusLabel(value) {
  const label_map = {
    ready: "Supported internally",
    ready_with_dependency: "Supported with dependency",
    strained: "Structurally strained",
    not_supported: "Not currently supported",
    incomplete: "Incomplete",
    review: "Review required",
  };

  return label_map[value] || value || "Review required";
}

function getDependencyLabel(value) {
  const label_map = {
    none: "No major dependency",
    internal_capacity: "Internal capacity",
    external_delivery: "External delivery",
    asset_structure: "Asset structure",
    operational_groups: "Working units",
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
  status,
  outcome,
  delivery_summary,
  groups,
  recovery_plan,
}) {
  const allocation_status =
    status?.allocation_status ||
    outcome?.allocation_status ||
    delivery_summary?.allocation_status ||
    "review";

  const allocation_dependency_type =
    status?.allocation_dependency_type ||
    outcome?.allocation_dependency_type ||
    delivery_summary?.allocation_dependency_type ||
    "unknown";

  const working_units_count =
    status?.working_units_count ||
    delivery_summary?.working_units_count ||
    groups?.working_units_count ||
    groups?.total_operational_groups ||
    groups?.rows?.length ||
    0;

  const ready_working_units_count =
    delivery_summary?.ready_working_units_count ||
    groups?.ready_working_units_count ||
    groups?.valid_operational_groups ||
    0;

  const staff_in_working_units_count =
    status?.staff_in_working_units_count ||
    delivery_summary?.staff_in_working_units_count ||
    delivery_summary?.linked_staff_count ||
    0;

  const assets_in_working_units_count =
    status?.assets_in_working_units_count ||
    delivery_summary?.assets_in_working_units_count ||
    delivery_summary?.linked_asset_count ||
    0;

  const warning_count =
    status?.warnings_count ||
    outcome?.warning_count ||
    outcome?.warnings_count ||
    0;

  const recovery_plan_label =
    status?.active_recovery_model_label ||
    recovery_plan?.active_recovery_model_label ||
    recovery_plan?.active_recovery_model ||
    "Recovery plan";

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Cost allocation status</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Working-unit recovery check
          </h2>
          <p className="ui-help">
            This page does not set prices. It shows what each working unit must
            recover before pricing decisions are made.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatusMetric
            label="Allocation status"
            value={getStatusLabel(allocation_status)}
            help="Whether the current working units support the recovery plan."
          />

          <StatusMetric
            label="Dependency type"
            value={getDependencyLabel(allocation_dependency_type)}
            help="Shortfall is shown as dependency, not automatic failure."
          />

          <StatusMetric
            label="Working units"
            value={`${formatCount(ready_working_units_count)} / ${formatCount(
              working_units_count
            )}`}
            help="Ready units compared with total units."
          />

          <StatusMetric
            label="Staff in units"
            value={formatCount(staff_in_working_units_count)}
            help="Productive staff assigned to working units."
          />

          <StatusMetric
            label="Assets in units"
            value={formatCount(assets_in_working_units_count)}
            help="Productive assets assigned to working units."
          />

          <StatusMetric
            label="Warnings"
            value={formatCount(warning_count)}
            help="Items to review before relying on this setup."
          />
        </div>

        <div className="ui-readonly">
          <span className="ui-label">Recovery plan being tested</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {recovery_plan_label}
          </p>
          <p className="mt-1 ui-help">
            Recovery Summary chooses the plan. Cost Allocation shows what the
            working units must carry.
          </p>
        </div>
      </div>
    </section>
  );
}