export function normalise_recovery_model(value) {
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

export function get_total_recovery_cost(calculated = {}) {
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

export function resolve_share_percent({
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

export function get_warning_label(warning_key) {
  const warning_map = {
    business_summary_not_ready:
      "Business Summary is not ready, so Recovery Summary is preview only.",

    missing_business_type:
      "Business type is missing, so Recovery Summary cannot select the correct recovery mode.",

    missing_revenue_cogs_data:
      "Revenue / COGS data is missing, so material or unit margin cannot be tested.",

    missing_labour_cost:
      "Labour cost is missing, so labour recovery cannot be tested.",

    missing_productive_asset_utilisation:
      "A productive asset exists but productive asset utilisation hours are missing.",

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

export function get_model_label(active_recovery_model) {
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

export function get_insight(calculated = {}) {
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

export function is_business_summary_trusted(calculated = {}) {
  const warnings = Array.isArray(calculated.warnings) ? calculated.warnings : [];

  if (
    warnings.includes("business_summary_not_ready") ||
    warnings.includes("upstream_model_not_ready")
  ) {
    return false;
  }

  return (
    calculated.model_trust_state === "ready" ||
    calculated.model_trust_state === "warning"
  );
}

export function is_labour_recovery_clean(calculated = {}) {
  if (calculated.labour_share_without_productive_output === true) return false;
  if (calculated.no_productive_output === true) return false;
  if (calculated.no_recovery_hours === true) return false;

  return true;
}

export function is_asset_recovery_clean(calculated = {}) {
  if (calculated.asset_share_without_asset_recovery_base === true) return false;

  if (
    calculated.asset_recovery_included === true &&
    calculated.has_productive_asset_recovery_base !== true
  ) {
    return false;
  }

  return true;
}

export function is_material_recovery_clean(calculated = {}) {
  if (
    calculated.material_recovery_included === true &&
    calculated.material_margin_status !== "verified" &&
    calculated.gross_profit_source_status !== "trusted"
  ) {
    return false;
  }

  return true;
}

export const blocking_warning_keys = new Set([
  "business_summary_not_ready",
  "upstream_model_not_ready",
  "missing_business_type",
  "missing_revenue_cogs_data",
  "missing_labour_cost",
  "share_not_balanced",
  "no_activity_driver",
  "no_productive_output",
  "no_units_sold",
  "no_positive_margin_per_unit",
  "no_required_recovery_per_driver",
  "labour_share_without_productive_output",
  "asset_share_without_asset_recovery_base",
  "missing_productive_asset_utilisation",
]);

export function get_resolved_recovery_shares({
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
