const BALANCE_TOLERANCE = 0.0001;

function to_number(value) {
  const numeric_value = Number(value);
  return Number.isFinite(numeric_value) ? numeric_value : 0;
}

function is_numeric_input(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  return Number.isFinite(Number(value));
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function round_percent(value) {
  return Number(to_number(value).toFixed(2));
}

export function calculateRecoverySummary(input = {}) {
  const business_summary_ready = input.business_summary_ready === true;
  const business_type = input.business_type || "labour_based";
  const activity_driver_type = input.activity_driver_type || "hours";

  const activity_driver_label =
    input.activity_driver_label ||
    (activity_driver_type === "units" ? "Units sold" : "Productive hours");

  const activity_driver_value = to_number(input.activity_driver_value);

  const required_recovery_per_driver = to_number(
    input.required_recovery_per_driver
  );

  const current_margin_per_driver = to_number(input.current_margin_per_driver);
  const recovery_gap_per_driver = to_number(input.recovery_gap_per_driver);

  const total_revenue = to_number(input.total_revenue);
  const total_direct_costs = to_number(input.total_direct_costs);
  const gross_margin_percent = to_number(input.gross_margin_percent);
  const margin_pool = to_number(input.margin_pool);

  const total_people_cost_annual = to_number(input.total_people_cost_annual);
  const total_asset_cost_annual = to_number(input.total_asset_cost_annual);
  const total_business_overheads = to_number(input.total_business_overheads);
  const total_cost_burden = to_number(input.total_cost_burden);

  const cost_burden_breakdown = input.cost_burden_breakdown ?? {
    people: {},
    assets: {},
    business_overheads: {},
  };

  const required_recovery_rate = to_number(input.required_recovery_rate);
  const total_recovery_hours = to_number(input.total_recovery_hours);
  const total_productive_output = to_number(input.total_productive_output);

  const recovery_hours_used =
    total_recovery_hours > 0 ? total_recovery_hours : total_productive_output;

  const actual_recovery_rate = to_number(input.actual_recovery_rate);

  const profit_or_deficit_per_recovery_hour = to_number(
    input.profit_or_deficit_per_recovery_hour
  );

  const units_sold_annual = to_number(input.units_sold_annual);
  const net_position = to_number(input.net_position);
  const model_trust_state = input.model_trust_state || "blocked";

  const has_valid_recovery_hour_result =
    recovery_hours_used > 0 &&
    required_recovery_rate > 0 &&
    total_cost_burden > 0 &&
    is_numeric_input(input.actual_recovery_rate) &&
    is_numeric_input(input.profit_or_deficit_per_recovery_hour) &&
    is_numeric_input(input.margin_pool);

  const recovery_model = input.recovery_model || "labour_only";
  const active_recovery_model = recovery_model;

  const labour_share_percent = to_number(input.labour_share_percent);
  const asset_share_percent = to_number(input.asset_share_percent);
  const overhead_share_percent = to_number(input.overhead_share_percent);

  const share_total =
    labour_share_percent + asset_share_percent + overhead_share_percent;

  const share_not_balanced =
    Math.abs(share_total - 100) > BALANCE_TOLERANCE;

  const labour_recovery_cost = round_currency(
    total_cost_burden * (labour_share_percent / 100)
  );

  const asset_recovery_cost = round_currency(
    total_cost_burden * (asset_share_percent / 100)
  );

  const overhead_absorbed_cost = round_currency(
    total_cost_burden * (overhead_share_percent / 100)
  );

  const no_productive_output = total_productive_output <= 0;
  const no_recovery_hours = recovery_hours_used <= 0;

  const required_labour_recovery_rate = no_productive_output
    ? 0
    : round_currency(labour_recovery_cost / total_productive_output);

  const required_labour_recovery_rate_per_recovery_hour = no_recovery_hours
    ? 0
    : round_currency(labour_recovery_cost / recovery_hours_used);

  const required_asset_recovery_per_recovery_hour = no_recovery_hours
    ? 0
    : round_currency(asset_recovery_cost / recovery_hours_used);

  const overhead_absorbed_cost_per_recovery_hour = no_recovery_hours
    ? 0
    : round_currency(overhead_absorbed_cost / recovery_hours_used);

  const required_asset_recovery = round_currency(asset_recovery_cost);

  const asset_recovery_without_assets =
    asset_share_percent > 0 && total_cost_burden <= 0;

  const labour_recovery_without_labour =
    labour_share_percent > 0 && total_productive_output <= 0;

  const recovery_plan_target_per_driver = round_currency(
    required_recovery_per_driver
  );

  const recovery_plan_split = {
    labour_share_percent: round_percent(labour_share_percent),
    asset_share_percent: round_percent(asset_share_percent),
    overhead_share_percent: round_percent(overhead_share_percent),
  };

  const component_required_recovery = {
    labour: {
      share_percent: round_percent(labour_share_percent),
      recovery_cost: labour_recovery_cost,
      required_recovery_rate: required_labour_recovery_rate,
    },
    asset: {
      share_percent: round_percent(asset_share_percent),
      recovery_cost: asset_recovery_cost,
      required_recovery: required_asset_recovery,
    },
    overhead: {
      share_percent: round_percent(overhead_share_percent),
      recovery_cost: overhead_absorbed_cost,
    },
  };

  const warnings = [];

  if (!business_summary_ready && !has_valid_recovery_hour_result) {
    warnings.push("business_summary_not_ready");
  }

  if (model_trust_state !== "ready" && model_trust_state !== "warning") {
    warnings.push("upstream_model_not_ready");
  }

  if (share_not_balanced) {
    warnings.push("share_not_balanced");
  }

  if (activity_driver_value <= 0) {
    warnings.push("no_activity_driver");
  }

  if (business_type === "labour_based" && total_productive_output <= 0) {
    warnings.push("no_productive_output");
  }

  if (business_type === "product_based" && units_sold_annual <= 0) {
    warnings.push("no_units_sold");
  }

  if (required_recovery_per_driver <= 0) {
    warnings.push("no_required_recovery_per_driver");
  }

  if (margin_pool < 0) {
    warnings.push("negative_margin_pool");
  }

  if (net_position < 0) {
    warnings.push("negative_net_position");
  }

  if (recovery_gap_per_driver < 0) {
    warnings.push("recovery_gap_negative");
  }

  if (asset_recovery_without_assets) {
    warnings.push("asset_share_without_asset_recovery_base");
  }

  if (labour_recovery_without_labour) {
    warnings.push("labour_share_without_productive_output");
  }

  return {
    business_summary_ready,
    business_type,
    activity_driver_type,
    activity_driver_label,
    activity_driver_value: round_currency(activity_driver_value),

    required_recovery_per_driver: round_currency(
      required_recovery_per_driver
    ),
    current_margin_per_driver: round_currency(current_margin_per_driver),
    recovery_gap_per_driver: round_currency(recovery_gap_per_driver),

    recovery_plan_target_per_driver,
    recovery_plan_split,
    component_required_recovery,

    recovery_model,
    active_recovery_model,

    total_revenue: round_currency(total_revenue),
    total_direct_costs: round_currency(total_direct_costs),
    gross_margin_percent: round_percent(gross_margin_percent),
    margin_pool: round_currency(margin_pool),

    total_people_cost_annual: round_currency(total_people_cost_annual),
    total_asset_cost_annual: round_currency(total_asset_cost_annual),
    total_business_overheads: round_currency(total_business_overheads),
    total_cost_burden: round_currency(total_cost_burden),
    cost_burden_breakdown,

    required_revenue: round_currency(total_cost_burden),
    required_recovery_rate: round_currency(required_recovery_rate),

    total_recovery_hours: round_currency(total_recovery_hours),
    recovery_hours_used: round_currency(recovery_hours_used),
    total_productive_output: round_currency(total_productive_output),

    actual_recovery_rate: round_currency(actual_recovery_rate),
    profit_or_deficit_per_recovery_hour: round_currency(
      profit_or_deficit_per_recovery_hour
    ),

    units_sold_annual: round_currency(units_sold_annual),
    net_position: round_currency(net_position),
    model_trust_state,

    labour_share_percent: round_percent(labour_share_percent),
    asset_share_percent: round_percent(asset_share_percent),
    overhead_share_percent: round_percent(overhead_share_percent),
    share_total: round_percent(share_total),

    labour_recovery_cost,
    asset_recovery_cost,
    overhead_absorbed_cost,

    required_labour_recovery_rate,
    required_labour_recovery_rate_per_recovery_hour,
    required_asset_recovery_per_recovery_hour,
    overhead_absorbed_cost_per_recovery_hour,
    required_asset_recovery,

    share_not_balanced,
    no_productive_output,
    no_recovery_hours,
    asset_recovery_without_assets,
    labour_recovery_without_labour,
    labour_share_without_productive_output: labour_recovery_without_labour,
    asset_share_without_asset_recovery_base: asset_recovery_without_assets,

    warnings,
  };
}