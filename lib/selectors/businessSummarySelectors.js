function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildBusinessSummaryStatus(calculations = {}) {
  const total_revenue = toNumber(calculations.total_revenue);
  const margin_pool = toNumber(calculations.margin_pool);
  const total_cost_burden = toNumber(calculations.total_cost_burden);
  const recovery_hours_used = toNumber(calculations.recovery_hours_used);
  const total_productive_output = toNumber(
    calculations.total_productive_output
  );
  const units_sold_annual = toNumber(calculations.units_sold_annual);
  const activity_driver_value = toNumber(calculations.activity_driver_value);
  const net_position = toNumber(calculations.net_position);
  const current_margin_per_hour = toNumber(
    calculations.current_margin_per_hour
  );
  const required_recovery_rate = toNumber(calculations.required_recovery_rate);
  const actual_recovery_rate = toNumber(calculations.actual_recovery_rate);
  const profit_or_deficit_per_recovery_hour = toNumber(
    calculations.profit_or_deficit_per_recovery_hour
  );
  const hourly_gap = toNumber(calculations.hourly_gap);
  const required_recovery_per_driver = toNumber(
    calculations.required_recovery_per_driver
  );
  const current_margin_per_driver = toNumber(
    calculations.current_margin_per_driver
  );
  const recovery_gap_per_driver = toNumber(
    calculations.recovery_gap_per_driver
  );

  const business_type = calculations.business_type || "labour_based";
  const activity_driver_type = calculations.activity_driver_type || "hours";

  const model_trust_state = calculations.model_trust_state || "blocked";
  const revenue_cogs_ready = calculations.revenue_cogs_ready === true;
  const cost_summary_ready = calculations.cost_summary_ready === true;
  const warnings = [];

  if (total_revenue === 0) {
    warnings.push({
      warning_id: "no_revenue_data",
      message: "No revenue data is flowing from Revenue / COGS.",
    });
  }

  if (margin_pool === 0) {
    warnings.push({
      warning_id: "no_margin_pool",
      message: "Margin Pool is zero in the Revenue / COGS output.",
    });
  }

  if (total_cost_burden === 0) {
    warnings.push({
      warning_id: "no_cost_summary_data",
      message: "Operating Costs are zero in the Cost Summary output.",
    });
  }

  if (activity_driver_type === "hours" && total_productive_output === 0) {
    warnings.push({
      warning_id: "no_productive_output",
      message:
        "No productive hours are available. Required recovery per hour cannot be calculated.",
    });
  }

  if (recovery_hours_used === 0) {
    warnings.push({
      warning_id: "no_recovery_hours",
      message:
        "Recovery hours are zero, so actual recovery per hour is held at 0.",
    });
  }

  if (activity_driver_type === "units" && units_sold_annual === 0) {
    warnings.push({
      warning_id: "no_units_sold",
      message:
        "Units sold are required to calculate required recovery per unit.",
    });
  }

  if (activity_driver_value === 0) {
    warnings.push({
      warning_id: "no_activity_driver",
      message:
        "The selected activity driver is zero, so recovery per output is held at 0.",
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

    business_type,
    activity_driver_type,
    activity_driver_label:
      calculations.activity_driver_label || "Productive hours",
    activity_driver_value,
    required_recovery_label:
      calculations.required_recovery_label || "Required recovery per hour",
    required_recovery_unit_label:
      calculations.required_recovery_unit_label || "$/hour",
    current_margin_label:
      calculations.current_margin_label || "Current margin per hour",
    recovery_gap_label: calculations.recovery_gap_label || "Hourly gap",

    net_position,
    current_margin_per_hour,
    required_recovery_rate,
    actual_recovery_rate,
    profit_or_deficit_per_recovery_hour,
    recovery_hours_used,
    hourly_gap,

    required_recovery_per_driver,
    current_margin_per_driver,
    recovery_gap_per_driver,

    warning_count: warnings.length,
    business_summary_warnings: warnings,
    model_trust_state,
    revenue_cogs_ready,
    cost_summary_ready,
  };
}

export function buildBusinessSummaryCard(calculations = {}) {
  const direct_cost_category_totals = Array.isArray(
    calculations.direct_cost_category_totals
  )
    ? calculations.direct_cost_category_totals.map((category, index) => ({
        category_id: category.category_id || `direct-cost-${index}`,
        label:
          category.category_name ||
          category.label ||
          "Direct cost category",
        amount: toNumber(category.total ?? category.amount),
      }))
    : [];

  return {
    total_revenue: toNumber(calculations.total_revenue),
    total_direct_costs: toNumber(calculations.total_direct_costs),
    direct_cost_category_totals,
    margin_pool: toNumber(calculations.margin_pool),
    gross_margin_percent: toNumber(calculations.gross_margin_percent),
    total_cost_burden: toNumber(calculations.total_cost_burden),
    total_people_cost_annual: toNumber(calculations.total_people_cost_annual),
    total_asset_cost_annual: toNumber(calculations.total_asset_cost_annual),
    total_business_overheads: toNumber(calculations.total_business_overheads),
    margin_after_labour: toNumber(calculations.margin_after_labour),
    non_people_cost_burden: toNumber(calculations.non_people_cost_burden),
    people_cost_per_recovery_hour: toNumber(
      calculations.people_cost_per_recovery_hour
    ),
    asset_cost_per_recovery_hour: toNumber(
      calculations.asset_cost_per_recovery_hour
    ),
    business_overheads_per_recovery_hour: toNumber(
      calculations.business_overheads_per_recovery_hour
    ),
    margin_after_labour_per_recovery_hour: toNumber(
      calculations.margin_after_labour_per_recovery_hour
    ),
    non_people_cost_burden_per_recovery_hour: toNumber(
      calculations.non_people_cost_burden_per_recovery_hour
    ),
    cost_burden_breakdown: calculations.cost_burden_breakdown ?? {
      people: {},
      assets: {},
      business_overheads: {},
    },
    total_recovery_hours: toNumber(calculations.total_recovery_hours),
    recovery_hours_used: toNumber(calculations.recovery_hours_used),
    total_productive_output: toNumber(calculations.total_productive_output),
    units_sold_annual: toNumber(calculations.units_sold_annual),

    business_type: calculations.business_type || "labour_based",
    activity_driver_type: calculations.activity_driver_type || "hours",
    activity_driver_label:
      calculations.activity_driver_label || "Productive hours",
    activity_driver_value: toNumber(calculations.activity_driver_value),
    activity_driver_display_label:
      calculations.activity_driver_display_label || "Productive hours",
    activity_driver_suffix: calculations.activity_driver_suffix || "hrs",

    required_recovery_per_driver: toNumber(
      calculations.required_recovery_per_driver
    ),
    required_recovery_label:
      calculations.required_recovery_label || "Required recovery per hour",
    required_recovery_unit_label:
      calculations.required_recovery_unit_label || "$/hour",

    current_margin_per_driver: toNumber(
      calculations.current_margin_per_driver
    ),
    current_margin_label:
      calculations.current_margin_label || "Current margin per hour",

    recovery_gap_per_driver: toNumber(calculations.recovery_gap_per_driver),
    recovery_gap_label: calculations.recovery_gap_label || "Hourly gap",

    required_recovery_rate: toNumber(calculations.required_recovery_rate),
    actual_recovery_rate: toNumber(calculations.actual_recovery_rate),
    profit_or_deficit_per_recovery_hour: toNumber(
      calculations.profit_or_deficit_per_recovery_hour
    ),
    net_position: toNumber(calculations.net_position),
    current_margin_per_hour: toNumber(calculations.current_margin_per_hour),
    hourly_gap: toNumber(calculations.hourly_gap),
  };
}
