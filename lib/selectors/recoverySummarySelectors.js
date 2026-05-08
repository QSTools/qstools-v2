function get_warning_label(warning_key) {
  const warning_map = {
    business_summary_not_ready:
      "Business Summary is not ready, so Recovery Summary is preview only.",

    upstream_model_not_ready:
      "The upstream model is not trusted, so Recovery Summary is not final.",

    share_not_balanced:
      "Recovery shares must total 100% before this setup can be used.",

    no_activity_driver:
      "No activity driver is available, so recovery per output cannot be calculated.",

    no_productive_output:
      "No productive output is available. Labour recovery rate cannot be calculated.",

    no_units_sold:
      "Units sold are required to calculate product-based recovery pressure.",

    no_required_recovery_per_driver:
      "Required recovery per driver is not available from Business Summary.",

    negative_margin_pool:
      "Margin Pool is negative in the Business Summary output.",

    negative_net_position:
      "Net Position is negative in the Business Summary output.",

    recovery_gap_negative:
      "Current margin per driver is below required recovery per driver.",

    asset_share_without_asset_recovery_base:
      "Asset recovery is selected, but no asset recovery base is available.",

    labour_share_without_productive_output:
      "Labour recovery is selected, but no productive output is available.",
  };

  return warning_map[warning_key] || "Unknown recovery issue.";
}

function get_model_label(active_recovery_model) {
  const model_map = {
    labour_only: "Labour Only",
    asset_driven: "Asset Driven",
    hybrid: "Hybrid",
  };

  return model_map[active_recovery_model] || active_recovery_model || "Labour Only";
}

function get_insight(calculated = {}) {
  if (calculated.activity_driver_value <= 0) {
    return "Recovery cannot be translated into the selected activity driver until Business Summary has a valid driver value.";
  }

  if (calculated.active_recovery_model === "labour_only") {
    return "All business costs are currently being recovered through labour.";
  }

  if (
    (calculated.asset_share_percent ?? 0) > 0 &&
    (calculated.overhead_share_percent ?? 0) > 0
  ) {
    return "Recovery is distributed across labour, assets, and absorbed overhead.";
  }

  if ((calculated.asset_share_percent ?? 0) > 0) {
    return "Part of the cost burden is being recovered through assets.";
  }

  if ((calculated.overhead_share_percent ?? 0) > 0) {
    return "A portion of the cost burden is being absorbed outside direct recovery.";
  }

  return "Recovery structure is defined and ready for validation.";
}

export function buildRecoverySummaryStatus({ calculated = {} } = {}) {
  const warning_items = (calculated.warnings ?? []).map((warning_key) => ({
    warning_key,
    label: get_warning_label(warning_key),
  }));

  const has_blocking_driver =
    (calculated.warnings ?? []).includes("no_activity_driver") ||
    (calculated.warnings ?? []).includes("no_required_recovery_per_driver");

  const recovery_summary_status = has_blocking_driver
    ? "blocked"
    : calculated.model_trust_state !== "ready" &&
        calculated.model_trust_state !== "warning"
      ? "not_trusted"
      : warning_items.length === 0
        ? "ready"
        : "ready_with_warnings";

  const recovery_summary_ready = recovery_summary_status === "ready";

  return {
    recovery_summary_ready,
    recovery_summary_status,
    recovery_summary_warnings: warning_items,

    active_recovery_model: calculated.active_recovery_model ?? "labour_only",
    active_recovery_model_label: get_model_label(
      calculated.active_recovery_model ?? "labour_only"
    ),

    labour_share_percent: calculated.labour_share_percent ?? 100,
    asset_share_percent: calculated.asset_share_percent ?? 0,
    overhead_share_percent: calculated.overhead_share_percent ?? 0,

    recovery_ready: recovery_summary_ready,
    warning_count: warning_items.length,
    warning_items,
  };
}

export function buildRecoverySummaryCard({
  calculated = {},
  recovery_state = {},
  update_recovery_field = () => {},
  reset_recovery_state = () => {},
} = {}) {
  return {
    active_recovery_model: calculated.active_recovery_model ?? "labour_only",
    recovery_model: recovery_state.recovery_model ?? "labour_only",

    // current reality from Business Summary
    business_type: calculated.business_type ?? "labour_based",
    activity_driver_type: calculated.activity_driver_type ?? "hours",
    activity_driver_label: calculated.activity_driver_label ?? "Productive hours",
    activity_driver_value: calculated.activity_driver_value ?? 0,
    required_recovery_per_driver:
      calculated.required_recovery_per_driver ?? 0,
    current_margin_per_driver: calculated.current_margin_per_driver ?? 0,
    recovery_gap_per_driver: calculated.recovery_gap_per_driver ?? 0,
    recovery_plan_target_per_driver:
      calculated.recovery_plan_target_per_driver ?? 0,
    margin_pool: calculated.margin_pool ?? 0,
    total_cost_burden: calculated.total_cost_burden ?? 0,
    required_revenue: calculated.required_revenue ?? 0,
    required_recovery_rate:
      calculated.required_recovery_rate ??
      calculated.required_recovery_per_driver ??
      0,
    total_productive_output: calculated.total_productive_output ?? 0,
    units_sold_annual: calculated.units_sold_annual ?? 0,
    net_position: calculated.net_position ?? 0,

    // shares (inputs)
    labour_share_percent: recovery_state.labour_share_percent ?? 100,
    asset_share_percent: recovery_state.asset_share_percent ?? 0,
    overhead_share_percent: recovery_state.overhead_share_percent ?? 0,

    // outputs
    recovery_plan_split: calculated.recovery_plan_split,
    component_required_recovery: calculated.component_required_recovery,
    labour_recovery_cost: calculated.labour_recovery_cost ?? 0,
    asset_recovery_cost: calculated.asset_recovery_cost ?? 0,
    overhead_absorbed_cost: calculated.overhead_absorbed_cost ?? 0,
    required_labour_recovery_rate: calculated.required_labour_recovery_rate ?? 0,
    required_asset_recovery: calculated.required_asset_recovery ?? 0,
    share_total: calculated.share_total ?? 100,

    // flags
    share_not_balanced: Boolean(calculated.share_not_balanced),
    no_productive_output: Boolean(calculated.no_productive_output),
    asset_recovery_without_assets: Boolean(
      calculated.asset_share_without_asset_recovery_base
    ),
    labour_recovery_without_labour: Boolean(
      calculated.labour_share_without_productive_output
    ),

    // insight
    insight_text: get_insight(calculated),

    // handlers
    on_recovery_model_change: (value) => {
      if (value === "labour_only") {
        update_recovery_field("recovery_model", value);
        update_recovery_field("labour_share_percent", 100);
        update_recovery_field("asset_share_percent", 0);
        update_recovery_field("overhead_share_percent", 0);
        return;
      }

      update_recovery_field("recovery_model", value);
    },

    on_labour_share_change: (value) =>
      update_recovery_field("labour_share_percent", value),

    on_asset_share_change: (value) =>
      update_recovery_field("asset_share_percent", value),

    on_overhead_share_change: (value) =>
      update_recovery_field("overhead_share_percent", value),

    on_reset: reset_recovery_state,
  };
}
