"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function StatusRow({ label, value }) {
  return (
    <div className="labour-summary-row">
      <span className="labour-summary-label">{label}</span>
      <span className="labour-summary-value">{value}</span>
    </div>
  );
}

export default function ModelReadinessStatusStrip({ status = {} }) {
  const {
    model_ready,
    model_readiness_status,
    blocking_modules = [],
    warning_modules = [],
    blocking_checks = [],
    warning_checks = [],
    module_total_business_costs = 0,
    pnl_business_cost_variance_percent = 0,
  } = status;

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Model Readiness</div>
        <div className="ui-display">{model_readiness_status}</div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <StatusRow
              label="Model Ready"
              value={model_ready ? "Yes" : "No"}
            />
            <StatusRow
              label="Module Total Business Costs"
              value={formatCurrency(module_total_business_costs)}
            />
            <StatusRow
              label="P&L Variance"
              value={`${pnl_business_cost_variance_percent.toFixed(1)}%`}
            />
          </div>
        </div>

        {blocking_modules.length > 0 && (
          <div className="ui-panel">
            <div className="ui-kicker">Blocking Modules</div>
            <p className="ui-help">{blocking_modules.join(", ")}</p>
          </div>
        )}

        {warning_modules.length > 0 && (
          <div className="ui-panel">
            <div className="ui-kicker">Warning Modules</div>
            <p className="ui-help">{warning_modules.join(", ")}</p>
          </div>
        )}

        {blocking_checks.length > 0 && (
          <div className="ui-panel">
            <div className="ui-kicker">Blocking checks</div>
            <div className="labour-summary-table">
              {blocking_checks.map((check, index) => (
                <StatusRow
                  key={`blocking-${index}`}
                  label={`Check ${index + 1}`}
                  value={check}
                />
              ))}
            </div>
          </div>
        )}

        {warning_checks.length > 0 && (
          <div className="ui-panel">
            <div className="ui-kicker">Warnings</div>
            <div className="labour-summary-table">
              {warning_checks.map((check, index) => (
                <StatusRow
                  key={`warning-${index}`}
                  label={`Warning ${index + 1}`}
                  value={check}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
