"use client";

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatHours(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 0,
  }).format(number);
}

function getLargestCostDriver({
  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
}) {
  const values = [
    { label: "Labour", value: Number(total_people_cost_annual) || 0 },
    { label: "Assets", value: Number(total_asset_cost_annual) || 0 },
    { label: "General Overheads", value: Number(total_business_overheads) || 0 },
  ];

  values.sort((a, b) => b.value - a.value);

  if ((values[0]?.value ?? 0) <= 0) {
    return "";
  }

  return `Largest cost driver: ${values[0].label}.`;
}

export default function CostSummaryStatusStrip({
  model_ready = false,
  model_readiness_status = "blocked",
  blocking_modules = [],
  warning_modules = [],
  blocking_checks = [],
  warning_checks = [],
  required_recovery_rate = 0,
  total_productive_output = 0,
  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
}) {
  const pressure_value = formatCurrency(required_recovery_rate);
  const output_value = formatHours(total_productive_output);
  const insight = getLargestCostDriver({
    total_people_cost_annual,
    total_asset_cost_annual,
    total_business_overheads,
  });
  const normalized_status = String(model_readiness_status || "").toLowerCase();
  const status_title = !model_ready
    ? "Cost Summary Not Trusted"
    : normalized_status === "warning"
      ? "Cost Summary Ready With Warnings"
      : "Cost Summary Trusted";
  const status_message = !model_ready
    ? "Model Readiness is blocked. Totals can be viewed, but downstream decisions should not rely on them yet."
    : normalized_status === "warning"
      ? "The model is ready, but warnings remain visible for review before relying on downstream decisions."
      : "The upstream cost setup is ready and this baseline can be used as the internal operating cost burden.";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Model Readiness</div>

        <div className="ui-card-title-sm">{status_title}</div>

        <p className="ui-help">{status_message}</p>

        {blocking_modules.length > 0 ? (
          <p className="ui-help">
            Blocking modules: {blocking_modules.join(", ")}
          </p>
        ) : null}

        {warning_modules.length > 0 ? (
          <p className="ui-help">
            Warning modules: {warning_modules.join(", ")}
          </p>
        ) : null}

        {blocking_checks.length > 0 ? (
          <p className="ui-help">
            Blocking checks: {blocking_checks.length}
          </p>
        ) : null}

        {warning_checks.length > 0 ? (
          <p className="ui-help">Warnings: {warning_checks.length}</p>
        ) : null}

        <div className="ui-kicker">Recovery Pressure</div>

        <div className="ui-card-title-sm">
          {pressure_value} / hr
        </div>

        <p className="ui-help">
          Based on {output_value} productive hours.
        </p>

        {!model_ready ? (
          <p className="ui-help">
            This rate is not trusted until Model Readiness passes.
          </p>
        ) : null}

        {insight ? <p className="ui-help">{insight}</p> : null}
      </div>
    </section>
  );
}
