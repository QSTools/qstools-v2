function get_warning_label(warning_key) {
  const warning_map = {
    share_not_balanced:
      "Recovery shares must total 100% before this setup can be used.",

    no_productive_output:
      "No productive output is available. Labour recovery rate cannot be calculated.",

    asset_recovery_without_assets:
      "Asset recovery is active, but no asset cost exists in the business.",

    labour_recovery_without_labour:
      "Labour recovery is active, but no labour base or productive output exists.",
  };

  return warning_map[warning_key] || "Unknown recovery issue.";
}

function get_model_label(active_recovery_model) {
  const model_map = {
    labour_only: "Labour Only",
    asset_driven: "Asset Driven",
    hybrid: "Hybrid",
  };

  return model_map[active_recovery_model] || active_recovery_model;
}

function get_insight(calculated) {
  if (calculated.no_productive_output) {
    return "Recovery cannot be translated into charge-out rates until productive output is defined.";
  }

  if (calculated.active_recovery_model === "labour_only") {
    return "All business costs are currently being recovered through labour.";
  }

  if (
    calculated.asset_share_percent > 0 &&
    calculated.overhead_share_percent > 0
  ) {
    return "Recovery is distributed across labour, assets, and absorbed overhead.";
  }

  if (calculated.asset_share_percent > 0) {
    return "Part of the cost burden is being recovered through assets.";
  }

  if (calculated.overhead_share_percent > 0) {
    return "A portion of the cost burden is being absorbed outside direct recovery.";
  }

  return "Recovery structure is defined and ready for validation.";
}

export function buildRecoverySummaryStatus({ calculated }) {
  const warning_items = (calculated.warnings ?? []).map((warning_key) => ({
    warning_key,
    label: get_warning_label(warning_key),
  }));

  const recovery_ready = warning_items.length === 0;

  return {
    active_recovery_model: calculated.active_recovery_model,
    active_recovery_model_label: get_model_label(
      calculated.active_recovery_model
    ),

    labour_share_percent: calculated.labour_share_percent,
    asset_share_percent: calculated.asset_share_percent,
    overhead_share_percent: calculated.overhead_share_percent,

    recovery_ready,
    warning_count: warning_items.length,
    warning_items,
  };
}

export function buildRecoverySummaryCard({
  calculated,
  recovery_state,
  update_recovery_field,
  reset_recovery_state,
}) {
  return {
    active_recovery_model: calculated.active_recovery_model,

    // baseline
    total_cost_burden: calculated.total_cost_burden,
    required_revenue: calculated.required_revenue,
    required_recovery_rate: calculated.required_recovery_rate,
    total_productive_output: calculated.total_productive_output,

    // shares (inputs)
    labour_share_percent: recovery_state.labour_share_percent ?? 100,
    asset_share_percent: recovery_state.asset_share_percent ?? 0,
    overhead_share_percent: recovery_state.overhead_share_percent ?? 0,
    recovery_model: recovery_state.recovery_model ?? "labour_only",

    // outputs
    labour_recovery_cost: calculated.labour_recovery_cost,
    asset_recovery_cost: calculated.asset_recovery_cost,
    overhead_absorbed_cost: calculated.overhead_absorbed_cost,
    required_labour_recovery_rate: calculated.required_labour_recovery_rate,
    required_asset_recovery: calculated.required_asset_recovery,
    share_total: calculated.share_total,

    // flags
    share_not_balanced: calculated.share_not_balanced,
    no_productive_output: calculated.no_productive_output,
    asset_recovery_without_assets: calculated.asset_recovery_without_assets,
    labour_recovery_without_labour: calculated.labour_recovery_without_labour,

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