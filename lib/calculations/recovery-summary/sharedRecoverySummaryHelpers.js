export const BALANCE_TOLERANCE = 0.0001;

export function to_number(value) {
  const numeric_value = Number(value);
  return Number.isFinite(numeric_value) ? numeric_value : 0;
}

export function is_numeric_input(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  return Number.isFinite(Number(value));
}

export function round_currency(value) {
  return Number(to_number(value).toFixed(2));
}

export function round_percent(value) {
  return Number(to_number(value).toFixed(2));
}

function get_unit_type_display(value) {
  const display_map = {
    m2: "m²",
    m3: "m³",
    lm: "lineal metre",
    tonne: "tonne",
    hour: "hour",
    each: "unit",
    custom: "unit",
  };

  return display_map[value] || "unit";
}

export function get_product_unit_display({
  commercial_driver_mode,
  primary_unit_label,
  primary_unit_type,
  unit_driver_rows = [],
}) {
  if (commercial_driver_mode === "mixed_unit_based") {
    return {
      product_unit_label: "Weighted unit",
      product_unit_type: "blended",
      product_unit_type_label: "blended unit",
      product_unit_margin_label: "Weighted margin per blended unit",
      product_required_cost_label: "Required cost per blended unit",
      product_surplus_gap_label: "Surplus / gap per blended unit",
      product_total_units_label: "Total units",
      product_unit_suffix: "blended units",
      product_rate_suffix: "/blended unit",
    };
  }

  const first_unit_row = Array.isArray(unit_driver_rows)
    ? unit_driver_rows[0]
    : null;
  const unit_type = primary_unit_type || first_unit_row?.unit_type || "each";
  const unit_type_label = get_unit_type_display(unit_type);
  const unit_label = primary_unit_label || first_unit_row?.unit_label || "";
  const label_prefix =
    unit_label && unit_type !== "each" && unit_type !== "custom"
      ? `${unit_label} `
      : "";

  return {
    product_unit_label: unit_label || "Unit",
    product_unit_type: unit_type,
    product_unit_type_label: unit_type_label,
    product_unit_margin_label: `${label_prefix}Margin per ${unit_type_label}`,
    product_required_cost_label: `Required cost per ${unit_type_label}`,
    product_surplus_gap_label: `Surplus / gap per ${unit_type_label}`,
    product_total_units_label: `Total units: ${unit_type_label}`,
    product_unit_suffix: unit_type_label,
    product_rate_suffix: `/${unit_type_label}`,
  };
}

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
