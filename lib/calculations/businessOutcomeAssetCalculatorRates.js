// Path B Stage 1b (2026-10-09, owner decision): an asset-linked Rate Builder
// calculator prices the MACHINE ONLY. The operator is charged once, through
// the Labour tab rate, on the labour row - so nothing is subtracted here
// (unlike the legacy all-in group calculator, CM-1). Each asset earns its
// own rate x its own hours, scaled down when labour does not cover the
// required hours (required = SUM for "one after another", MAX for
// "together" - required_asset_hours from Cost Allocation).
import {
  calculateRateBuilderQuotePreview,
  get_calculator_recovery_hours,
} from "@/lib/calculations/rateBuilderCalculations";

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function has_lines(calculator) {
  return Array.isArray(calculator?.lines) && calculator.lines.length > 0;
}

export function group_has_asset_calculators(group_id, calculators = []) {
  return (Array.isArray(calculators) ? calculators : []).some(
    (calc) =>
      calc?.linked_cost_allocation_group_id === group_id &&
      Boolean(calc?.linked_asset_id) &&
      has_lines(calc)
  );
}

export function get_asset_calculator_rate(group_id, asset_id, calculators = []) {
  const calculator = (Array.isArray(calculators) ? calculators : []).find(
    (calc) =>
      calc?.linked_cost_allocation_group_id === group_id &&
      Boolean(calc?.linked_asset_id) &&
      calc.linked_asset_id === asset_id
  );
  if (!calculator || !has_lines(calculator)) {
    return { rate: null, reason: "No Rate Builder price set for this asset" };
  }
  const preview = calculateRateBuilderQuotePreview(calculator.lines);
  const hours = get_calculator_recovery_hours(preview.line_totals, preview.output_driver_quantity);
  if (hours <= 0 || !to_number(preview.total_charge)) {
    return { rate: null, reason: "Calculator recovery driver not set" };
  }
  return { rate: to_number(preview.total_charge) / hours, reason: null };
}

export function get_asset_revenue_hours(asset_hours, covered_hours, required_hours) {
  const own = to_number(asset_hours);
  const required = to_number(required_hours);
  if (required <= 0) {
    return own;
  }
  return own * Math.min(1, to_number(covered_hours) / required);
}