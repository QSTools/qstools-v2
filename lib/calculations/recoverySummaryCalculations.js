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

function normalise_recovery_model(value) {
  if (value === "labour_only") return "labour_led";
  if (value === "asset_driven") return "asset_led";

  if (
    value === "labour_led" ||
    value === "asset_led" ||
    value === "material_led" ||
    value === "hybrid"
  ) {
    return value;
  }

  return "labour_led";
}

function normalise_split_to_100({
  labour_basis,
  asset_basis,
  material_basis,
}) {
  const total_basis =
    to_number(labour_basis) + to_number(asset_basis) + to_number(material_basis);

  if (total_basis <= 0) {
    return {
      labour_share_percent: 100,
      asset_share_percent: 0,
      material_share_percent: 0,
    };
  }

  const raw_labour_share = (to_number(labour_basis) / total_basis) * 100;
  const raw_asset_share = (to_number(asset_basis) / total_basis) * 100;
  const raw_material_share = (to_number(material_basis) / total_basis) * 100;

  const labour_share_percent = round_percent(raw_labour_share);
  const asset_share_percent = round_percent(raw_asset_share);

  const material_share_percent = round_percent(
    100 - labour_share_percent - asset_share_percent
  );

  return {
    labour_share_percent,
    asset_share_percent,
    material_share_percent,
  };
}

function build_suggested_starting_split({
  total_people_cost_annual,
  productive_asset_cost,
  has_productive_asset_recovery_base,
  total_direct_costs,
  recovery_hours_used,
  total_productive_output,
}) {
  const has_labour_recovery_base =
    to_number(recovery_hours_used) > 0 ||
    to_number(total_productive_output) > 0 ||
    to_number(total_people_cost_annual) > 0;

  const has_asset_recovery_base =
    has_productive_asset_recovery_base === true &&
    to_number(productive_asset_cost) > 0;

  const has_material_recovery_base = to_number(total_direct_costs) > 0;

  const labour_basis = has_labour_recovery_base
    ? to_number(total_people_cost_annual)
    : 0;

  const asset_basis = has_asset_recovery_base ? to_number(productive_asset_cost) : 0;

  const material_basis = has_material_recovery_base
    ? to_number(total_direct_costs)
    : 0;

  const split = normalise_split_to_100({
    labour_basis,
    asset_basis,
    material_basis,
  });

  if (
    has_labour_recovery_base &&
    has_asset_recovery_base &&
    has_material_recovery_base
  ) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: split.labour_share_percent,
      suggested_asset_share_percent: split.asset_share_percent,
      suggested_material_share_percent: split.material_share_percent,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_labour_recovery_base && has_material_recovery_base) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: split.labour_share_percent,
      suggested_asset_share_percent: 0,
      suggested_material_share_percent: split.material_share_percent,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_labour_recovery_base && has_asset_recovery_base) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: split.labour_share_percent,
      suggested_asset_share_percent: split.asset_share_percent,
      suggested_material_share_percent: 0,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_asset_recovery_base && has_material_recovery_base) {
    return {
      suggested_recovery_model: "hybrid",
      suggested_labour_share_percent: 0,
      suggested_asset_share_percent: split.asset_share_percent,
      suggested_material_share_percent: split.material_share_percent,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_material_recovery_base) {
    return {
      suggested_recovery_model: "material_led",
      suggested_labour_share_percent: 0,
      suggested_asset_share_percent: 0,
      suggested_material_share_percent: 100,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  if (has_asset_recovery_base) {
    return {
      suggested_recovery_model: "asset_led",
      suggested_labour_share_percent: 0,
      suggested_asset_share_percent: 100,
      suggested_material_share_percent: 0,
      suggested_overhead_absorbed_percent: 0,
      split_source: "system_suggested",
    };
  }

  return {
    suggested_recovery_model: "labour_led",
    suggested_labour_share_percent: 100,
    suggested_asset_share_percent: 0,
    suggested_material_share_percent: 0,
    suggested_overhead_absorbed_percent: 0,
    split_source: "system_suggested",
  };
}

function build_overhead_absorption_diagnostics({
  overhead_absorbed_percent,
  labour_share_percent,
  asset_share_percent,
  material_share_percent,
  total_people_cost_annual,
  total_asset_cost_annual,
  total_business_overheads,
  total_direct_costs,
  recovery_hours_used,
}) {
  const diagnostics = [];
  const overhead_percent = to_number(overhead_absorbed_percent);

  let absorption_level = "low";

  if (overhead_percent >= 25) {
    absorption_level = "high";
  } else if (overhead_percent >= 10) {
    absorption_level = "medium";
  }

  if (overhead_percent <= 0) {
    return {
      overhead_absorption_level: "none",
      overhead_absorption_title: "Recovery model is fully assigned",
      overhead_absorption_message:
        "The recovery model is fully assigned to labour, assets, and materials / products.",
      overhead_absorption_diagnostics: [],
    };
  }

  if (total_people_cost_annual > 0 && labour_share_percent <= 0) {
    diagnostics.push({
      diagnostic_key: "labour_cost_not_assigned",
      title: "Labour cost exists but labour recovery is not selected",
      message:
        "People cost exists in the business, but none of the recovery burden is currently assigned to labour.",
      check_area: "Review labour recovery share and recovery hours.",
    });
  }

  if (labour_share_percent > 0 && recovery_hours_used <= 0) {
    diagnostics.push({
      diagnostic_key: "labour_recovery_base_missing",
      title: "Labour recovery is selected but recovery hours are missing",
      message:
        "Labour is expected to carry recovery, but there are no selected recovery hours available.",
      check_area: "Review Labour and Business Summary recovery hours.",
    });
  }

  if (total_asset_cost_annual > 0 && asset_share_percent <= 0) {
    diagnostics.push({
      diagnostic_key: "asset_cost_not_assigned",
      title: "Asset cost exists but asset recovery is not selected",
      message:
        "Asset costs exist in the business, but none of the recovery burden is currently assigned to assets.",
      check_area:
        "Review whether productive assets should carry recovery, or whether these are support assets only.",
    });
  }

  if (total_direct_costs > 0 && material_share_percent <= 0) {
    diagnostics.push({
      diagnostic_key: "material_contribution_not_assigned",
      title: "Materials / products contribution is not selected",
      message:
        "Direct costs exist, but no recovery contribution is currently assigned to materials / products.",
      check_area:
        "Review whether material margin, product margin, resale margin, or material/product contribution should carry part of recovery.",
    });
  }

  if (total_business_overheads > 0) {
    diagnostics.push({
      diagnostic_key: "unexplained_recovery_allowance",
      title: "Recovery allowance is not yet assigned to a driver",
      message:
        "Some recovery is being held outside labour, assets, and materials / products. This does not mean the cost is missing; it means the recovery method has not been clearly assigned yet.",
      check_area:
        "Review General Overheads, support labour, asset usage, and materials / products margin to decide whether this allowance should be assigned to a direct driver.",
    });
  }

  return {
    overhead_absorption_level: absorption_level,
    overhead_absorption_title:
      absorption_level === "high"
        ? "Significant unexplained recovery allowance"
        : absorption_level === "medium"
          ? "Some recovery is not yet assigned to a driver"
          : "Low unexplained recovery allowance",
    overhead_absorption_message:
      absorption_level === "high"
        ? "A large portion of the recovery model is not yet assigned to labour, assets, or materials / products. Review the recovery strategy before relying on this model."
        : absorption_level === "medium"
          ? "A meaningful portion of the recovery model is not yet assigned to a clear driver. This may be normal, but should be reviewed."
          : "A small portion of the recovery model is being held as unexplained recovery allowance. This is normally acceptable.",
    overhead_absorption_diagnostics: diagnostics,
  };
}

export function calculateRecoverySummary(input = {}) {
  const business_summary_ready = input.business_summary_ready === true;
  const business_type = input.business_type || "labour_based";
  const activity_driver_type = input.activity_driver_type || "hours";

  const activity_driver_label =
    input.activity_driver_label ||
    (activity_driver_type === "units"
      ? "Units sold"
      : "Selected recovery hours");

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

  const has_productive_asset_recovery_base =
    input.has_productive_asset_recovery_base === true;

  const productive_asset_count = to_number(input.productive_asset_count);
  const support_asset_count = to_number(input.support_asset_count);
  const productive_asset_cost = to_number(input.productive_asset_cost);
  const support_asset_cost = to_number(input.support_asset_cost);

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

  const suggested_starting_split = build_suggested_starting_split({
    total_people_cost_annual,
    productive_asset_cost,
    has_productive_asset_recovery_base,
    total_direct_costs,
    recovery_hours_used,
    total_productive_output,
  });

  const has_valid_recovery_hour_result =
    recovery_hours_used > 0 &&
    required_recovery_rate > 0 &&
    total_cost_burden > 0 &&
    is_numeric_input(input.actual_recovery_rate) &&
    is_numeric_input(input.profit_or_deficit_per_recovery_hour) &&
    is_numeric_input(input.margin_pool);

  const recovery_model = normalise_recovery_model(
    input.recovery_model ?? suggested_starting_split.suggested_recovery_model
  );

  const active_recovery_model = recovery_model;

  const labour_share_percent = to_number(
    input.labour_share_percent ??
      suggested_starting_split.suggested_labour_share_percent
  );

  const asset_share_percent = to_number(
    input.asset_share_percent ??
      suggested_starting_split.suggested_asset_share_percent
  );

  const material_share_percent = to_number(
    input.material_share_percent ??
      suggested_starting_split.suggested_material_share_percent
  );

  const explained_recovery_total =
    labour_share_percent + asset_share_percent + material_share_percent;

  const explained_recovery_exceeds_100 =
    explained_recovery_total > 100 + BALANCE_TOLERANCE;

  const overhead_absorbed_percent = explained_recovery_exceeds_100
    ? 0
    : Math.max(0, 100 - explained_recovery_total);

  const share_total = explained_recovery_total + overhead_absorbed_percent;
  const share_not_balanced = explained_recovery_exceeds_100;

  const labour_recovery_cost = round_currency(
    total_cost_burden * (labour_share_percent / 100)
  );

  const asset_recovery_cost = round_currency(
    total_cost_burden * (asset_share_percent / 100)
  );

  const material_recovery_cost = round_currency(
    total_cost_burden * (material_share_percent / 100)
  );

  const overhead_absorbed_cost = round_currency(
    total_cost_burden * (overhead_absorbed_percent / 100)
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

  const required_material_recovery_per_recovery_hour = no_recovery_hours
    ? 0
    : round_currency(material_recovery_cost / recovery_hours_used);

  const overhead_absorbed_cost_per_recovery_hour = no_recovery_hours
    ? 0
    : round_currency(overhead_absorbed_cost / recovery_hours_used);

  const required_asset_recovery = round_currency(asset_recovery_cost);
  const required_material_recovery = round_currency(material_recovery_cost);

  const material_recovery_included = material_share_percent > 0;
  const asset_recovery_included = asset_share_percent > 0;

  const gross_profit_source_status = "pending_live_feedback";
  const material_margin_status = material_recovery_included
    ? "estimated"
    : "not_selected";
  const asset_utilisation_status = asset_recovery_included
    ? "estimated"
    : "not_selected";

  const asset_recovery_without_assets =
    asset_share_percent > 0 && !has_productive_asset_recovery_base;

  const labour_recovery_without_labour =
    labour_share_percent > 0 && total_productive_output <= 0;

  const overhead_absorption_review = build_overhead_absorption_diagnostics({
    overhead_absorbed_percent,
    labour_share_percent,
    asset_share_percent,
    material_share_percent,
    total_people_cost_annual,
    total_asset_cost_annual,
    total_business_overheads,
    total_direct_costs,
    recovery_hours_used,
  });

  const recovery_plan_target_per_driver = round_currency(
    required_recovery_per_driver
  );

  const recovery_plan_split = {
    labour_share_percent: round_percent(labour_share_percent),
    asset_share_percent: round_percent(asset_share_percent),
    material_share_percent: round_percent(material_share_percent),
    overhead_absorbed_percent: round_percent(overhead_absorbed_percent),

    // Backwards-compatible output for older consumers.
    overhead_share_percent: round_percent(overhead_absorbed_percent),
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
    material: {
      share_percent: round_percent(material_share_percent),
      recovery_cost: material_recovery_cost,
      required_recovery: required_material_recovery,
    },
    overhead: {
      share_percent: round_percent(overhead_absorbed_percent),
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

  if (overhead_absorption_review.overhead_absorption_level === "medium") {
    warnings.push("overhead_absorption_review");
  }

  if (overhead_absorption_review.overhead_absorption_level === "high") {
    warnings.push("overhead_absorption_high");
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

  if (material_recovery_included) {
    warnings.push("material_margin_unverified");
  }

  if (asset_recovery_included) {
    warnings.push("asset_utilisation_unverified");
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

    required_recovery_per_driver: round_currency(required_recovery_per_driver),
    current_margin_per_driver: round_currency(current_margin_per_driver),
    recovery_gap_per_driver: round_currency(recovery_gap_per_driver),

    recovery_plan_target_per_driver,
    recovery_plan_split,
    component_required_recovery,

    recovery_model,
    active_recovery_model,

    suggested_recovery_model:
      suggested_starting_split.suggested_recovery_model,
    suggested_labour_share_percent:
      suggested_starting_split.suggested_labour_share_percent,
    suggested_asset_share_percent:
      suggested_starting_split.suggested_asset_share_percent,
    suggested_material_share_percent:
      suggested_starting_split.suggested_material_share_percent,
    suggested_overhead_absorbed_percent:
      suggested_starting_split.suggested_overhead_absorbed_percent,
    split_source: suggested_starting_split.split_source,

    total_revenue: round_currency(total_revenue),
    total_direct_costs: round_currency(total_direct_costs),
    gross_margin_percent: round_percent(gross_margin_percent),
    margin_pool: round_currency(margin_pool),
    gross_profit: round_currency(margin_pool),

    total_people_cost_annual: round_currency(total_people_cost_annual),
    total_asset_cost_annual: round_currency(total_asset_cost_annual),
    total_business_overheads: round_currency(total_business_overheads),
    total_cost_burden: round_currency(total_cost_burden),
    cost_burden_breakdown,

    has_productive_asset_recovery_base,
    productive_asset_count,
    support_asset_count,
    productive_asset_cost: round_currency(productive_asset_cost),
    support_asset_cost: round_currency(support_asset_cost),

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
    material_share_percent: round_percent(material_share_percent),
    overhead_absorbed_percent: round_percent(overhead_absorbed_percent),

    // Backwards-compatible output for older components/selectors.
    overhead_share_percent: round_percent(overhead_absorbed_percent),

    explained_recovery_total: round_percent(explained_recovery_total),
    share_total: round_percent(share_total),

    labour_recovery_cost,
    asset_recovery_cost,
    material_recovery_cost,
    overhead_absorbed_cost,

    required_labour_recovery_rate,
    required_labour_recovery_rate_per_recovery_hour,
    required_asset_recovery_per_recovery_hour,
    required_material_recovery_per_recovery_hour,
    overhead_absorbed_cost_per_recovery_hour,
    required_asset_recovery,
    required_material_recovery,

    gross_profit_source_status,
    material_margin_status,
    asset_utilisation_status,
    material_recovery_included,
    asset_recovery_included,

    overhead_absorption_level:
      overhead_absorption_review.overhead_absorption_level,
    overhead_absorption_title:
      overhead_absorption_review.overhead_absorption_title,
    overhead_absorption_message:
      overhead_absorption_review.overhead_absorption_message,
    overhead_absorption_diagnostics:
      overhead_absorption_review.overhead_absorption_diagnostics,

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