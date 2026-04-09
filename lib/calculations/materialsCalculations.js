function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

function round_percent(value) {
  return Number(to_number(value).toFixed(1));
}

export function calculateMaterials(state = {}) {
  const annual_material_cost = round_currency(state.annual_material_cost);
  const annual_material_revenue = round_currency(state.annual_material_revenue);

  const supplied_material_cost = round_currency(state.supplied_material_cost);
  const supplied_material_revenue = round_currency(
    state.supplied_material_revenue
  );

  const resale_material_cost = round_currency(state.resale_material_cost);
  const resale_material_revenue = round_currency(state.resale_material_revenue);

  const subcontract_pass_through_cost = round_currency(
    state.subcontract_pass_through_cost
  );
  const subcontract_pass_through_revenue = round_currency(
    state.subcontract_pass_through_revenue
  );

  const material_margin_annual = round_currency(
    annual_material_revenue - annual_material_cost
  );

  const material_margin_percent =
    annual_material_revenue > 0
      ? round_percent((material_margin_annual / annual_material_revenue) * 100)
      : 0;

  const warnings = [];

  if (annual_material_revenue <= 0) {
    warnings.push("Revenue missing");
  }

  if (annual_material_cost <= 0) {
    warnings.push("Cost missing");
  }

  if (annual_material_revenue === 0 && annual_material_cost === 0) {
    warnings.push("No material inputs entered");
  }

  if (annual_material_revenue > 0 && material_margin_annual < 0) {
    warnings.push("Negative material margin");
  }

  if (annual_material_revenue > 0 && material_margin_annual === 0) {
    warnings.push("Zero material margin");
  }

  return {
    annual_material_cost,
    annual_material_revenue,
    supplied_material_cost,
    supplied_material_revenue,
    resale_material_cost,
    resale_material_revenue,
    subcontract_pass_through_cost,
    subcontract_pass_through_revenue,
    material_margin_annual,
    material_margin_percent,
    warnings,
  };
}