// O-2 (2026-10-15, owner sign-off): shortfall dollars for a working group priced PER ASSET
// (asset-linked Rate Builder calculators), where no single group blended rate exists.
// DISPLAY ONLY - no net profit, revenue or cost figure reads this. It is exactly the
// revenue BO-6 removes when assigned labour covers fewer hours than the assets need:
//   asset part  = sum over assets of  asset rate x asset hours x (1 - covered / required)
//   labour part = labour mix charge-out rate x (required - covered)
// Built from the SAME helpers build_asset_sources uses, so it reconciles to modelled revenue
// by construction. The rate map passed in already carries any Business Modelling overrides
// (Business Outcome's own baseline passes none, so the baseline only ever sees saved rates).
// Owner decision: when something cannot be priced, return what CAN be priced and say what is
// missing ("at least $X") - never a silent low number.
// required = group.required_asset_hours (SUM for one-after-another, MAX for together), the
// same basis the revenue cap uses; the gap table's hours column keeps its own basis.
import { get_asset_calculator_rate, get_asset_revenue_hours } from "@/lib/calculations/businessOutcomeAssetCalculatorRates";
import { calculate_labour_mix_charge_rate } from "@/lib/calculations/rateBuilderCalculations";

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculate_per_asset_shortfall_dollars({
  group,
  calculators = [],
  charge_out_rate_by_staff_type_id = new Map(),
  covered_hours = 0,
}) {
  const asset_assignments = Array.isArray(group?.asset_group_assignments) ? group.asset_group_assignments : [];
  const labour_assignments = Array.isArray(group?.labour_group_assignments) ? group.labour_group_assignments : [];
  const required_hours = to_number(group?.required_asset_hours ?? group?.assigned_asset_hours);
  const covered = to_number(covered_hours);
  const shortfall_hours = Math.max(0, required_hours - covered);

  if (required_hours <= 0 || shortfall_hours <= 0) {
    return { dollars: 0, is_complete: true, incomplete_reasons: [] };
  }

  const incomplete_reasons = [];

  let asset_part = 0;
  asset_assignments.forEach((assignment) => {
    const asset_calc = get_asset_calculator_rate(group.group_id, assignment.asset_id, calculators);
    if (asset_calc.rate === null) {
      incomplete_reasons.push(`${assignment.asset_name || "An asset"} has no Rate Builder price`);
      return;
    }
    const asset_hours = to_number(assignment.assigned_asset_hours);
    asset_part +=
      asset_calc.rate *
      (get_asset_revenue_hours(asset_hours, required_hours, required_hours) -
        get_asset_revenue_hours(asset_hours, covered, required_hours));
  });

  const labour_hours_total = labour_assignments.reduce((sum, a) => sum + to_number(a?.assigned_hours), 0);
  let labour_part = 0;
  if (labour_hours_total <= 0) {
    incomplete_reasons.push("no labour is assigned, so the labour part cannot be valued");
  } else {
    const unrated_count = labour_assignments.filter(
      (a) => to_number(a?.assigned_hours) > 0 && !(to_number(charge_out_rate_by_staff_type_id.get(a?.staff_type_id)) > 0)
    ).length;
    if (unrated_count > 0) {
      incomplete_reasons.push(`${unrated_count} assigned labour type(s) with no charge-out rate`);
    }
    labour_part = calculate_labour_mix_charge_rate(labour_assignments, charge_out_rate_by_staff_type_id) * shortfall_hours;
  }

  return {
    dollars: Math.round((asset_part + labour_part) * 100) / 100,
    is_complete: incomplete_reasons.length === 0,
    incomplete_reasons,
  };
}