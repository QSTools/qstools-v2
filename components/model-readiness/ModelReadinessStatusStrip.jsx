function formatCurrency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatFlag(value) {
  return value ? "Ready" : "Blocked";
}

function StatusMetric({ label, value }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{label}</div>
      <div className="ui-card-title-sm">{value}</div>
    </div>
  );
}

function CheckList({ title, checks = [], tone = "blocking" }) {
  if (!Array.isArray(checks) || checks.length === 0) return null;

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">{title}</div>

      <div className="ui-stack-sm">
        {checks.map((check, index) => (
          <div
            key={`${tone}-check-${check.id || index}`}
            className="border-b border-[var(--border-primary)] pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="ui-stack-xs">
                <strong>{check.label || check.module || "Readiness check"}</strong>
                <p className="ui-help">{check.message || String(check)}</p>
                {check.recommended_action ? (
                  <p className="ui-help">Next: {check.recommended_action}</p>
                ) : null}
              </div>

              <span className="ui-pill">
                {tone === "blocking" ? "Action required" : "Review"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ModelReadinessStatusStrip({ status = {} }) {
  const {
    overall_status,
    model_ready = false,
    model_readiness_status = "blocked",
    is_ready_for_modelling = false,
    is_ready_for_ai_export = false,
    is_ready_for_dashboard = false,
    blocking_modules = [],
    warning_modules = [],
    blocking_checks = [],
    warning_checks = [],
    blocking_items = [],
    warning_items = [],
    module_total_business_costs = 0,
    pnl_business_cost_variance_percent = 0,
  } = status;

  const resolved_status = overall_status || model_readiness_status;

  const resolved_blocking_items =
    blocking_items.length > 0
      ? blocking_items
      : blocking_checks.map((message, index) => ({
          id: `legacy-blocking-${index}`,
          message,
        }));

  const resolved_warning_items =
    warning_items.length > 0
      ? warning_items
      : warning_checks.map((message, index) => ({
          id: `legacy-warning-${index}`,
          message,
        }));

  const status_title = model_ready
    ? resolved_status === "warning"
      ? "Model usable with warnings"
      : "Model ready"
    : "Model blocked";

  const status_message = model_ready
    ? resolved_status === "warning"
      ? "The model can be used, but warning checks remain visible for review."
      : "The model has passed the current readiness checks."
    : "The model is not trusted yet. Resolve the blocking checks before relying on downstream outputs.";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Model Readiness</div>
          <div className="ui-display">{resolved_status}</div>
          <p className="ui-help">{status_message}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatusMetric label="Model status" value={status_title} />

          <StatusMetric
            label="Calculated business cost"
            value={formatCurrency(module_total_business_costs)}
          />

          <StatusMetric
            label="P&L variance"
            value={formatPercent(pnl_business_cost_variance_percent)}
          />

          <StatusMetric
            label="Blocking checks"
            value={resolved_blocking_items.length}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatusMetric
            label="Ready for modelling"
            value={formatFlag(is_ready_for_modelling)}
          />

          <StatusMetric
            label="Ready for AI export"
            value={formatFlag(is_ready_for_ai_export)}
          />

          <StatusMetric
            label="Ready for dashboard"
            value={formatFlag(is_ready_for_dashboard)}
          />
        </div>

        {blocking_modules.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Blocking modules</div>
            <p className="ui-help">{blocking_modules.join(", ")}</p>
          </div>
        ) : null}

        {warning_modules.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Warning modules</div>
            <p className="ui-help">{warning_modules.join(", ")}</p>
          </div>
        ) : null}

        <CheckList
          title="Blocking checks"
          checks={resolved_blocking_items}
          tone="blocking"
        />

        <CheckList
          title="Warnings"
          checks={resolved_warning_items}
          tone="warning"
        />
      </div>
    </section>
  );
}
