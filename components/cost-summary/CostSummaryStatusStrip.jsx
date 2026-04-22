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
  is_ready = false,
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

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Recovery Pressure</div>

        <div className="ui-card-title-sm">
          {pressure_value} / hr
        </div>

        <p className="ui-help">
          Based on {output_value} productive hours.
        </p>

        {!is_ready ? (
          <p className="ui-help">
            Check upstream inputs if this number does not look right.
          </p>
        ) : null}

        {insight ? <p className="ui-help">{insight}</p> : null}
      </div>
    </section>
  );
}