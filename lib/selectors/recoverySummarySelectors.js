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

function safe_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function get_total_recovery_cost(calculated = {}) {
  return (
    safe_number(calculated.labour_recovery_cost) +
    safe_number(calculated.asset_recovery_cost) +
    safe_number(calculated.material_recovery_cost) +
    safe_number(calculated.overhead_absorbed_cost)
  );
}

function get_cost_based_share_percent(component_cost, total_cost) {
  const component = safe_number(component_cost);
  const total = safe_number(total_cost);

  if (component <= 0 || total <= 0) return 0;

  return (component / total) * 100;
}

function resolve_share_percent({
  displayed_percent,
  component_cost,
  total_cost,
}) {
  const displayed = safe_number(displayed_percent);
  const component = safe_number(component_cost);

  if (displayed > 0) return displayed;

  if (component > 0) {
    return get_cost_based_share_percent(component, total_cost);
  }

  return 0;
}

function get_warning_label(warning_key) {
  const warning_map = {
    business_summary_not_ready:
      "Business Summary is not ready, so Recovery Summary is preview only.",

    upstream_model_not_ready:
      "The upstream model is not trusted, so Recovery Summary is not final.",

    share_not_balanced:
      "Explained recovery shares cannot exceed 100%. Reduce labour, asset, or materials / products recovery.",

    overhead_absorption_review:
      "Some recovery is not yet assigned to labour, assets, or materials / products.",

    overhead_absorption_high:
      "A significant portion of recovery is not yet assigned to a clear driver. Review the recovery split before relying on this model.",

    no_activity_driver:
      "No activity driver is available, so recovery per output cannot be calculated.",

    no_productive_output:
      "No recovery hours are available. Labour recovery rate cannot be calculated.",

    no_units_sold:
      "Units sold are required to calculate product-based recovery pressure.",

    no_positive_margin_per_unit:
      "Product margin per unit is not positive, so unit volume cannot recover the business cost burden.",

    product_unit_shortfall:
      "Current unit volume is below the break-even unit requirement.",

    no_required_recovery_per_driver:
      "Required recovery per driver is not available from Business Summary.",

    negative_margin_pool:
      "Business Summary shows that direct costs are currently higher than revenue.",

    negative_net_position:
      "Business Summary shows that margin pool is currently below the total cost burden.",

    recovery_gap_negative:
      "The business is not currently generating enough margin to meet its required recovery level.",

    material_margin_unverified:
      "Materials / products recovery is included, but actual material or product margin is not yet verified.",

    asset_utilisation_unverified:
      "Asset recovery is included, but actual asset utilisation is currently estimated.",

    asset_share_without_asset_recovery_base:
      "Asset recovery is selected, but no productive asset recovery base is available.",

    labour_share_without_productive_output:
      "Labour recovery is selected, but no recovery hours are available.",
  };

  return warning_map[warning_key] || "Unknown recovery issue.";
}

function get_model_label(active_recovery_model) {
  const model_map = {
    labour_only: "Labour-led recovery",
    labour_led: "Labour-led recovery",
    asset_driven: "Asset-led recovery",
    asset_led: "Asset-led recovery",
    material_led: "Materials / products-led recovery",
    hybrid: "Hybrid recovery",
  };

  return (
    model_map[active_recovery_model] ||
    active_recovery_model ||
    "Labour-led recovery"
  );
}

function get_insight(calculated = {}) {
  if (calculated.activity_driver_value <= 0) {
    return "Recovery cannot be translated into the selected activity driver until Business Summary has a valid driver value.";
  }

  const active_recovery_model = normalise_recovery_model(
    calculated.active_recovery_model
  );

  const total_recovery_cost = get_total_recovery_cost(calculated);

  const asset_share_percent = resolve_share_percent({
    displayed_percent: calculated.asset_share_percent,
    component_cost: calculated.asset_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const material_share_percent = resolve_share_percent({
    displayed_percent: calculated.material_share_percent,
    component_cost: calculated.material_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const overhead_absorbed_percent = resolve_share_percent({
    displayed_percent:
      calculated.overhead_absorbed_percent ?? calculated.overhead_share_percent,
    component_cost: calculated.overhead_absorbed_cost,
    total_cost: total_recovery_cost,
  });

  if (active_recovery_model === "labour_led") {
    return "The business cost burden is currently being viewed through labour-led recovery.";
  }

  if (active_recovery_model === "asset_led") {
    return "The business cost burden is currently being viewed through asset-led recovery.";
  }

  if (active_recovery_model === "material_led") {
    return "The business cost burden is currently being viewed through materials / products-led recovery. Actual material or product margin will become clearer through live job feedback.";
  }

  if (
    asset_share_percent > 0 &&
    material_share_percent > 0 &&
    overhead_absorbed_percent > 0
  ) {
    return "Recovery is distributed across labour, productive assets, materials / products, and unexplained recovery allowance.";
  }

  if (asset_share_percent > 0 && material_share_percent > 0) {
    return "Recovery is distributed across labour, productive assets, and materials / products.";
  }

  if (asset_share_percent > 0) {
    return "Part of the cost burden is being assigned to productive asset-supported recovery.";
  }

  if (material_share_percent > 0) {
    return "Part of the cost burden is being assigned to materials / products contribution.";
  }

  if (overhead_absorbed_percent > 0) {
    return "A portion of the recovery model is being held as unexplained recovery allowance rather than being assigned to labour, productive assets, or materials / products.";
  }

  return "Recovery structure is defined and ready for validation.";
}

const blocking_warning_keys = new Set([
  "business_summary_not_ready",
  "upstream_model_not_ready",
  "share_not_balanced",
  "no_activity_driver",
  "no_productive_output",
  "no_units_sold",
  "no_positive_margin_per_unit",
  "no_required_recovery_per_driver",
  "labour_share_without_productive_output",
  "asset_share_without_asset_recovery_base",
]);

export function buildRecoverySummaryStatus({ calculated = {} } = {}) {
  const warning_items = (calculated.warnings ?? []).map((warning_key) => ({
    warning_key,
    label: get_warning_label(warning_key),
  }));

  const has_blocking_driver =
    (calculated.warnings ?? []).includes("no_activity_driver") ||
    (calculated.warnings ?? []).includes("no_required_recovery_per_driver");

  const has_blocking_warning = warning_items.some((warning) =>
    blocking_warning_keys.has(warning.warning_key)
  );

  const has_commercial_warnings =
    warning_items.length > 0 && !has_blocking_warning;

  const recovery_summary_status =
    has_blocking_driver || has_blocking_warning
      ? "blocked"
      : calculated.model_trust_state !== "ready" &&
          calculated.model_trust_state !== "warning"
        ? "not_trusted"
        : warning_items.length === 0
          ? "ready"
          : "ready_with_warnings";

  const recovery_summary_ready =
    recovery_summary_status === "ready" ||
    recovery_summary_status === "ready_with_warnings";

  const active_recovery_model = normalise_recovery_model(
    calculated.active_recovery_model
  );

  const total_recovery_cost = get_total_recovery_cost(calculated);

  const labour_share_percent = resolve_share_percent({
    displayed_percent: calculated.labour_share_percent ?? 100,
    component_cost: calculated.labour_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const asset_share_percent = resolve_share_percent({
    displayed_percent: calculated.asset_share_percent ?? 0,
    component_cost: calculated.asset_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const material_share_percent = resolve_share_percent({
    displayed_percent: calculated.material_share_percent ?? 0,
    component_cost: calculated.material_recovery_cost,
    total_cost: total_recovery_cost,
  });

  const overhead_absorbed_percent = resolve_share_percent({
    displayed_percent:
      calculated.overhead_absorbed_percent ??
      calculated.overhead_share_percent ??
      0,
    component_cost: calculated.overhead_absorbed_cost,
    total_cost: total_recovery_cost,
  });

  return {
    recovery_summary_ready,
    recovery_summary_status,
    recovery_summary_warnings: warning_items,
    recovery_summary_usable: recovery_summary_ready,
    has_blocking_warnings: has_blocking_warning,
    has_commercial_warnings,

    active_recovery_model,
    active_recovery_model_label: get_model_label(active_recovery_model),

    labour_share_percent,
    asset_share_percent,
    material_share_percent,
    overhead_absorbed_percent,
    overhead_share_percent: overhead_absorbed_percent,

    explained_recovery_total: calculated.explained_recovery_total ?? 100,

    recovery_ready: recovery_summary_ready,
    warning_count: warning_items.length,
    warning_items,
  };
}

function get_resolved_recovery_shares({
  calculated = {},
  recovery_state = {},
  use_saved_split = false,
}) {
  const total_recovery_cost = get_total_recovery_cost(calculated);

  const labour_display_percent = use_saved_split
    ? recovery_state.labour_share_percent ?? 100
    : calculated.labour_share_percent ??
      calculated.suggested_labour_share_percent ??
      100;

  const asset_display_percent = use_saved_split
    ? recovery_state.asset_share_percent ?? 0
    : calculated.asset_share_percent ??
      calculated.suggested_asset_share_percent ??
      0;

  const material_display_percent = use_saved_split
    ? recovery_state.material_share_percent ?? 0
    : calculated.material_share_percent ??
      calculated.suggested_material_share_percent ??
      0;

  const overhead_display_percent =
    calculated.overhead_absorbed_percent ??
    calculated.overhead_share_percent ??
    calculated.suggested_overhead_absorbed_percent ??
    0;

  return {
    labour_share_percent: resolve_share_percent({
      displayed_percent: labour_display_percent,
      component_cost: calculated.labour_recovery_cost,
      total_cost: total_recovery_cost,
    }),

    asset_share_percent: resolve_share_percent({
      displayed_percent: asset_display_percent,
      component_cost: calculated.asset_recovery_cost,
      total_cost: total_recovery_cost,
    }),

    material_share_percent: resolve_share_percent({
      displayed_percent: material_display_percent,
      component_cost: calculated.material_recovery_cost,
      total_cost: total_recovery_cost,
    }),

    overhead_absorbed_percent: resolve_share_percent({
      displayed_percent: overhead_display_percent,
      component_cost: calculated.overhead_absorbed_cost,
      total_cost: total_recovery_cost,
    }),
  };
}

export function buildRecoverySummaryCard({
  calculated = {},
  recovery_state = {},
  update_recovery_field = () => {},
  reset_recovery_state = () => {},
} = {}) {
  const recovery_model = normalise_recovery_model(
    recovery_state.recovery_model ??
      calculated.recovery_model ??
      calculated.suggested_recovery_model
  );

  const use_saved_split =
    recovery_state.split_manually_overridden === true ||
    recovery_model !== "hybrid";

  const resolved_shares = get_resolved_recovery_shares({
    calculated,
    recovery_state,
    use_saved_split,
  });

  const resolved_overhead_absorbed_percent =
    resolved_shares.overhead_absorbed_percent;

  return {
    active_recovery_model: normalise_recovery_model(
      calculated.active_recovery_model
    ),
    recovery_model,

    business_type: calculated.business_type ?? "labour_based",
    is_product_based: calculated.is_product_based === true,
    is_labour_based: calculated.is_labour_based !== false,
    activity_driver_type: calculated.activity_driver_type ?? "hours",
    activity_driver_label:
      calculated.activity_driver_label ?? "Selected recovery hours",
    activity_driver_value: calculated.activity_driver_value ?? 0,

    required_recovery_per_driver:
      calculated.required_recovery_per_driver ?? 0,
    current_margin_per_driver: calculated.current_margin_per_driver ?? 0,
    recovery_gap_per_driver: calculated.recovery_gap_per_driver ?? 0,
    recovery_plan_target_per_driver:
      calculated.recovery_plan_target_per_driver ?? 0,

    total_revenue: calculated.total_revenue ?? 0,
    total_direct_costs: calculated.total_direct_costs ?? 0,
    margin_pool: calculated.margin_pool ?? 0,
    gross_profit: calculated.gross_profit ?? calculated.margin_pool ?? 0,
    gross_margin_percent: calculated.gross_margin_percent ?? 0,

    total_cost_burden: calculated.total_cost_burden ?? 0,
    total_people_cost_annual: calculated.total_people_cost_annual ?? 0,
    total_asset_cost_annual: calculated.total_asset_cost_annual ?? 0,
    total_business_overheads: calculated.total_business_overheads ?? 0,
    cost_burden_breakdown: calculated.cost_burden_breakdown ?? {
      people: {},
      assets: {},
      business_overheads: {},
    },

    has_productive_asset_recovery_base:
      calculated.has_productive_asset_recovery_base === true,
    productive_asset_count: calculated.productive_asset_count ?? 0,
    support_asset_count: calculated.support_asset_count ?? 0,
    productive_asset_cost: calculated.productive_asset_cost ?? 0,
    support_asset_cost: calculated.support_asset_cost ?? 0,

    required_revenue: calculated.required_revenue ?? 0,
    required_recovery_rate:
      calculated.required_recovery_rate ??
      calculated.required_recovery_per_driver ??
      0,

    total_recovery_hours: calculated.total_recovery_hours ?? 0,
    recovery_hours_used: calculated.recovery_hours_used ?? 0,
    actual_recovery_rate: calculated.actual_recovery_rate ?? 0,
    profit_or_deficit_per_recovery_hour:
      calculated.profit_or_deficit_per_recovery_hour ?? 0,

    total_productive_output: calculated.total_productive_output ?? 0,
    units_sold_annual: calculated.units_sold_annual ?? 0,
    margin_per_unit: calculated.margin_per_unit ?? 0,
    required_units_to_break_even:
      calculated.required_units_to_break_even ?? 0,
    unit_surplus_or_shortfall:
      calculated.unit_surplus_or_shortfall ?? 0,
    product_recovery_ready: calculated.product_recovery_ready === true,
    product_recovery_status:
      calculated.product_recovery_status ?? "not_recoverable",
    net_position: calculated.net_position ?? 0,

    labour_share_percent: resolved_shares.labour_share_percent,
    asset_share_percent: resolved_shares.asset_share_percent,
    material_share_percent: resolved_shares.material_share_percent,

    overhead_absorbed_percent: resolved_overhead_absorbed_percent,
    overhead_share_percent: resolved_overhead_absorbed_percent,

    suggested_recovery_model: calculated.suggested_recovery_model,
    suggested_labour_share_percent:
      calculated.suggested_labour_share_percent ??
      resolved_shares.labour_share_percent,
    suggested_asset_share_percent:
      calculated.suggested_asset_share_percent ??
      resolved_shares.asset_share_percent,
    suggested_material_share_percent:
      calculated.suggested_material_share_percent ??
      resolved_shares.material_share_percent,
    suggested_overhead_absorbed_percent:
      calculated.suggested_overhead_absorbed_percent ??
      resolved_overhead_absorbed_percent,
    split_source: calculated.split_source,

    recovery_plan_split: calculated.recovery_plan_split,
    component_required_recovery: calculated.component_required_recovery,

    labour_recovery_cost: calculated.labour_recovery_cost ?? 0,
    asset_recovery_cost: calculated.asset_recovery_cost ?? 0,
    material_recovery_cost: calculated.material_recovery_cost ?? 0,
    overhead_absorbed_cost: calculated.overhead_absorbed_cost ?? 0,

    required_labour_recovery_rate:
      calculated.required_labour_recovery_rate ?? 0,

    required_labour_recovery_rate_per_recovery_hour:
      calculated.required_labour_recovery_rate_per_recovery_hour ?? 0,

    required_asset_recovery_per_recovery_hour:
      calculated.required_asset_recovery_per_recovery_hour ?? 0,

    required_material_recovery_per_recovery_hour:
      calculated.required_material_recovery_per_recovery_hour ?? 0,

    overhead_absorbed_cost_per_recovery_hour:
      calculated.overhead_absorbed_cost_per_recovery_hour ?? 0,

    required_asset_recovery: calculated.required_asset_recovery ?? 0,
    required_material_recovery: calculated.required_material_recovery ?? 0,

    explained_recovery_total: calculated.explained_recovery_total ?? 100,
    share_total: calculated.share_total ?? 100,

    gross_profit_source_status:
      calculated.gross_profit_source_status ?? "pending_live_feedback",
    material_margin_status: calculated.material_margin_status ?? "not_selected",
    asset_utilisation_status:
      calculated.asset_utilisation_status ?? "not_selected",
    material_recovery_included: Boolean(calculated.material_recovery_included),
    asset_recovery_included: Boolean(calculated.asset_recovery_included),

    overhead_absorption_level:
      calculated.overhead_absorption_level ?? "none",
    overhead_absorption_title:
      calculated.overhead_absorption_title ?? "Recovery model is fully assigned",
    overhead_absorption_message: calculated.overhead_absorption_message ?? "",
    overhead_absorption_diagnostics:
      calculated.overhead_absorption_diagnostics ?? [],

    share_not_balanced: Boolean(calculated.share_not_balanced),
    no_productive_output: Boolean(calculated.no_productive_output),
    no_recovery_hours: Boolean(calculated.no_recovery_hours),

    asset_recovery_without_assets: Boolean(
      calculated.asset_share_without_asset_recovery_base
    ),

    labour_recovery_without_labour: Boolean(
      calculated.labour_share_without_productive_output
    ),

    insight_text: get_insight(calculated),

    on_recovery_model_change: (value) => {
      const next_recovery_model = normalise_recovery_model(value);

      update_recovery_field("recovery_model", next_recovery_model, {
        manual_override: false,
      });

      if (next_recovery_model === "labour_led") {
        update_recovery_field("labour_share_percent", 100, {
          manual_override: false,
        });
        update_recovery_field("asset_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("material_share_percent", 0, {
          manual_override: false,
        });
        return;
      }

      if (next_recovery_model === "asset_led") {
        update_recovery_field("labour_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("asset_share_percent", 100, {
          manual_override: false,
        });
        update_recovery_field("material_share_percent", 0, {
          manual_override: false,
        });
        return;
      }

      if (next_recovery_model === "material_led") {
        update_recovery_field("labour_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("asset_share_percent", 0, {
          manual_override: false,
        });
        update_recovery_field("material_share_percent", 100, {
          manual_override: false,
        });
        return;
      }

      if (next_recovery_model === "hybrid") {
        update_recovery_field(
          "labour_share_percent",
          calculated.suggested_labour_share_percent ??
            resolved_shares.labour_share_percent ??
            50,
          { manual_override: false }
        );
        update_recovery_field(
          "asset_share_percent",
          calculated.suggested_asset_share_percent ??
            resolved_shares.asset_share_percent ??
            25,
          { manual_override: false }
        );
        update_recovery_field(
          "material_share_percent",
          calculated.suggested_material_share_percent ??
            resolved_shares.material_share_percent ??
            25,
          { manual_override: false }
        );
      }
    },

    on_labour_share_change: (value) =>
      update_recovery_field("labour_share_percent", value),

    on_asset_share_change: (value) =>
      update_recovery_field("asset_share_percent", value),

    on_material_share_change: (value) =>
      update_recovery_field("material_share_percent", value),

    on_reset: () => {
      update_recovery_field(
        "recovery_model",
        calculated.suggested_recovery_model ?? "labour_led",
        { manual_override: false }
      );
      update_recovery_field(
        "labour_share_percent",
        calculated.suggested_labour_share_percent ??
          resolved_shares.labour_share_percent ??
          100,
        { manual_override: false }
      );
      update_recovery_field(
        "asset_share_percent",
        calculated.suggested_asset_share_percent ??
          resolved_shares.asset_share_percent ??
          0,
        { manual_override: false }
      );
      update_recovery_field(
        "material_share_percent",
        calculated.suggested_material_share_percent ??
          resolved_shares.material_share_percent ??
          0,
        { manual_override: false }
      );
    },
  };
}