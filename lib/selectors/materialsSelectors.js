function get_margin_health(material_margin_annual = 0, material_margin_percent = 0) {
  if (material_margin_annual < 0) return "bad";
  if (material_margin_percent < 10) return "ok";
  return "good";
}

export function buildMaterialsStatus({
  materials_state = {},
  calculated = {},
} = {}) {
  const revenue_entered = (calculated.annual_material_revenue ?? 0) > 0;
  const cost_entered = (calculated.annual_material_cost ?? 0) > 0;
  const margin_health = get_margin_health(
    calculated.material_margin_annual,
    calculated.material_margin_percent
  );

  return {
    profile_active: Boolean(materials_state.is_active ?? true),
    annual_material_revenue: calculated.annual_material_revenue ?? 0,
    annual_material_cost: calculated.annual_material_cost ?? 0,
    material_margin_annual: calculated.material_margin_annual ?? 0,
    material_margin_percent: calculated.material_margin_percent ?? 0,
    margin_health,
    revenue_entered,
    cost_entered,
    warning_count: Array.isArray(calculated.warnings)
      ? calculated.warnings.length
      : 0,
    warnings: calculated.warnings ?? [],
  };
}

export function buildMaterialsCard({
  materials_state = {},
  calculated = {},
  update_materials_field = () => {},
  reset_materials_state = () => {},
} = {}) {
  return {
    annual_material_cost: materials_state.annual_material_cost ?? 0,
    annual_material_revenue: materials_state.annual_material_revenue ?? 0,

    supplied_material_cost: materials_state.supplied_material_cost ?? 0,
    supplied_material_revenue: materials_state.supplied_material_revenue ?? 0,
    resale_material_cost: materials_state.resale_material_cost ?? 0,
    resale_material_revenue: materials_state.resale_material_revenue ?? 0,
    subcontract_pass_through_cost:
      materials_state.subcontract_pass_through_cost ?? 0,
    subcontract_pass_through_revenue:
      materials_state.subcontract_pass_through_revenue ?? 0,

    material_margin_annual: calculated.material_margin_annual ?? 0,
    material_margin_percent: calculated.material_margin_percent ?? 0,
    warnings: calculated.warnings ?? [],

    on_annual_material_cost_change: (value) =>
      update_materials_field("annual_material_cost", value),

    on_annual_material_revenue_change: (value) =>
      update_materials_field("annual_material_revenue", value),

    on_supplied_material_cost_change: (value) =>
      update_materials_field("supplied_material_cost", value),

    on_supplied_material_revenue_change: (value) =>
      update_materials_field("supplied_material_revenue", value),

    on_resale_material_cost_change: (value) =>
      update_materials_field("resale_material_cost", value),

    on_resale_material_revenue_change: (value) =>
      update_materials_field("resale_material_revenue", value),

    on_subcontract_pass_through_cost_change: (value) =>
      update_materials_field("subcontract_pass_through_cost", value),

    on_subcontract_pass_through_revenue_change: (value) =>
      update_materials_field("subcontract_pass_through_revenue", value),

    on_reset: reset_materials_state,
  };
}

export function buildMaterialsSummary({ calculated = {} } = {}) {
  const margin_health = get_margin_health(
    calculated.material_margin_annual,
    calculated.material_margin_percent
  );

  return {
    annual_material_revenue: calculated.annual_material_revenue ?? 0,
    annual_material_cost: calculated.annual_material_cost ?? 0,
    material_margin_annual: calculated.material_margin_annual ?? 0,
    material_margin_percent: calculated.material_margin_percent ?? 0,
    margin_health,
  };
}