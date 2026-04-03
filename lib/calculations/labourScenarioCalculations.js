import { calculateLabourOutputs as runLabourCalculations } from "./labourCalculations";

function cleanOverride(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normaliseProductivity(value) {
  if (value === undefined) return undefined;

  // Allows:
  // 80  -> 80
  // 0.8 -> 80
  return value <= 1 ? value * 100 : value;
}

function normaliseMargin(value) {
  if (value === undefined) return undefined;

  // Allows:
  // 0.2 -> 0.2
  // 20  -> 0.2
  return value > 1 ? value / 100 : value;
}

export function calculateScenarioLabour({
  labour_state = {},
  labour_outputs = {},
  scenario_overrides = {},
}) {
  // Step 0 — clean + normalise overrides before state resolution
  const labour_rate = cleanOverride(scenario_overrides.labour_rate);
  const charge_out_rate = cleanOverride(scenario_overrides.charge_out_rate);
  const productivity_raw = cleanOverride(scenario_overrides.productivity_percent);
  const margin_raw = cleanOverride(scenario_overrides.margin_target_percent);

  const productivity_percent = normaliseProductivity(productivity_raw);

  // Labour engine expects whole percent, so convert decimal margin back to whole percent
  const margin_decimal = normaliseMargin(margin_raw);
  const margin_target_percent =
    margin_decimal === undefined ? undefined : margin_decimal * 100;

  const normalised_overrides = {
    ...(labour_rate !== undefined ? { labour_rate } : {}),
    ...(charge_out_rate !== undefined ? { charge_out_rate } : {}),
    ...(productivity_percent !== undefined ? { productivity_percent } : {}),
    ...(margin_target_percent !== undefined ? { margin_target_percent } : {}),
  };

  const hasOverrides = Object.keys(normalised_overrides).length > 0;

  // Step 1 + 2 — resolve effective state and rerun Labour engine only when needed
  const scenario_outputs = hasOverrides
    ? runLabourCalculations({
        ...labour_state,
        ...normalised_overrides,
      })
    : labour_outputs;

  // Step 3 — resolve effective charge-out correctly
  const effective_charge_out_rate =
    charge_out_rate ??
    Number(labour_outputs.charge_out_rate ?? labour_state.charge_out_rate ?? 0);

  // Step 4 — derive allowed scenario metrics
  const productive_labour_cost_rate = Number(
    scenario_outputs.productive_labour_cost_rate ?? 0
  );

  const labour_cost_rate = Number(
    scenario_outputs.labour_cost_rate ?? productive_labour_cost_rate
  );

  const minimum_charge_out_rate = Number(
    scenario_outputs.minimum_charge_out_rate ?? 0
  );

  const profit_per_hour =
    effective_charge_out_rate - productive_labour_cost_rate;

  const above_recovery =
    effective_charge_out_rate - minimum_charge_out_rate;

  return {
    productive_labour_cost_rate,
    labour_cost_rate,
    minimum_charge_out_rate,
    profit_per_hour,
    above_recovery,
  };
}

export default calculateScenarioLabour;