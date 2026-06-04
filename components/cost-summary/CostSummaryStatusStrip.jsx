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
  macro_required_operating_hour_rate = 0,
  net_annual_business_open_hours = 0,
  total_cost_burden = 0,
  total_people_cost_annual = 0,
  total_asset_cost_annual = 0,
  total_business_overheads = 0,
}) {
  const macro_pressure_value = formatCurrency(
    macro_required_operating_hour_rate
  );
  const macro_hours_value = Number(net_annual_business_open_hours || 0)
    .toFixed(1)
    .toString();
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
    ? "Model Readiness is blocked. Fix the listed setup modules before treating Cost Summary as a trusted downstream baseline."
    : normalized_status === "warning"
      ? "The model is usable, but warning checks remain visible for review before downstream decisions."
      : "The upstream cost setup is ready and this baseline can be used as the internal operating cost burden.";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Model Readiness</div>

        <div className="ui-card-title-sm">{status_title}</div>

        <p className="ui-help">{status_message}</p>

        {!model_ready && blocking_modules.length > 0 ? (
          <p className="ui-help">
            What is blocked: {blocking_modules.join(", ")}.
          </p>
        ) : null}

        {!model_ready && blocking_checks.length > 0 ? (
          <p className="ui-help">
            Where to fix it: return to the blocked setup modules and clear the
            Model Readiness checks.
          </p>
        ) : null}

        {!model_ready ? (
          <p className="ui-help">
            If ignored: this rate remains a preview only and should not be used
            for downstream decisions.
          </p>
        ) : null}

        {warning_modules.length > 0 ? (
          <p className="ui-help">
            Warning modules: {warning_modules.join(", ")}.
          </p>
        ) : null}

        {warning_checks.length > 0 ? (
          <p className="ui-help">
            Warning checks: {warning_checks.length}. Review before relying on
            downstream decisions.
          </p>
        ) : null}

        <div className="ui-kicker">Operating Cost Baseline</div>

        <div className="ui-card-title-sm">
          {macro_pressure_value} / open hr
        </div>

        <p className="ui-help">
          Total business cost burden divided by net annual business open hours.
        </p>

        <p className="ui-help">Based on {macro_hours_value} net annual business open hours.</p>

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
