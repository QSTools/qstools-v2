"use client";

function getStatusLabel(value) {
  const label_map = {
    ready: "supported internally",
    ready_with_dependency: "supported with dependency",
    strained: "structurally strained",
    not_supported: "not currently supported",
    incomplete: "incomplete",
    review: "needs review",
  };

  return label_map[value] || "needs review";
}

function getDependencyLabel(value) {
  const label_map = {
    none: "no major dependency",
    internal_capacity: "internal capacity",
    external_delivery: "external delivery",
    asset_structure: "asset structure",
    operational_groups: "working units",
    mixed: "mixed dependency",
    unknown: "unknown dependency",
  };

  return label_map[value] || "unknown dependency";
}

export default function CostAllocationNoticeBanner({
  outcome,
  status,
  delivery_summary,
  recovery_plan,
}) {
  const allocation_status =
    outcome?.allocation_status ||
    status?.allocation_status ||
    delivery_summary?.allocation_status ||
    "review";

  const dependency_type =
    outcome?.allocation_dependency_type ||
    status?.allocation_dependency_type ||
    delivery_summary?.allocation_dependency_type ||
    "unknown";

  const recovery_plan_label =
    recovery_plan?.active_recovery_model_label ||
    status?.active_recovery_model_label ||
    recovery_plan?.active_recovery_model ||
    "the selected recovery plan";

  const next_action =
    outcome?.recommended_check ||
    "Create working units, then review running cost, overhead burden, and minimum recoverable rate.";

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Cost allocation guidance</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Build working units before pricing
          </h3>
          <p className="ui-help">
            Cost Allocation does not set prices. It shows what each working unit
            must recover before pricing decisions are made.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="ui-readonly">
            <span className="ui-label">Recovery plan</span>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {recovery_plan_label}
            </p>
            <p className="mt-1 ui-help">
              Recovery Summary chooses the plan. This page tests what the
              working units must carry.
            </p>
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Current status</span>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {getStatusLabel(allocation_status)}
            </p>
            <p className="mt-1 ui-help">
              Status is based on the working-unit setup and recovery context.
            </p>
          </div>

          <div className="ui-readonly">
            <span className="ui-label">Dependency</span>
            <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
              {getDependencyLabel(dependency_type)}
            </p>
            <p className="mt-1 ui-help">
              A dependency is a warning signal, not an automatic failure.
            </p>
          </div>
        </div>

        <div className="ui-readonly">
          <span className="ui-label">Next action</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {next_action}
          </p>
          <p className="mt-1 ui-help">
            The target flow is: create working units, review running cost, review
            overhead burden, then use the minimum recoverable rate in the
            revenue/pricing layer.
          </p>
        </div>
      </div>
    </section>
  );
}