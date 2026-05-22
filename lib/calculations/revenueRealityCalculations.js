function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safe_divide(numerator, denominator) {
  const top = to_number(numerator);
  const bottom = to_number(denominator);

  return bottom === 0 ? 0 : top / bottom;
}

function make_warning(warning_id, message) {
  return {
    warning_id,
    message,
  };
}

function build_revenue_reality_warnings({
  total_revenue,
  total_direct_costs,
  material_margin,
  total_labour_cost_annual,
  labour_consumption_percent,
}) {
  const warnings = [];

  if (total_revenue <= 0) {
    warnings.push(
      make_warning(
        "missing_revenue",
        "Revenue is missing, so Revenue Reality cannot be tested."
      )
    );
  }

  if (total_direct_costs <= 0) {
    warnings.push(
      make_warning(
        "missing_cogs",
        "COGS / Direct Costs are missing. Confirm P&L classification before relying on this page."
      )
    );
  }

  if (total_labour_cost_annual <= 0) {
    warnings.push(
      make_warning(
        "missing_labour_cost",
        "Labour cost is missing, so the stress-tested margin after labour cannot be calculated."
      )
    );
  }

  if (material_margin < 0) {
    warnings.push(
      make_warning(
        "negative_material_margin",
        "COGS are greater than Revenue, so P&L GP / Material Margin is negative before labour is tested."
      )
    );
  }

  if (total_labour_cost_annual > 0 && material_margin - total_labour_cost_annual < 0) {
    warnings.push(
      make_warning(
        "labour_exceeds_margin",
        "Labour cost exceeds P&L GP. The business is short before assets and overheads are paid."
      )
    );
  }

  if (labour_consumption_percent >= 80 && labour_consumption_percent < 100) {
    warnings.push(
      make_warning(
        "labour_consumes_most_margin",
        "Labour consumes most of P&L GP, leaving limited margin for assets, overheads, and profit."
      )
    );
  }

  return warnings;
}

function get_revenue_reality_status({
  total_revenue,
  total_labour_cost_annual,
  stress_tested_margin_after_labour,
  labour_consumption_percent,
}) {
  if (total_revenue <= 0) {
    return "no_margin_data";
  }

  if (total_labour_cost_annual <= 0) {
    return "no_labour_data";
  }

  if (stress_tested_margin_after_labour < 0) {
    return "labour_exceeds_margin";
  }

  if (labour_consumption_percent >= 80 && labour_consumption_percent < 100) {
    return "labour_consuming_margin";
  }

  return "strong_margin_after_labour";
}

export function calculateRevenueReality({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool,
  gross_margin_percent,
  total_labour_cost_annual = 0,
  business_type = "labour_based",
  is_product_based = false,
  is_labour_based = false,
} = {}) {
  const revenue = to_number(total_revenue);
  const direct_costs = to_number(total_direct_costs);
  const source_margin = margin_pool === undefined ? revenue - direct_costs : margin_pool;
  const material_margin = to_number(source_margin);
  const labour_cost = to_number(total_labour_cost_annual);

  const material_margin_percent =
    gross_margin_percent === undefined
      ? safe_divide(material_margin, revenue) * 100
      : to_number(gross_margin_percent) * 100;

  const stress_tested_margin_after_labour = material_margin - labour_cost;
  const stress_tested_margin_percent =
    safe_divide(stress_tested_margin_after_labour, revenue) * 100;
  const labour_consumption_percent =
    safe_divide(labour_cost, material_margin) * 100;
  const remaining_margin_percent =
    safe_divide(stress_tested_margin_after_labour, material_margin) * 100;
  const labour_shortfall_against_margin = Math.max(
    labour_cost - material_margin,
    0
  );

  const resolved_business_type =
    business_type || (is_product_based ? "product_based" : "labour_based");
  const resolved_is_product_based =
    is_product_based === true || resolved_business_type === "product_based";
  const resolved_is_hours_based =
    is_labour_based === true || resolved_business_type !== "product_based";

  const revenue_reality_warnings = build_revenue_reality_warnings({
    total_revenue: revenue,
    total_direct_costs: direct_costs,
    material_margin,
    total_labour_cost_annual: labour_cost,
    labour_consumption_percent,
  });

  const revenue_reality_status = get_revenue_reality_status({
    total_revenue: revenue,
    total_labour_cost_annual: labour_cost,
    stress_tested_margin_after_labour,
    labour_consumption_percent,
  });

  return {
    total_revenue: revenue,
    total_direct_costs: direct_costs,
    material_margin,
    material_margin_percent,
    total_labour_cost_annual: labour_cost,
    stress_tested_margin_after_labour,
    stress_tested_margin_percent,
    labour_consumption_percent,
    remaining_margin_percent,
    labour_shortfall_against_margin,
    revenue_reality_ready: revenue_reality_warnings.length === 0,
    revenue_reality_warnings,
    business_type: resolved_business_type,
    is_hours_based: resolved_is_hours_based,
    is_product_based: resolved_is_product_based,
    revenue_reality_status,
  };
}
