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

function getStatusTone(value) {
  if (value === "ready" || value === "ready_with_dependency") {
    return "Ready for review";
  }

  if (value === "blocked" || value === "leak_detected") {
    return "Blocked";
  }

  if (value === "not_supported") {
    return "Not supported";
  }

  if (value === "strained") {
    return "Structure strained";
  }

  return "Needs review";
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

  const setup_warning_count = Array.isArray(outcome?.setup_warnings)
    ? outcome.setup_warnings.length
    : Array.isArray(status?.setup_warnings)
      ? status.setup_warnings.length
      : 0;

  const structural_warning_count = Array.isArray(outcome?.structural_warnings)
    ? outcome.structural_warnings.length
    : Array.isArray(status?.structural_warnings)
      ? status.structural_warnings.length
      : 0;

  const warning_count =
    flat_warnings_count ||
    status?.warnings_count ||
    outcome?.warning_count ||
    outcome?.warnings_count ||
    setup_warning_count + structural_warning_count ||
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

  const has_remaining_source_pool = Number(remaining_source_pool || 0) > 1;
  const has_warnings = Number(warning_count || 0) > 0;

  const dependency_note =
    allocation_dependency_type === "none"
      ? "No major dependency"
      : allocation_dependency_type || "Dependency not classified";

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div className="ui-actions">
          <div>
            <p className="ui-kicker">Cost allocation status</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Operating structure and source-pool check
            </h2>
            <p className="ui-help">
              Assign productive labour, productive assets, and automatically
              distributed overhead into operating groups.
            </p>
          </div>

          <div className="ui-readonly min-w-[180px]">
            <span className="ui-label">Current result</span>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {getStatusTone(allocation_status)}
            </p>
            <p className="mt-1 ui-help">{dependency_note}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <StatusMetric
            label="Status"
            value={getStatusLabel(allocation_status)}
            help="Ready for downstream use?"
          />

          <StatusMetric
            label="Groups"
            value={`${formatCount(ready_operating_groups_count)} / ${formatCount(
              operating_groups_count
            )}`}
            help="Ready / created."
          />

          <StatusMetric
            label="Assigned"
            value={formatMoney(assigned_source_pool)}
            help="Cost inside groups."
          />

          <StatusMetric
            label="Remaining"
            value={formatMoney(remaining_source_pool)}
            help={
              has_remaining_source_pool
                ? "Still outside groups."
                : "No source-pool leakage."
            }
          />

          <StatusMetric
            label="Warnings"
            value={formatCount(warning_count)}
            help={has_warnings ? "Review before relying." : "No active warnings."}
          />
        </div>

        <div className="ui-readonly">
          <div className="ui-actions">
            <div>
              <span className="ui-label">Recovery context</span>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {recovery_context_label}
              </p>
            </div>

            <p className="ui-help max-w-xl">
              Recovery Summary owns the recovery model. Cost Allocation only
              builds the operating structure and source-pool distribution.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}