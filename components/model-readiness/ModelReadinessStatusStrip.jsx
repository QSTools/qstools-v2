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
            key={`${tone}-check-${index}`}
            className="border-b border-[var(--border-primary)] pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <p className="ui-help">{check}</p>

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
    model_ready = false,
    model_readiness_status = "blocked",
    blocking_modules = [],
    warning_modules = [],
    blocking_checks = [],
    warning_checks = [],
    module_total_business_costs = 0,
    pnl_business_cost_variance_percent = 0,
  } = status;

  const status_title = model_ready
    ? model_readiness_status === "warning"
      ? "Model usable with warnings"
      : "Model ready"
    : "Model blocked";

  const status_message = model_ready
    ? model_readiness_status === "warning"
      ? "The model can be used, but warning checks remain visible for review."
      : "The model has passed the current readiness checks."
    : "The model is not trusted yet. Resolve the blocking checks before relying on downstream outputs.";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Model Readiness</div>
          <div className="ui-display">{model_readiness_status}</div>
          <p className="ui-help">{status_message}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatusMetric
            label="Model status"
            value={status_title}
          />

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
            value={blocking_checks.length}
          />
        </div>

        {blocking_modules.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Blocking modules</div>
            <p className="ui-help">
              {blocking_modules.join(", ")}
            </p>
          </div>
        ) : null}

        {warning_modules.length > 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Warning modules</div>
            <p className="ui-help">
              {warning_modules.join(", ")}
            </p>
          </div>
        ) : null}

        <CheckList
          title="Blocking checks"
          checks={blocking_checks}
          tone="blocking"
        />

        <CheckList
          title="Warnings"
          checks={warning_checks}
          tone="warning"
        />
      </div>
    </section>
  );
}