export function safe_array(value) {
  return Array.isArray(value) ? value : [];
}

export function safe_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function build_cost_allocation_inputs({
  recovery_summary,
  labour,
  assets,
  allocation_state,
}) {
  const recovery_outputs =
    recovery_summary?.output_contract ?? recovery_summary ?? {};

  const source_staff = Array.isArray(labour?.active_staff)
    ? labour.active_staff
    : [];

  const source_assets = Array.isArray(assets?.active_assets)
    ? assets.active_assets
    : [];

  const active_staff = source_staff.filter((staff) => {
    return (
      staff?.is_active !== false &&
      staff?.contributes_to_recovery_hours === true
    );
  });

  const active_assets = source_assets.filter((asset) => {
    return asset?.is_active !== false && asset?.asset_type === "productive";
  });

  return {
    active_recovery_model:
      recovery_outputs?.active_recovery_model ?? "labour_only",

    recovery_summary_ready:
      recovery_outputs?.recovery_summary_ready === true,
    recovery_summary_status:
      recovery_outputs?.recovery_summary_status ?? "blocked",
    recovery_summary_warnings:
      safe_array(recovery_outputs?.recovery_summary_warnings),
    recovery_model: recovery_outputs?.recovery_model ?? "labour_only",
    recovery_plan_target_per_driver: safe_number(
      recovery_outputs?.recovery_plan_target_per_driver
    ),
    recovery_plan_split: recovery_outputs?.recovery_plan_split ?? null,
    component_required_recovery:
      recovery_outputs?.component_required_recovery ?? null,
    labour_recovery_cost: safe_number(recovery_outputs?.labour_recovery_cost),
    asset_recovery_cost: safe_number(recovery_outputs?.asset_recovery_cost),
    material_recovery_cost: safe_number(
      recovery_outputs?.material_recovery_cost
    ),
    overhead_absorbed_cost: safe_number(
      recovery_outputs?.overhead_absorbed_cost
    ),
    required_labour_recovery_rate: safe_number(
      recovery_outputs?.required_labour_recovery_rate
    ),
    required_asset_recovery: safe_number(
      recovery_outputs?.required_asset_recovery
    ),
    required_material_recovery: safe_number(
      recovery_outputs?.required_material_recovery
    ),
    recovery_hours_used: safe_number(recovery_outputs?.recovery_hours_used),
    required_recovery_rate: safe_number(
      recovery_outputs?.required_recovery_rate
    ),
    actual_recovery_rate: safe_number(recovery_outputs?.actual_recovery_rate),
    profit_or_deficit_per_recovery_hour: safe_number(
      recovery_outputs?.profit_or_deficit_per_recovery_hour
    ),
    business_type: recovery_outputs?.business_type ?? "labour_based",
    activity_driver_type: recovery_outputs?.activity_driver_type ?? "hours",
    activity_driver_value: safe_number(recovery_outputs?.activity_driver_value),
    margin_pool: safe_number(recovery_outputs?.margin_pool),
    total_cost_burden: safe_number(recovery_outputs?.total_cost_burden),
    net_position: safe_number(recovery_outputs?.net_position),
    model_trust_state: recovery_outputs?.model_trust_state ?? "blocked",

    labour_share_percent: safe_number(recovery_outputs?.labour_share_percent),
    asset_share_percent: safe_number(recovery_outputs?.asset_share_percent),
    material_share_percent: safe_number(
      recovery_outputs?.material_share_percent
    ),
    overhead_absorbed_percent: safe_number(
      recovery_outputs?.overhead_absorbed_percent
    ),
    overhead_share_percent: safe_number(
      recovery_outputs?.overhead_share_percent
    ),

    material_recovery_included:
      recovery_outputs?.material_recovery_included === true,
    asset_recovery_included:
      recovery_outputs?.asset_recovery_included === true,
    material_margin_status:
      recovery_outputs?.material_margin_status ?? "not_selected",
    asset_utilisation_status:
      recovery_outputs?.asset_utilisation_status ?? "not_selected",
    has_productive_asset_recovery_base:
      recovery_outputs?.has_productive_asset_recovery_base === true,
    productive_asset_count: safe_number(
      recovery_outputs?.productive_asset_count
    ),
    support_asset_count: safe_number(recovery_outputs?.support_asset_count),
    productive_asset_cost: safe_number(recovery_outputs?.productive_asset_cost),
    support_asset_cost: safe_number(recovery_outputs?.support_asset_cost),

    active_staff: active_staff.map((staff) => ({
      staff_id: staff?.staff_id ?? "",
      staff_name: staff?.staff_name ?? "Unnamed staff",
      staff_role: staff?.staff_role ?? "",
      labour_class: staff?.labour_class ?? "",
      is_active: Boolean(staff?.is_active),
      productive_hours: safe_number(staff?.productive_hours),
      contributes_to_recovery_hours:
        staff?.contributes_to_recovery_hours === true,
    })),

    active_assets: active_assets.map((asset) => ({
      asset_id: asset?.asset_id ?? "",
      asset_name: asset?.asset_name ?? "Unnamed asset",
      asset_type: asset?.asset_type ?? "",
      is_active: Boolean(asset?.is_active),
    })),

    allocation_profile_name:
      allocation_state?.allocation_profile_name ?? "Default Allocation Profile",

    effective_from: allocation_state?.effective_from ?? "",

    asset_labour_links: safe_array(allocation_state?.asset_labour_links),

    operational_groups: safe_array(allocation_state?.operational_groups),

    active_allocation_profile_id:
      allocation_state?.active_allocation_profile_id ?? "live",

    external_delivery_enabled:
      allocation_state?.external_delivery_enabled === true,
    external_delivery_note: allocation_state?.external_delivery_note ?? "",
  };
}
