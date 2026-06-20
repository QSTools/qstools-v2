export function buildLabourDrivers({
  state = {},
  outputs = {},
  has_profile = false,
}) {
  function format_metric_currency(value) {
    return `$${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function format_metric_percent(value) {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  function format_metric_number(value) {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  if (!has_profile) {
    return {
      driver_key: "no_profile",
      driver_title: "No live driver yet",
      driver_body:
        "Create or load a labour profile to see what is driving your live labour cost.",
      driver_insight: "",
      tone: "neutral",
      metric_label: "Status",
      metric_value: "Waiting for profile",
    };
  }

  const productivity = Number(state.productivity_percent ?? 0);
  const paid_hours = Number(outputs.paid_hours_per_year ?? 0);
  const productive_hours = Number(outputs.productive_hours ?? 0);
  const non_productive = Number(outputs.non_productive_paid_hours ?? 0);
  const employer_cost = Number(outputs.total_employer_contribution_cost ?? 0);
  const total_labour_cost = Number(outputs.total_labour_cost_annual ?? 0);
  const loaded_labour_cost_rate = Number(outputs.loaded_labour_cost_rate ?? 0);
  const productive_labour_cost_rate = Number(
    outputs.productive_labour_cost_rate ?? 0
  );

  const entitlement_ratio = paid_hours > 0 ? non_productive / paid_hours : 0;
  const employer_cost_ratio =
    total_labour_cost > 0 ? employer_cost / total_labour_cost : 0;

  if (productivity > 0 && productivity < 80) {
    return {
      driver_key: "low_productivity",
      driver_title: "Productivity is driving cost",
      driver_body:
        "Productive hours are being compressed, which pushes up the true cost of every productive hour.",
      driver_insight:
        "Small productivity improvements can reduce the productive labour cost rate without changing wages.",
      tone: "bad",
      metric_label: "Productivity",
      metric_value: format_metric_percent(productivity),
    };
  }

  if (entitlement_ratio >= 0.18) {
    return {
      driver_key: "entitlement_pressure",
      driver_title: "Entitlements are adding pressure",
      driver_body:
        "A larger share of paid hours is being lost to leave and non-productive paid time.",
      driver_insight:
        "This does not mean entitlements are wrong, but it does mean each productive hour carries more cost.",
      tone: "warn",
      metric_label: "Non-productive hours",
      metric_value: format_metric_percent(entitlement_ratio * 100),
    };
  }

  if (
    productive_labour_cost_rate > 0 &&
    loaded_labour_cost_rate > 0 &&
    productive_labour_cost_rate > loaded_labour_cost_rate * 1.25
  ) {
    return {
      driver_key: "productive_rate_uplift",
      driver_title: "Productive-hour cost is lifting",
      driver_body:
        "The productive labour cost rate is materially higher than the paid-hour cost rate.",
      driver_insight:
        "This usually means paid time is being reduced by entitlements, productivity loss, or both.",
      tone: "warn",
      metric_label: "Productive cost rate",
      metric_value: format_metric_currency(productive_labour_cost_rate),
    };
  }

  if (employer_cost_ratio >= 0.05) {
    return {
      driver_key: "employer_cost_share",
      driver_title: "Employer costs are lifting labour cost",
      driver_body:
        "KiwiSaver, ESCT and ACC are a meaningful part of true labour cost.",
      driver_insight:
        "These are real employer costs and should remain visible before Rate Builder applies customer pricing.",
      tone: "warn",
      metric_label: "Employer cost share",
      metric_value: format_metric_percent(employer_cost_ratio * 100),
    };
  }

  return {
    driver_key: "cost_ready",
    driver_title: "Labour cost position is ready",
    driver_body:
      "The labour profile has paid hours, productive hours, and annual cost available for downstream use.",
    driver_insight:
      "Use Rate Builder to turn this cost truth into customer charge-out rates.",
    tone: "good",
    metric_label: "Productive hours",
    metric_value: format_metric_number(productive_hours),
  };
}