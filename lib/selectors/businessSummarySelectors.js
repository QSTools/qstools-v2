function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildBusinessSummaryStatus(calculations = {}) {
  const total_revenue = toNumber(calculations.total_revenue);
  const margin_pool = toNumber(calculations.margin_pool);
  const total_cost_burden = toNumber(calculations.total_cost_burden);
  const total_productive_output = toNumber(
    calculations.total_productive_output
  );
  const net_position = toNumber(calculations.net_position);
  const current_margin_per_hour = toNumber(
    calculations.current_margin_per_hour
  );
  const required_recovery_rate = toNumber(
    calculations.required_recovery_rate
  );
  const hourly_gap = toNumber(calculations.hourly_gap);
  const model_trust_state = calculations.model_trust_state || "blocked";
  const revenue_cogs_ready = calculations.revenue_cogs_ready === true;
  const cost_summary_ready = calculations.cost_summary_ready === true;
  const warnings = [];

  if (total_revenue === 0) {
    warnings.push({
      warning_id: "no_revenue_data",
      message:
        "No revenue data is flowing from Revenue / COGS.",
    });
  }

  if (margin_pool === 0) {
    warnings.push({
      warning_id: "no_margin_pool",
      message:
        "Margin Pool is zero in the Revenue / COGS output.",
    });
  }

  if (total_cost_burden === 0) {
    warnings.push({
      warning_id: "no_cost_summary_data",
      message:
        "Operating Costs are zero in the Cost Summary output.",
    });
  }

  if (total_productive_output === 0) {
    warnings.push({
      warning_id: "no_productive_output",
      message:
        "Productive output is zero, so per-hour Business Summary values are held at 0.",
    });
  }

  if (net_position < 0) {
    warnings.push({
      warning_id: "negative_net_position",
      message:
        "Net Position is negative because Margin Pool is below Operating Costs.",
    });
  }

  if (!revenue_cogs_ready) {
    warnings.push({
      warning_id: "revenue_cogs_not_ready",
      message:
        "Revenue / COGS is not ready, so Business Summary is not trusted as a final baseline.",
    });
  }

  if (!cost_summary_ready) {
    warnings.push({
      warning_id: "cost_summary_not_ready",
      message:
        "Cost Summary is not trusted, so Business Summary is preview only.",
    });
  }

  return {
    business_summary_ready:
      warnings.length === 0 && model_trust_state === "ready",
    business_summary_status:
      model_trust_state === "blocked"
        ? "blocked"
        : warnings.length === 0
          ? "ready"
          : "ready_with_warnings",
    net_position,
    current_margin_per_hour,
    required_recovery_rate,
    hourly_gap,
    warning_count: warnings.length,
    business_summary_warnings: warnings,
    model_trust_state,
    revenue_cogs_ready,
    cost_summary_ready,
  };
}

export function buildBusinessSummaryCard(calculations = {}) {
  return {
    total_revenue: toNumber(calculations.total_revenue),
    total_direct_costs: toNumber(calculations.total_direct_costs),
    margin_pool: toNumber(calculations.margin_pool),
    gross_margin_percent: toNumber(calculations.gross_margin_percent),
    total_cost_burden: toNumber(calculations.total_cost_burden),
    total_productive_output: toNumber(calculations.total_productive_output),
    required_recovery_rate: toNumber(calculations.required_recovery_rate),
    net_position: toNumber(calculations.net_position),
    current_margin_per_hour: toNumber(
      calculations.current_margin_per_hour
    ),
    hourly_gap: toNumber(calculations.hourly_gap),
  };
}
